import { BaseService } from "@/server/core/BaseService";
import { RequestContext } from "@/server/core/RequestContext";
import { TransactionManager } from "@/server/db";
import { Result, success, fail } from "@/server/core/Result";
import { WorkOrderRepository } from "./workorder.repository";
import { CreateWorkOrderDTO, UpdateWorkOrderDTO, AssignWorkOrderDTO } from "./workorder.types";
import { CreateWorkOrderSchema, UpdateWorkOrderSchema, AssignWorkOrderSchema } from "./workorder.validation";
import { InventoryFacade } from "@/domain/inventory/public";
import { SequenceService } from "@/server/core/sequence/SequenceService";
import { MoneyCalculator } from "@/server/core/money/MoneyCalculator";
import { Money } from "@/server/core/money/Money";
import { WorkOrderStatus } from "@prisma/client";
import { SquareFootCalculator } from "./square-foot-calculator";
import { SquareFootParser } from "@/domain/report/square-foot-parser";

export class WorkOrderService extends BaseService {
  constructor(ctx: RequestContext) {
    super(ctx);
  }

  async createWorkOrder(dto: CreateWorkOrderDTO) {
    const validationResult = CreateWorkOrderSchema.safeParse(dto);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return fail(new Error(`Validation failed: ${errors}`));
    }

    return TransactionManager.run(async (tx) => {
      const repo = new WorkOrderRepository(tx);

      const orderNumber = await SequenceService.reserveSequence(tx, this.ctx.companyId, "WO", "WO");

      const processedLineItems = dto.lineItems.map(li => {
        let quantity = li.quantity || 1;
        let unitPrice = li.unitPrice || 0;
        let desc = li.description;
        
        if (li.isSqFt) {
          const sqftPerItem = SquareFootCalculator.calculateSqFt(li.width || 0, li.height || 0);
          unitPrice = SquareFootCalculator.calculateLineTotal(sqftPerItem, li.rate || 0);
          desc += ` (${li.width} x ${li.height} = ${sqftPerItem} sqft @ $${li.rate}/sqft)`;
        }

        const total = (quantity * unitPrice) * (1 + (li.taxRate || 0) / 100);

        return {
          inventoryItemId: li.inventoryItemId,
          description: desc,
          quantity,
          unitPrice,
          taxRate: li.taxRate || 0,
          total,
        };
      });

      let subtotal = 0;
      let tax = 0;
      let total = 0;

      for (const item of processedLineItems) {
        const itemTotal = item.quantity * item.unitPrice;
        const itemTax = itemTotal * (item.taxRate / 100);
        
        subtotal = MoneyCalculator.add(Money.fromNumber(subtotal), Money.fromNumber(itemTotal)).toNumber();
        tax = MoneyCalculator.add(Money.fromNumber(tax), Money.fromNumber(itemTax)).toNumber();
        total = MoneyCalculator.add(Money.fromNumber(total), MoneyCalculator.add(Money.fromNumber(itemTotal), Money.fromNumber(itemTax))).toNumber();
      }

      const workOrder = await repo.createWithLineItems({
        companyId: this.ctx.companyId,
        customerId: dto.customerId,
        orderNumber,
        title: dto.title,
        description: dto.description,
        priority: dto.priority || 0,
        expectedDate: dto.expectedDate,
        subtotal,
        tax,
        total,
        inventoryStatus: "UNRESERVED",
        status: WorkOrderStatus.PENDING,
      }, processedLineItems);

      // Create Activity Log
      await tx.activityLog.create({
        data: {
          companyId: this.ctx.companyId,
          userId: this.ctx.userId,
          action: "CREATED",
          entityType: "WorkOrder",
          entityId: workOrder.id,
          details: JSON.stringify({ status: WorkOrderStatus.PENDING, title: workOrder.title }),
        }
      });

      return success(workOrder);
    });
  }

  async editWorkOrder(id: string, dto: UpdateWorkOrderDTO) {
    const validationResult = UpdateWorkOrderSchema.safeParse(dto);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return fail(new Error(`Validation failed: ${errors}`));
    }

    return TransactionManager.run(async (tx) => {
      const repo = new WorkOrderRepository(tx);
      const wo = await repo.findByIdWithDetails(id, this.ctx.companyId);
      if (!wo) return fail(new Error("Work Order not found"));

      const updated = await repo.update(id, this.ctx.companyId, dto);
      return success(updated);
    });
  }

  async cancelWorkOrder(id: string) {
    return TransactionManager.run(async (tx) => {
      const repo = new WorkOrderRepository(tx);

      const wo = await repo.findByIdWithDetails(id, this.ctx.companyId);
      if (!wo) return fail(new Error("Work Order not found"));
      
      if (wo.status === WorkOrderStatus.COMPLETED || wo.status === WorkOrderStatus.DELIVERED) {
        return fail(new Error("Cannot cancel a completed or delivered work order"));
      }

      await repo.update(id, this.ctx.companyId, { status: WorkOrderStatus.CANCELLED });

      // Release reserved stock
      for (const item of wo.lineItems) {
        if (item.inventoryItemId && wo.inventoryStatus === "RESERVED") {
          const parsed = SquareFootParser.parse(item.description);
          const releaseQty = parsed ? parsed.sqft * item.quantity : item.quantity;
          
          await InventoryFacade.releaseStock(this.ctx, {
            itemId: item.inventoryItemId,
            quantity: releaseQty,
            referenceType: "WorkOrder",
            referenceId: wo.id
          });
        }
      }

      return success(true);
    });
  }

  async completeWorkOrder(id: string) {
    return TransactionManager.run(async (tx) => {
      const repo = new WorkOrderRepository(tx);

      const wo = await repo.findByIdWithDetails(id, this.ctx.companyId);
      if (!wo) return fail(new Error("Work Order not found"));
      
      if (wo.status === WorkOrderStatus.COMPLETED || wo.status === WorkOrderStatus.CANCELLED) {
        return fail(new Error("Cannot complete this work order"));
      }

      await repo.update(id, this.ctx.companyId, { status: WorkOrderStatus.COMPLETED, completedDate: new Date(), inventoryStatus: "CONSUMED" });

      // Consume reserved stock (calculating exact sqft deduction if applicable)
      for (const item of wo.lineItems) {
        if (item.inventoryItemId) {
          const parsed = SquareFootParser.parse(item.description);
          const consumeQty = parsed ? parsed.sqft * item.quantity : item.quantity;

          await InventoryFacade.consumeStock(this.ctx, {
            itemId: item.inventoryItemId,
            quantity: consumeQty,
            referenceType: "WorkOrder",
            referenceId: wo.id
          });
        }
      }

      // Activity Log instead of raw status updates
      await tx.activityLog.create({
        data: {
          companyId: this.ctx.companyId,
          userId: this.ctx.userId,
          action: "COMPLETED",
          entityType: "WorkOrder",
          entityId: wo.id,
          details: JSON.stringify({ status: WorkOrderStatus.COMPLETED }),
        }
      });

      return success(true);
    });
  }

  async updateStatus(id: string, granularStatus: string, prismaStatus: WorkOrderStatus) {
    return TransactionManager.run(async (tx) => {
      const repo = new WorkOrderRepository(tx);
      const wo = await repo.findByIdWithDetails(id, this.ctx.companyId);
      if (!wo) return fail(new Error("Work Order not found"));

      let newInventoryStatus = wo.inventoryStatus;

      // Rule: Reserve inventory when Production Starts (e.g. IN_PROGRESS)
      if (prismaStatus === WorkOrderStatus.IN_PROGRESS && wo.inventoryStatus === "UNRESERVED") {
        newInventoryStatus = "RESERVED";
        for (const item of wo.lineItems) {
          if (item.inventoryItemId) {
            const parsed = SquareFootParser.parse(item.description);
            const reserveQty = parsed ? parsed.sqft * item.quantity : item.quantity;

            await InventoryFacade.reserveStock(this.ctx, {
              itemId: item.inventoryItemId,
              quantity: reserveQty,
              referenceType: "WorkOrder",
              referenceId: wo.id
            });
          }
        }
      }

      await repo.update(id, this.ctx.companyId, { 
        status: prismaStatus,
        inventoryStatus: newInventoryStatus
      });

      // Track granular status in Activity Log
      await tx.activityLog.create({
        data: {
          companyId: this.ctx.companyId,
          userId: this.ctx.userId,
          action: "STATUS_CHANGED",
          entityType: "WorkOrder",
          entityId: wo.id,
          details: JSON.stringify({ status: prismaStatus, granularStatus }),
        }
      });

      return success(true);
    });
  }

  async assignWorkOrder(id: string, dto: AssignWorkOrderDTO) {
    const validationResult = AssignWorkOrderSchema.safeParse(dto);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return fail(new Error(`Validation failed: ${errors}`));
    }

    return TransactionManager.run(async (tx) => {
      const repo = new WorkOrderRepository(tx);
      const wo = await repo.findByIdWithDetails(id, this.ctx.companyId);
      if (!wo) return fail(new Error("Work Order not found"));

      const assignment = await repo.createAssignment({
        companyId: this.ctx.companyId,
        workOrderId: id,
        assignedTo: dto.userId,
        title: dto.title,
        description: dto.description,
        date: dto.date,
        startTime: dto.startTime,
        endTime: dto.endTime,
      });

      return success(assignment);
    });
  }

  async addNote(id: string, text: string) {
    return TransactionManager.run(async (tx) => {
      const repo = new WorkOrderRepository(tx);
      const wo = await repo.findByIdWithDetails(id, this.ctx.companyId);
      if (!wo) return fail(new Error("Work Order not found"));

      const note = await repo.createNote({
        companyId: this.ctx.companyId,
        workOrderId: id,
        userId: this.ctx.userId,
        text,
      });

      return success(note);
    });
  }
}

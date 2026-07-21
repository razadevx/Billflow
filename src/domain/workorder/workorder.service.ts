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

export class WorkOrderService extends BaseService {
  constructor(ctx: RequestContext) {
    super(ctx);
  }

  async createWorkOrder(dto: CreateWorkOrderDTO) {
    const validationResult = CreateWorkOrderSchema.safeParse(dto);
    if (!validationResult.success) {
      return fail(new Error(`Validation failed: ${validationResult.error.message}`));
    }

    return TransactionManager.run(async (tx) => {
      const repo = new WorkOrderRepository(tx);

      const orderNumber = await SequenceService.reserveSequence(tx, this.ctx.companyId, "WO", "WO");

      let subtotal = 0;
      let tax = 0;
      let total = 0;

      for (const item of dto.lineItems) {
        const itemTotal = item.quantity * item.unitPrice;
        const itemTax = itemTotal * ((item.taxRate || 0) / 100);
        
        const mSubtotal = Money.fromNumber(subtotal);
        const mItemTotal = Money.fromNumber(itemTotal);
        subtotal = MoneyCalculator.add(mSubtotal, mItemTotal).toNumber();
        
        const mTax = Money.fromNumber(tax);
        const mItemTax = Money.fromNumber(itemTax);
        tax = MoneyCalculator.add(mTax, mItemTax).toNumber();
        
        const mTotal = Money.fromNumber(total);
        const mItemAndTax = MoneyCalculator.add(mItemTotal, mItemTax);
        total = MoneyCalculator.add(mTotal, mItemAndTax).toNumber();
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
        inventoryStatus: "RESERVED",
        status: WorkOrderStatus.PENDING,
      }, dto.lineItems.map(li => ({
        inventoryItemId: li.inventoryItemId,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        taxRate: li.taxRate || 0,
        total: (li.quantity * li.unitPrice) * (1 + (li.taxRate || 0) / 100),
      })));

      for (const item of dto.lineItems) {
        if (item.inventoryItemId) {
          await InventoryFacade.reserveStock(this.ctx, {
            itemId: item.inventoryItemId,
            quantity: item.quantity,
            referenceType: "WorkOrder",
            referenceId: workOrder.id
          });
        }
      }

      return success(workOrder);
    });
  }

  async editWorkOrder(id: string, dto: UpdateWorkOrderDTO) {
    const validationResult = UpdateWorkOrderSchema.safeParse(dto);
    if (!validationResult.success) return fail(new Error("Validation failed"));

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
          await InventoryFacade.releaseStock(this.ctx, {
            itemId: item.inventoryItemId,
            quantity: item.quantity,
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

      // Consume reserved stock
      for (const item of wo.lineItems) {
        if (item.inventoryItemId) {
          await InventoryFacade.consumeStock(this.ctx, {
            itemId: item.inventoryItemId,
            quantity: item.quantity,
            referenceType: "WorkOrder",
            referenceId: wo.id
          });
        }
      }

      return success(true);
    });
  }

  async assignWorkOrder(id: string, dto: AssignWorkOrderDTO) {
    const validationResult = AssignWorkOrderSchema.safeParse(dto);
    if (!validationResult.success) return fail(new Error("Validation failed"));

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
}

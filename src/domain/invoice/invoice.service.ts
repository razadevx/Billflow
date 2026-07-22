import { BaseService } from "@/server/core/BaseService";
import { RequestContext } from "@/server/core/RequestContext";
import { TransactionManager } from "@/server/db";
import { Result, success, fail } from "@/server/core/Result";
import { SequenceService } from "@/server/core/sequence/SequenceService";
import { InvoiceRepository } from "./invoice.repository";
import { CreateInvoiceFromWorkOrderDTO, UpdateInvoiceStatusDTO } from "./invoice.types";
import { CreateInvoiceFromWorkOrderSchema, UpdateInvoiceStatusSchema } from "./invoice.validation";
import { WorkOrderRepository } from "@/domain/workorder/workorder.repository";
import { LedgerFacade } from "@/domain/ledger/public";

export class InvoiceService extends BaseService {
  constructor(ctx: RequestContext) {
    super(ctx);
  }

  async getInvoices() {
    return TransactionManager.run(async (tx) => {
      const repo = new InvoiceRepository(tx);
      const invoices = await repo.findMany(this.ctx.companyId);
      return success(invoices);
    });
  }

  async getInvoice(id: string) {
    return TransactionManager.run(async (tx) => {
      const repo = new InvoiceRepository(tx);
      const invoice = await repo.findById(id, this.ctx.companyId);
      if (!invoice) return fail(new Error("Invoice not found"));
      return success(invoice);
    });
  }

  async generateFromWorkOrder(dto: CreateInvoiceFromWorkOrderDTO) {
    const validationResult = CreateInvoiceFromWorkOrderSchema.safeParse(dto);
    if (!validationResult.success) {
      return fail(new Error(`Validation failed: ${validationResult.error.message}`));
    }

    return TransactionManager.run(async (tx) => {
      const invoiceRepo = new InvoiceRepository(tx);
      const woRepo = new WorkOrderRepository(tx);

      const wo = await woRepo.findByIdWithDetails(dto.workOrderId, this.ctx.companyId);
      if (!wo) return fail(new Error("Work Order not found"));

      // Check if invoice already exists
      if (wo.invoices && wo.invoices.length > 0) {
        return fail(new Error("Work Order already has an invoice"));
      }

      const invoiceNumber = await SequenceService.reserveSequence(tx, this.ctx.companyId, "INV", "INV");

      const invoice = await invoiceRepo.createInvoice({
        companyId: this.ctx.companyId,
        customerId: wo.customerId,
        workOrderId: wo.id,
        invoiceNumber,
        issueDate: new Date(),
        dueDate: dto.dueDate,
        subtotal: wo.subtotal,
        tax: wo.tax,
        discount: 0,
        total: wo.total,
        balanceDue: wo.total,
        status: "DRAFT",
        notes: dto.notes,
        terms: dto.terms,
      });

      const ledgerResult = await LedgerFacade.recordDebit(this.ctx, tx, {
        customerId: wo.customerId,
        invoiceId: invoice.id,
        amount: invoice.total,
        description: `Invoice ${invoice.invoiceNumber} generated from work order ${wo.orderNumber}`,
      });

      if (ledgerResult.isFailure()) {
        throw new Error(ledgerResult.error?.message || "Failed to record invoice in ledger");
      }

      return success(invoice);
    });
  }

  async updateStatus(id: string, dto: UpdateInvoiceStatusDTO) {
    const validationResult = UpdateInvoiceStatusSchema.safeParse(dto);
    if (!validationResult.success) return fail(new Error("Validation failed"));

    return TransactionManager.run(async (tx) => {
      const repo = new InvoiceRepository(tx);
      
      const invoice = await repo.findById(id, this.ctx.companyId);
      if (!invoice) return fail(new Error("Invoice not found"));

      await repo.updateStatus(id, this.ctx.companyId, dto.status);

      return success({ id, status: dto.status });
    });
  }
}

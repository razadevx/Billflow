import { BaseService } from "@/server/core/BaseService";
import { PaymentRepository } from "../repositories/PaymentRepository";
import { CreatePaymentInput, VoidPaymentInput } from "../validations/PaymentSchema";
import { RequestContext } from "@/server/core/RequestContext";
import { Result, ok, fail } from "@/server/core/Result";
import { Payment, PaymentStatus } from "@prisma/client";
import { SequenceService } from "@/server/core/sequence/SequenceService";
import { eventBus } from "@/server/events/InMemoryEventBus";
import { DomainEvents } from "@/server/events/DomainEventTypes";
import { TransactionManager, db } from "@/server/db";
import { LedgerFacade } from "@/domain/ledger/public";

export class PaymentService extends BaseService {
  constructor(ctx: RequestContext, private readonly paymentRepo: PaymentRepository = new PaymentRepository()) {
    super(ctx);
  }

  async recordPayment(input: CreatePaymentInput): Promise<Result<Payment>> {
    try {
      return await TransactionManager.run(async (tx) => {
        const txRepo = new PaymentRepository(tx);
        let receiptNumber = input.receiptNumber;
        if (!receiptNumber) {
          receiptNumber = await SequenceService.reserveSequence(tx, this.ctx.companyId, "PAYMENT", "RCPT");
        }

        const payment = await txRepo.create(this.ctx.companyId, {
          customerId: input.customerId,
          workOrderId: input.workOrderId || null,
          invoiceId: input.invoiceId || null,
          receiptNumber,
          amount: input.amount,
          method: input.method,
          status: PaymentStatus.PAID,
          referenceNumber: input.referenceNumber || null,
          notes: input.notes || null,
          paymentDate: input.paymentDate,
        });

        await txRepo.addHistory(this.ctx.companyId, payment.id, PaymentStatus.PAID, "Payment recorded");

        const ledgerResult = await LedgerFacade.recordCredit(this.ctx, tx, {
          customerId: payment.customerId,
          amount: payment.amount,
          paymentId: payment.id,
          invoiceId: payment.invoiceId || undefined,
          description: `Payment received - ${payment.method} ${payment.referenceNumber ? `(Ref: ${payment.referenceNumber})` : ''}`
        });

        if (ledgerResult.isFailure()) {
          throw new Error(ledgerResult.error?.message || "Failed to record ledger credit");
        }

        if (payment.invoiceId) {
          const invoice = await tx.invoice.findUnique({
            where: { id: payment.invoiceId, companyId: this.ctx.companyId },
          });

          if (invoice) {
            const balanceDue = Math.max(0, invoice.balanceDue - payment.amount);
            await tx.invoice.update({
              where: { id: invoice.id, companyId: this.ctx.companyId },
              data: {
                balanceDue,
                status: balanceDue === 0 ? "PAID" : "PARTIALLY_PAID",
              },
            });
          }
        }

        eventBus.publish({
          type: DomainEvents.PAYMENT_RECORDED,
          payload: { paymentId: payment.id, amount: payment.amount, customerId: payment.customerId },
          occurredOn: new Date(),
        });

        return ok(payment);
      });
    } catch (e: any) {
      return fail(new Error(`Failed to record payment: ${e.message}`));
    }
  }

  async voidPayment(id: string, input: VoidPaymentInput): Promise<Result<Payment>> {
    try {
      return await TransactionManager.run(async (tx) => {
        const txRepo = new PaymentRepository(tx);
        const existing = await txRepo.findById(id, this.ctx.companyId);
        if (!existing) {
          return fail(new Error("Payment not found"));
        }

        if (existing.status === PaymentStatus.REFUNDED) {
          return fail(new Error("Payment is already voided/refunded"));
        }

        const updated = await txRepo.update(id, this.ctx.companyId, {
          status: PaymentStatus.REFUNDED,
        });

        await txRepo.addHistory(this.ctx.companyId, id, PaymentStatus.REFUNDED, input.notes || "Payment voided");

        // Reverse the payment in the ledger by creating a DEBIT entry (Append-only)
        const ledgerResult = await LedgerFacade.recordDebit(this.ctx, tx, {
          customerId: updated.customerId,
          amount: updated.amount,
          paymentId: updated.id,
          invoiceId: updated.invoiceId || undefined,
          description: `Payment voided/refunded - ${input.notes || ''}`
        });

        if (ledgerResult.isFailure()) {
          throw new Error(ledgerResult.error?.message || "Failed to record ledger debit for voided payment");
        }

        if (updated.invoiceId) {
          const invoice = await tx.invoice.findUnique({
            where: { id: updated.invoiceId, companyId: this.ctx.companyId },
          });

          if (invoice) {
            const balanceDue = Math.min(invoice.total, invoice.balanceDue + updated.amount);
            await tx.invoice.update({
              where: { id: invoice.id, companyId: this.ctx.companyId },
              data: {
                balanceDue,
                status: balanceDue >= invoice.total ? "ISSUED" : "PARTIALLY_PAID",
              },
            });
          }
        }

        eventBus.publish({
          type: DomainEvents.PAYMENT_VOIDED,
          payload: { paymentId: updated.id, amount: updated.amount, customerId: updated.customerId },
          occurredOn: new Date(),
        });

        return ok(updated);
      });
    } catch (e: any) {
      return fail(new Error(`Failed to void payment: ${e.message}`));
    }
  }

  async getPayment(id: string): Promise<Result<Payment>> {
    try {
      const payment = await this.paymentRepo.findWithHistory(id, this.ctx.companyId);
      if (!payment) {
        return fail(new Error("Payment not found"));
      }
      return ok(payment as Payment);
    } catch (e: any) {
      return fail(new Error(`Failed to fetch payment: ${e.message}`));
    }
  }

  async listPayments(args?: any): Promise<Result<Payment[]>> {
    try {
      const payments = await this.paymentRepo.findMany(this.ctx.companyId, args);
      return ok(payments);
    } catch (e: any) {
      return fail(new Error(`Failed to list payments: ${e.message}`));
    }
  }

  async getCollectedCash(): Promise<Result<number>> {
    try {
      const result = await db.payment.aggregate({
        where: { companyId: this.ctx.companyId, status: PaymentStatus.PAID, deletedAt: null },
        _sum: { amount: true }
      });
      return ok(result._sum.amount || 0);
    } catch (e: any) {
      return fail(new Error(`Failed to calculate collected cash: ${e.message}`));
    }
  }
}

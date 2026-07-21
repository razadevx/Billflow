import { RequestContext } from "@/server/core/RequestContext";
import { KhataRepository } from "../repositories/KhataRepository";
import { Prisma } from "@prisma/client";
import { Result, ok, fail } from "@/server/core/Result";

export interface LedgerEntryInput {
  customerId: string;
  amount: number;
  description?: string;
  paymentId?: string;
  invoiceId?: string;
}

export class KhataService {
  constructor(private readonly repo: KhataRepository = new KhataRepository()) {}

  async recordCredit(ctx: RequestContext, tx: Prisma.TransactionClient, input: LedgerEntryInput) {
    try {
      const txRepo = new KhataRepository(tx);
      const entry = await txRepo.createEntry(ctx.companyId, {
        ...input,
        type: "CREDIT"
      });
      return ok(entry);
    } catch (e: any) {
      return fail(new Error(`Failed to record credit: ${e.message}`));
    }
  }

  async recordDebit(ctx: RequestContext, tx: Prisma.TransactionClient, input: LedgerEntryInput) {
    try {
      const txRepo = new KhataRepository(tx);
      const entry = await txRepo.createEntry(ctx.companyId, {
        ...input,
        type: "DEBIT"
      });
      return ok(entry);
    } catch (e: any) {
      return fail(new Error(`Failed to record debit: ${e.message}`));
    }
  }

  async getStatement(ctx: RequestContext, customerId: string) {
    try {
      const entries = await this.repo.getStatement(ctx.companyId, customerId);
      const balance = await this.repo.getCustomerBalance(ctx.companyId, customerId);
      
      return ok({
        entries,
        currentBalance: balance
      });
    } catch (e: any) {
      return fail(new Error(`Failed to get statement: ${e.message}`));
    }
  }

  async getCustomersWithBalances(ctx: RequestContext) {
    try {
      const customers = await this.repo.getCustomersWithBalances(ctx.companyId);
      return ok(customers);
    } catch (e: any) {
      return fail(new Error(`Failed to get customers with balances: ${e.message}`));
    }
  }
}

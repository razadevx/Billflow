import { RequestContext } from "@/server/core/RequestContext";
import { Prisma } from "@prisma/client";
import { KhataService, LedgerEntryInput } from "./services/KhataService";

const service = new KhataService();

export const LedgerFacade = {
  recordCredit: (ctx: RequestContext, tx: Prisma.TransactionClient, input: LedgerEntryInput) => 
    service.recordCredit(ctx, tx, input),
    
  recordDebit: (ctx: RequestContext, tx: Prisma.TransactionClient, input: LedgerEntryInput) => 
    service.recordDebit(ctx, tx, input),

  getStatement: (ctx: RequestContext, customerId: string) => 
    service.getStatement(ctx, customerId),

  getCustomersWithBalances: (ctx: RequestContext) =>
    service.getCustomersWithBalances(ctx),
};

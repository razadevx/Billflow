import { BaseRepository } from "@/server/core/BaseRepository";
import { Prisma, KhataEntry, LedgerEntryType } from "@prisma/client";
import { DbClient, db } from "@/server/db";

export class KhataRepository extends BaseRepository<
  KhataEntry,
  Omit<Prisma.KhataEntryUncheckedCreateInput, "companyId">,
  Prisma.KhataEntryUncheckedUpdateInput
> {
  constructor(prismaClient: DbClient = db) {
    super(prismaClient);
  }

  protected get delegate() {
    return this.prisma.khataEntry;
  }

  async createEntry(
    companyId: string,
    data: {
      customerId: string;
      paymentId?: string;
      invoiceId?: string;
      type: LedgerEntryType;
      amount: number;
      description?: string;
    }
  ): Promise<KhataEntry> {
    // Determine the new running balance by finding the latest entry for this customer
    const lastEntry = await this.prisma.khataEntry.findFirst({
      where: { companyId, customerId: data.customerId },
      orderBy: { createdAt: 'desc' }
    });

    const previousBalance = lastEntry?.runningBalance || 0;
    
    // Debit = Customer owes us (+)
    // Credit = Customer paid us (-)
    const runningBalance = data.type === "DEBIT" 
      ? previousBalance + data.amount 
      : previousBalance - data.amount;

    return this.prisma.khataEntry.create({
      data: {
        companyId,
        customerId: data.customerId,
        paymentId: data.paymentId,
        invoiceId: data.invoiceId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        runningBalance,
      }
    });
  }

  async getCustomerBalance(companyId: string, customerId: string): Promise<number> {
    // Strictly verify from the ledger: Balance = DEBIT - CREDIT
    const aggregate = await this.prisma.khataEntry.groupBy({
      by: ['type'],
      where: { companyId, customerId },
      _sum: { amount: true }
    });

    let debits = 0;
    let credits = 0;

    for (const row of aggregate) {
      if (row.type === "DEBIT") debits = row._sum.amount || 0;
      if (row.type === "CREDIT") credits = row._sum.amount || 0;
    }

    return debits - credits;
  }

  async getTotalOutstanding(companyId: string): Promise<number> {
    const aggregate = await this.prisma.khataEntry.groupBy({
      by: ['type'],
      where: { 
        companyId,
        customer: { deletedAt: null }
      },
      _sum: { amount: true }
    });

    let debits = 0;
    let credits = 0;

    for (const row of aggregate) {
      if (row.type === "DEBIT") debits = row._sum.amount || 0;
      if (row.type === "CREDIT") credits = row._sum.amount || 0;
    }

    return Math.max(0, debits - credits);
  }

  async getStatement(companyId: string, customerId: string) {
    // Returns chronological list of entries for a statement
    return this.prisma.khataEntry.findMany({
      where: { companyId, customerId },
      orderBy: { createdAt: 'asc' },
      include: {
        payment: true,
        invoice: true
      }
    });
  }

  async getCustomersWithBalances(companyId: string) {
    // Get all customers and aggregate their balances.
    const customers = await this.prisma.customer.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        customerCode: true,
        email: true,
        phone: true,
        khata: {
          select: { type: true, amount: true }
        }
      }
    });

    return customers.map(c => {
      let debits = 0;
      let credits = 0;
      for (const entry of c.khata) {
        if (entry.type === "DEBIT") debits += entry.amount;
        if (entry.type === "CREDIT") credits += entry.amount;
      }
      return {
        ...c,
        balance: debits - credits
      };
    });
  }
}

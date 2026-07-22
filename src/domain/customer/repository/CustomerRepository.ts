import { Customer, Prisma } from "@prisma/client";
import { BaseRepository } from "@/server/core/BaseRepository";
import { RequestContext } from "@/server/core/RequestContext";
import { db as prisma } from "@/server/db";

export class CustomerRepository extends BaseRepository<
  Customer,
  Prisma.CustomerCreateInput,
  Prisma.CustomerUpdateInput
> {
  protected get delegate() {
    return this.prisma.customer;
  }

  constructor() {
    super(prisma);
  }

  async findManyWithCredit(companyId: string) {
    return prisma.$queryRaw<Array<Customer & { outstandingBalance: number }>>`
      SELECT
        c.*,
        COALESCE(ledger.balance, 0)::float as "outstandingBalance"
      FROM "customer" c
      LEFT JOIN (
        SELECT
          "customerId",
          SUM(amount * CASE WHEN type = 'DEBIT' THEN 1 ELSE -1 END) as balance
        FROM "khata_entry"
        WHERE "companyId" = ${companyId}
        GROUP BY "customerId"
      ) ledger ON ledger."customerId" = c.id
      WHERE c."companyId" = ${companyId} AND c."deletedAt" IS NULL
      ORDER BY c."createdAt" DESC
    `;
  }

  async findByCode(customerCode: string, context: RequestContext): Promise<Customer | null> {
    return this.delegate.findUnique({
      where: {
        companyId_customerCode: {
          companyId: context.companyId,
          customerCode,
        }
      }
    });
  }

  async findByPhone(phone: string, context: RequestContext): Promise<Customer | null> {
    return this.delegate.findFirst({
      where: {
        companyId: context.companyId,
        phone,
        deletedAt: null
      }
    });
  }

  async findOutstanding(context: RequestContext): Promise<Customer[]> {
    return prisma.$queryRaw`
      SELECT c.* 
      FROM "customer" c
      LEFT JOIN (
        SELECT "customerId", SUM(amount * CASE WHEN type = 'DEBIT' THEN 1 ELSE -1 END) as balance
        FROM "khata_entry"
        WHERE "companyId" = ${context.companyId}
        GROUP BY "customerId"
      ) as ledger ON ledger."customerId" = c.id
      WHERE c."companyId" = ${context.companyId} AND ledger.balance > 0 AND c."deletedAt" IS NULL
    `;
  }

  async search(query: string, context: RequestContext): Promise<Customer[]> {
    const searchTerms = query.split(" ").filter(t => t.length > 0);
    
    // Very basic search, ideally we'd use Full Text Search
    return this.delegate.findMany({
      where: {
        companyId: context.companyId,
        deletedAt: null,
        OR: searchTerms.map(term => ({
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { phone: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
            { customerCode: { contains: term, mode: "insensitive" } },
          ]
        }))
      },
      take: 20
    });
  }
}

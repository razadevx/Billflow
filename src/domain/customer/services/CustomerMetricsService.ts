import { RequestContext } from "@/server/core/RequestContext";
import { Result, success, failure } from "@/server/core/Result";
import { db as prisma } from "@/server/db";

export interface CustomerMetrics {
  totalOrders: number;
  totalRevenue: number;
  outstandingBalance: number;
  averageOrderValue: number;
  creditUtilization: number; // percentage (0-100+)
  lastPaymentDate: Date | null;
  health: "HEALTHY" | "NEEDS_ATTENTION" | "HIGH_RISK";
}

export class CustomerMetricsService {
  
  async getMetrics(customerId: string, context: RequestContext): Promise<Result<CustomerMetrics, Error>> {
    try {
      // 1. Get Customer to check credit limit
      const customer = await prisma.customer.findUnique({
        where: { id: customerId, companyId: context.companyId }
      });

      if (!customer) {
        return failure(new Error("Customer not found"));
      }

      // 2. Aggregate Work Orders
      const woAgg = await prisma.workOrder.aggregate({
        where: { customerId, companyId: context.companyId, status: { not: "CANCELLED" } },
        _count: { id: true },
        _sum: { total: true }
      });
      const totalOrders = woAgg._count.id;
      const totalRevenue = woAgg._sum.total || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // 3. Aggregate Ledger for Outstanding Balance
      const ledgerAgg = await prisma.khataEntry.aggregate({
        where: { customerId, companyId: context.companyId },
        _sum: { amount: true } // We need to handle Debit/Credit logic properly
      });
      // In a real ledger, balance = SUM(DEBIT) - SUM(CREDIT)
      // Let's do a raw query to be safe
      const ledgerRaw: any = await prisma.$queryRaw`
        SELECT SUM(amount * CASE WHEN type = 'DEBIT' THEN 1 ELSE -1 END) as balance
        FROM khata_entry
        WHERE "customerId" = ${customerId} AND "companyId" = ${context.companyId}
      `;
      const outstandingBalance = (ledgerRaw[0]?.balance) || 0;

      // 4. Get Last Payment
      const lastPayment = await prisma.payment.findFirst({
        where: { customerId, companyId: context.companyId, status: "PAID" },
        orderBy: { paymentDate: "desc" }
      });

      // 5. Calculate Utilization & Health
      const creditUtilization = customer.creditLimit > 0 
        ? Math.max(0, (outstandingBalance / customer.creditLimit) * 100) 
        : 0;

      let health: CustomerMetrics["health"] = "HEALTHY";
      if (creditUtilization >= 90 || (outstandingBalance > 0 && creditUtilization === 0 && customer.creditLimit > 0)) {
        health = "HIGH_RISK";
      } else if (creditUtilization >= 70) {
        health = "NEEDS_ATTENTION";
      }

      return success({
        totalOrders,
        totalRevenue,
        outstandingBalance: Math.max(0, outstandingBalance),
        averageOrderValue,
        creditUtilization,
        lastPaymentDate: lastPayment?.paymentDate || null,
        health
      });

    } catch (error) {
      console.error(error);
      return failure(error instanceof Error ? error : new Error("Failed to compute metrics"));
    }
  }
}

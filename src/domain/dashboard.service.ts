import { Result, success, failure } from "@/server/core/Result";
import { db as prisma } from "@/server/db";

export interface DashboardData {
  kpis: {
    totalRevenue: number;
    outstandingBalance: number;
    activeWorkOrders: number;
    lowStockItems: number;
    stockValuation: number;
  };
  todayWorkOrders: unknown[];
  recentPayments: unknown[];
  lowStockItems: unknown[];
  outstandingCustomers: { id: string; name: string; balance: number }[];
  activityFeed: unknown[];
}

export class DashboardService {
  async getKPIs(companyId: string) {
    try {
      const woAgg = await prisma.workOrder.aggregate({
        where: { companyId, status: "COMPLETED" },
        _sum: { total: true }
      });
      const totalRevenue = woAgg._sum.total || 0;

      const ledgerRaw = await prisma.$queryRaw<Array<{ balance: number | null }>>`
        SELECT SUM(amount * CASE WHEN type = 'DEBIT' THEN 1 ELSE -1 END) as balance
        FROM khata_entry
        WHERE "companyId" = ${companyId}
      `;
      const outstandingBalance = Math.max(0, Number(ledgerRaw[0]?.balance || 0));

      const activeWorkOrders = await prisma.workOrder.count({
        where: { companyId, status: { in: ["PENDING", "IN_PROGRESS"] } }
      });

      const lowStockItemsCount = await prisma.inventoryItem.count({
        where: { companyId, status: { in: ["LOW_STOCK", "OUT_OF_STOCK"] }, deletedAt: null }
      });

      const valuationRaw = await prisma.$queryRaw<Array<{ valuation: number | null }>>`
        SELECT SUM("currentStock" * "unitPrice") as valuation
        FROM inventory_item
        WHERE "companyId" = ${companyId} AND "deletedAt" IS NULL
      `;
      const stockValuation = Number(valuationRaw[0]?.valuation || 0);

      return success({
        totalRevenue,
        outstandingBalance,
        activeWorkOrders,
        lowStockItems: lowStockItemsCount,
        stockValuation,
      });
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Failed to fetch KPIs"));
    }
  }

  async getTodayWorkOrders(companyId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayWorkOrders = await prisma.workOrder.findMany({
        where: { companyId, createdAt: { gte: today, lt: tomorrow } },
        include: { customer: { select: { name: true } } },
        take: 5,
        orderBy: { createdAt: "desc" }
      });
      return success(todayWorkOrders);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Failed to fetch today's work orders"));
    }
  }

  async getRecentPayments(companyId: string) {
    try {
      const recentPayments = await prisma.payment.findMany({
        where: { companyId },
        include: { customer: { select: { name: true } } },
        take: 5,
        orderBy: { paymentDate: "desc" }
      });
      return success(recentPayments);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Failed to fetch recent payments"));
    }
  }

  async getLowStockItems(companyId: string) {
    try {
      const lowStockItemsList = await prisma.inventoryItem.findMany({
        where: { companyId, status: { in: ["LOW_STOCK", "OUT_OF_STOCK"] }, deletedAt: null },
        take: 5,
        orderBy: { availableQuantity: "asc" }
      });
      return success(lowStockItemsList);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Failed to fetch low stock items"));
    }
  }

  async getOutstandingCustomers(companyId: string) {
    try {
      const outstandingCustomersRaw = await prisma.$queryRaw<Array<{ id: string; name: string; balance: number | null }>>`
        SELECT c.id, c.name, SUM(k.amount * CASE WHEN k.type = 'DEBIT' THEN 1 ELSE -1 END) as balance
        FROM khata_entry k
        JOIN customer c ON k."customerId" = c.id
        WHERE k."companyId" = ${companyId}
        GROUP BY c.id, c.name
        HAVING SUM(k.amount * CASE WHEN k.type = 'DEBIT' THEN 1 ELSE -1 END) > 0
        ORDER BY balance DESC
        LIMIT 5
      `;
      const outstandingCustomers = outstandingCustomersRaw.map(c => ({
        id: c.id,
        name: c.name,
        balance: Number(c.balance || 0)
      }));
      return success(outstandingCustomers);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Failed to fetch outstanding customers"));
    }
  }

  async getActivityFeed(companyId: string) {
    try {
      const activityFeed = await prisma.activityLog.findMany({
        where: { companyId },
        include: { user: { select: { name: true } } },
        take: 10,
        orderBy: { createdAt: "desc" }
      });
      return success(activityFeed);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Failed to fetch activity feed"));
    }
  }

  async getDashboardData(companyId: string): Promise<Result<DashboardData, Error>> {
    try {
      const [
        kpisRes,
        todayWorkOrdersRes,
        recentPaymentsRes,
        lowStockItemsRes,
        outstandingCustomersRes,
        activityFeedRes
      ] = await Promise.all([
        this.getKPIs(companyId),
        this.getTodayWorkOrders(companyId),
        this.getRecentPayments(companyId),
        this.getLowStockItems(companyId),
        this.getOutstandingCustomers(companyId),
        this.getActivityFeed(companyId)
      ]);

      if (!kpisRes.isSuccess() || !todayWorkOrdersRes.isSuccess() || !recentPaymentsRes.isSuccess() || !lowStockItemsRes.isSuccess() || !outstandingCustomersRes.isSuccess() || !activityFeedRes.isSuccess()) {
        throw new Error("Failed to fetch partial dashboard data");
      }

      return success({
        kpis: kpisRes.value as DashboardData["kpis"],
        todayWorkOrders: todayWorkOrdersRes.value as DashboardData["todayWorkOrders"],
        recentPayments: recentPaymentsRes.value as DashboardData["recentPayments"],
        lowStockItems: lowStockItemsRes.value as DashboardData["lowStockItems"],
        outstandingCustomers: outstandingCustomersRes.value as DashboardData["outstandingCustomers"],
        activityFeed: activityFeedRes.value as DashboardData["activityFeed"]
      });
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Failed to fetch dashboard data"));
    }
  }
}

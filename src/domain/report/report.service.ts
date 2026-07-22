import { BaseService } from "@/server/core/BaseService";
import { RequestContext } from "@/server/core/RequestContext";
import { Result, success, failure } from "@/server/core/Result";
import { db as prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import { SquareFootParser } from "./square-foot-parser";

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  search?: string;
  export?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary?: any;
}

export class ReportService extends BaseService {
  constructor(ctx: RequestContext) {
    super(ctx);
  }

  private getPaginationInfo(filter: ReportFilter) {
    const isExport = filter.export === true;
    const limit = isExport ? 5000 : (filter.limit || 10);
    const page = isExport ? 1 : (filter.page || 1);
    const skip = (page - 1) * limit;
    return { limit, page, skip, isExport };
  }

  // ==========================================
  // EXECUTIVE DASHBOARD
  // ==========================================
  async getExecutiveDashboard(): Promise<Result<any, Error>> {
    try {
      const companyId = this.ctx.companyId;

      const [
        totalRevenueAggr,
        paymentsReceivedAggr,
        activeWorkOrders,
        completedWorkOrders,
        inventoryItems,
        activeCustomers,
      ] = await Promise.all([
        prisma.khataEntry.aggregate({
          where: { companyId, type: 'DEBIT' },
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          where: { companyId },
          _sum: { amount: true }
        }),
        prisma.workOrder.count({
          where: { companyId, status: { in: ['PENDING', 'IN_PROGRESS'] } }
        }),
        prisma.workOrder.count({
          where: { companyId, status: 'COMPLETED' }
        }),
        prisma.inventoryItem.findMany({
          where: { companyId },
          select: { currentStock: true, unitPrice: true, reorderLevel: true }
        }),
        prisma.customer.count({
          where: { companyId, status: 'ACTIVE' }
        })
      ]);

      const totalRevenue = totalRevenueAggr._sum?.amount || 0;
      const paymentsReceived = paymentsReceivedAggr._sum?.amount || 0;
      const outstandingReceivables = totalRevenue - paymentsReceived;

      let inventoryValue = 0;
      let lowStockItems = 0;
      
      inventoryItems.forEach(item => {
        inventoryValue += (item.currentStock * item.unitPrice);
        if (item.currentStock <= (item.reorderLevel || 0)) {
          lowStockItems++;
        }
      });

      return success({
        totalRevenue,
        paymentsReceived,
        outstandingReceivables,
        activeWorkOrders,
        completedWorkOrders,
        inventoryValue,
        lowStockItems,
        activeCustomers
      });
    } catch (e: any) {
      return failure(e);
    }
  }

  // ==========================================
  // FINANCIAL REPORTS
  // ==========================================
  async getSalesReport(filter: ReportFilter): Promise<Result<PaginatedResult<any>, Error>> {
    try {
      const { limit, page, skip } = this.getPaginationInfo(filter);
      const where = {
        companyId: this.ctx.companyId,
        ...(filter.startDate && filter.endDate ? {
          issueDate: { gte: filter.startDate, lte: filter.endDate }
        } : {})
      };

      const [total, data, aggregate] = await Promise.all([
        prisma.invoice.count({ where }),
        prisma.invoice.findMany({
          where, skip, take: limit,
          include: { customer: { select: { name: true } } },
          orderBy: { issueDate: 'desc' }
        }),
        prisma.invoice.aggregate({
          where, _sum: { total: true }
        })
      ]);

      return success({
        data, total, page, limit,
        totalPages: Math.ceil(total / limit),
        summary: { totalRevenue: aggregate._sum?.total || 0 }
      });
    } catch (e: any) {
      return failure(e);
    }
  }

  async getPaymentsReport(filter: ReportFilter): Promise<Result<PaginatedResult<any>, Error>> {
    try {
      const { limit, page, skip } = this.getPaginationInfo(filter);
      const where = {
        companyId: this.ctx.companyId,
        ...(filter.startDate && filter.endDate ? {
          paymentDate: { gte: filter.startDate, lte: filter.endDate }
        } : {})
      };

      const [total, data, aggregate] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.findMany({
          where, skip, take: limit,
          include: { customer: { select: { name: true } } },
          orderBy: { paymentDate: 'desc' }
        }),
        prisma.payment.aggregate({
          where, _sum: { amount: true }
        })
      ]);

      return success({
        data, total, page, limit,
        totalPages: Math.ceil(total / limit),
        summary: { totalPayments: aggregate._sum?.amount || 0 }
      });
    } catch (e: any) {
      return failure(e);
    }
  }

  // ==========================================
  // WORK ORDER REPORTS
  // ==========================================
  async getWorkOrderReport(filter: ReportFilter): Promise<Result<PaginatedResult<any>, Error>> {
    try {
      const { limit, page, skip } = this.getPaginationInfo(filter);
      const where = {
        companyId: this.ctx.companyId,
        ...(filter.startDate && filter.endDate ? {
          createdAt: { gte: filter.startDate, lte: filter.endDate }
        } : {})
      };

      const [total, data] = await Promise.all([
        prisma.workOrder.count({ where }),
        prisma.workOrder.findMany({
          where, skip, take: limit,
          include: { customer: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      return success({
        data, total, page, limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (e: any) {
      return failure(e);
    }
  }

  // ==========================================
  // SQUARE FOOT REPORTS
  // ==========================================
  async getSquareFootReport(filter: ReportFilter): Promise<Result<PaginatedResult<any>, Error>> {
    try {
      const { limit, page, skip, isExport } = this.getPaginationInfo(filter);
      
      const where: any = {
        workOrder: { companyId: this.ctx.companyId },
        description: { contains: "sqft" } // Case insensitive in Postgres, but simple string match helps filter
      };

      if (filter.startDate && filter.endDate) {
        where.createdAt = { gte: filter.startDate, lte: filter.endDate };
      }

      // Fetch ALL matching items to aggregate total accurately if export, else fetch up to max to do JS parsing
      const fetchLimit = isExport ? 10000 : 5000; 

      const allItems = await prisma.lineItem.findMany({
        where,
        take: fetchLimit,
        include: {
          workOrder: { select: { customer: { select: { name: true } } } },
          inventoryItem: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      let totalSqFt = 0;
      let totalValue = 0;

      const parsedItems = allItems.map(item => {
        const parsed = SquareFootParser.parse(item.description);
        if (!parsed) return null; // Ignore if unparseable

        const itemTotalSqFt = parsed.sqft * item.quantity;
        totalSqFt += itemTotalSqFt;
        totalValue += item.total;

        return {
          id: item.id,
          date: item.createdAt,
          customer: item.workOrder.customer.name,
          material: item.inventoryItem?.name || "Custom Material",
          description: item.description,
          parsedWidth: parsed.width,
          parsedHeight: parsed.height,
          parsedSqFtPerItem: parsed.sqft,
          quantity: item.quantity,
          totalSqFt: itemTotalSqFt,
          rate: parsed.rate,
          totalValue: item.total
        };
      }).filter(Boolean); // Remove nulls

      // Apply pagination on parsed items
      const paginatedItems = parsedItems.slice(skip, skip + limit);

      return success({
        data: paginatedItems,
        total: parsedItems.length,
        page,
        limit,
        totalPages: Math.ceil(parsedItems.length / limit),
        summary: { totalSqFt, totalValue }
      });
    } catch (e: any) {
      return failure(e);
    }
  }

  // ==========================================
  // CUSTOMER REPORTS
  // ==========================================
  async getCustomerReport(filter: ReportFilter): Promise<Result<PaginatedResult<any>, Error>> {
    try {
      const { limit, page, skip } = this.getPaginationInfo(filter);
      const where = { companyId: this.ctx.companyId };

      const [total, customers] = await Promise.all([
        prisma.customer.count({ where }),
        prisma.customer.findMany({
          where,
          skip,
          take: limit,
          include: {
            workOrders: {
              select: { total: true, status: true },
              where: filter.startDate && filter.endDate ? { createdAt: { gte: filter.startDate, lte: filter.endDate } } : undefined
            },
            payments: {
              select: { amount: true },
              where: filter.startDate && filter.endDate ? { paymentDate: { gte: filter.startDate, lte: filter.endDate } } : undefined
            }
          },
          orderBy: { name: 'asc' }
        })
      ]);

      const data = customers.map(c => {
        const lifetimeRevenue = c.workOrders.reduce((sum, wo) => sum + wo.total, 0);
        const paymentsMade = c.payments.reduce((sum, p) => sum + p.amount, 0);
        const outstanding = lifetimeRevenue - paymentsMade;
        const activeOrders = c.workOrders.filter(wo => wo.status === 'IN_PROGRESS' || wo.status === 'PENDING').length;
        const totalOrders = c.workOrders.length;
        const avgOrderValue = totalOrders > 0 ? lifetimeRevenue / totalOrders : 0;

        return {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          lifetimeRevenue,
          paymentsMade,
          outstanding,
          activeOrders,
          totalOrders,
          avgOrderValue
        };
      });

      return success({
        data, total, page, limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (e: any) {
      return failure(e);
    }
  }

  // ==========================================
  // INVENTORY REPORTS
  // ==========================================
  async getInventoryReport(filter: ReportFilter): Promise<Result<PaginatedResult<any>, Error>> {
    try {
      const { limit, page, skip } = this.getPaginationInfo(filter);
      const where = {
        companyId: this.ctx.companyId,
        ...(filter.search ? { name: { contains: filter.search, mode: 'insensitive' as any } } : {})
      };

      const [total, data] = await Promise.all([
        prisma.inventoryItem.count({ where }),
        prisma.inventoryItem.findMany({
          where, skip, take: limit,
          orderBy: { name: 'asc' }
        })
      ]);

      const enhancedData = data.map(item => ({
        ...item,
        isLowStock: item.currentStock <= (item.reorderLevel || 0),
        valuation: item.currentStock * item.unitPrice
      }));

      const totalValuation = enhancedData.reduce((sum, item) => sum + item.valuation, 0);

      return success({
        data: enhancedData,
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        summary: { totalValuation }
      });
    } catch (e: any) {
      return failure(e);
    }
  }

  // ==========================================
  // CUSTOMER STATEMENTS
  // ==========================================
  async getCustomerStatements(filter: ReportFilter & { customerId?: string }): Promise<Result<PaginatedResult<any>, Error>> {
    try {
      const { limit, page, skip } = this.getPaginationInfo(filter);
      const where: any = {
        companyId: this.ctx.companyId,
        ...(filter.startDate && filter.endDate ? {
          date: { gte: filter.startDate, lte: filter.endDate }
        } : {})
      };
      
      if (filter.customerId) {
        where.customerId = filter.customerId;
      }

      const [total, data] = await Promise.all([
        prisma.khataEntry.count({ where }),
        prisma.khataEntry.findMany({
          where, skip, take: limit,
          include: { customer: { select: { name: true } } },
          orderBy: { date: 'desc' }
        })
      ]);

      return success({
        data, total, page, limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (e: any) {
      return failure(e);
    }
  }

  async getDailyCashReport(filter: ReportFilter): Promise<Result<PaginatedResult<any>, Error>> {
    try {
      const { limit, page, skip } = this.getPaginationInfo(filter);
      const where = {
        companyId: this.ctx.companyId,
        method: "CASH" as any,
        ...(filter.startDate && filter.endDate ? {
          paymentDate: { gte: filter.startDate, lte: filter.endDate }
        } : {})
      };

      const [total, data] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.findMany({
          where, skip, take: limit,
          include: { customer: { select: { name: true } } },
          orderBy: { paymentDate: 'desc' }
        })
      ]);

      return success({
        data, total, page, limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (e: any) {
      return failure(e);
    }
  }
}

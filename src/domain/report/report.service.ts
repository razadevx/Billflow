import { BaseService } from "@/server/core/BaseService";
import { RequestContext } from "@/server/core/RequestContext";
import { Result, success, failure } from "@/server/core/Result";
import { db as prisma } from "@/server/db";
import { Prisma } from "@prisma/client";

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ReportService extends BaseService {
  constructor(ctx: RequestContext) {
    super(ctx);
  }

  async getSalesReport(filter: ReportFilter): Promise<Result<PaginatedResult<any>, Error>> {
    try {
      const skip = (filter.page - 1) * filter.limit;
      const where = {
        companyId: this.ctx.companyId,
        ...(filter.startDate && filter.endDate ? {
          issueDate: { gte: filter.startDate, lte: filter.endDate }
        } : {})
      };

      const [total, data] = await Promise.all([
        prisma.invoice.count({ where }),
        prisma.invoice.findMany({
          where,
          skip,
          take: filter.limit,
          include: { customer: { select: { name: true } } },
          orderBy: { issueDate: 'desc' }
        })
      ]);

      return success({
        data,
        total,
        page: filter.page,
        limit: filter.limit,
        totalPages: Math.ceil(total / filter.limit)
      });
    } catch (e: any) {
      return failure(e);
    }
  }

  async getPaymentsReport(filter: ReportFilter): Promise<Result<PaginatedResult<any>, Error>> {
    try {
      const skip = (filter.page - 1) * filter.limit;
      const where = {
        companyId: this.ctx.companyId,
        ...(filter.startDate && filter.endDate ? {
          paymentDate: { gte: filter.startDate, lte: filter.endDate }
        } : {})
      };

      const [total, data] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.findMany({
          where,
          skip,
          take: filter.limit,
          include: { customer: { select: { name: true } } },
          orderBy: { paymentDate: 'desc' }
        })
      ]);

      return success({
        data,
        total,
        page: filter.page,
        limit: filter.limit,
        totalPages: Math.ceil(total / filter.limit)
      });
    } catch (e: any) {
      return failure(e);
    }
  }

  async getCustomerStatements(filter: ReportFilter & { customerId?: string }): Promise<Result<PaginatedResult<any>, Error>> {
    try {
      const skip = (filter.page - 1) * filter.limit;
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
          where,
          skip,
          take: filter.limit,
          include: { customer: { select: { name: true } } },
          orderBy: { date: 'desc' }
        })
      ]);

      return success({
        data,
        total,
        page: filter.page,
        limit: filter.limit,
        totalPages: Math.ceil(total / filter.limit)
      });
    } catch (e: any) {
      return failure(e);
    }
  }

  async getInventoryReport(filter: ReportFilter): Promise<Result<PaginatedResult<any>, Error>> {
    try {
      const skip = (filter.page - 1) * filter.limit;
      const where = {
        companyId: this.ctx.companyId,
        ...(filter.search ? {
          name: { contains: filter.search, mode: 'insensitive' as any }
        } : {})
      };

      const [total, data] = await Promise.all([
        prisma.inventoryItem.count({ where }),
        prisma.inventoryItem.findMany({
          where,
          skip,
          take: filter.limit,
          orderBy: { name: 'asc' }
        })
      ]);

      return success({
        data,
        total,
        page: filter.page,
        limit: filter.limit,
        totalPages: Math.ceil(total / filter.limit)
      });
    } catch (e: any) {
      return failure(e);
    }
  }

  async getDailyCashReport(filter: ReportFilter): Promise<Result<PaginatedResult<any>, Error>> {
    try {
      const skip = (filter.page - 1) * filter.limit;
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
          where,
          skip,
          take: filter.limit,
          include: { customer: { select: { name: true } } },
          orderBy: { paymentDate: 'desc' }
        })
      ]);

      return success({
        data,
        total,
        page: filter.page,
        limit: filter.limit,
        totalPages: Math.ceil(total / filter.limit)
      });
    } catch (e: any) {
      return failure(e);
    }
  }
}

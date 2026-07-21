import { db, DbClient } from "@/server/db";
import { BaseRepository } from "@/server/core/BaseRepository";
import { InventoryItem, Prisma } from "@prisma/client";
import { CreateInventoryItemInput, UpdateInventoryItemInput, SearchInventoryParams, PaginatedResult } from "./types";

export class InventoryRepository extends BaseRepository<InventoryItem, CreateInventoryItemInput, UpdateInventoryItemInput> {
  constructor(client: DbClient = db) {
    super(client);
  }

  protected get delegate() {
    return this.prisma.inventoryItem;
  }

  async search(
    companyId: string,
    params: SearchInventoryParams,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<InventoryItem>> {
    const where: Prisma.InventoryItemWhereInput = {
      companyId,
      deletedAt: null,
    };

    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { sku: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.lowStockOnly) {
      // Find items where availableQuantity is <= reorderLevel
      // Prisma cannot directly compare two fields easily in standard where without queryRaw, 
      // but we can query then filter or use an advanced feature if supported. 
      // For simplicity, we assume we fetch those where reorderLevel >= availableQuantity if we can,
      // or we just fetch and filter. Actually, in modern Prisma, we can't do direct column comparison in `where`.
      // Let's rely on a simpler check or fetch all and filter if it's not supported natively, 
      // but usually we can track a `lowStock` boolean or just use $queryRaw.
      // For now, if lowStockOnly is true, we will just fetch and filter in memory if needed, 
      // or we only use `status = 'LOW_STOCK'`.
      where.status = 'LOW_STOCK'; // Assuming status is updated correctly by domain logic.
    }

    const total = await this.delegate.count({ where });
    const data = await this.delegate.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCategories(companyId: string) {
    return this.prisma.inventoryCategory.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: 'asc' }
    });
  }

  async createCategory(companyId: string, name: string, description?: string) {
    return this.prisma.inventoryCategory.create({
      data: {
        companyId,
        name,
        description
      }
    });
  }

  async findBySku(companyId: string, sku: string) {
    return this.delegate.findFirst({
      where: { companyId, sku, deletedAt: null }
    });
  }

  async recordAdjustment(data: Omit<Prisma.InventoryAdjustmentUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.prisma.inventoryAdjustment.create({ data });
  }

  async recordHistory(data: Omit<Prisma.InventoryHistoryUncheckedCreateInput, 'id' | 'createdAt'>) {
    return this.prisma.inventoryHistory.create({ data });
  }
}

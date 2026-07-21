import { InventoryItem, InventoryCategory, InventoryStatus } from "@prisma/client";

export type { InventoryItem, InventoryCategory, InventoryStatus };

export interface CreateInventoryItemInput {
  name: string;
  sku?: string;
  description?: string;
  categoryId?: string;
  unit: string;
  reorderLevel?: number;
  unitPrice?: number;
  initialStock?: number;
}

export interface UpdateInventoryItemInput {
  name?: string;
  sku?: string;
  description?: string;
  categoryId?: string | null;
  unit?: string;
  reorderLevel?: number;
  unitPrice?: number;
  status?: InventoryStatus;
}

export interface AdjustStockInput {
  itemId: string;
  quantity: number; // positive for addition, negative for reduction
  reason: string;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
}

export interface ReserveStockInput {
  itemId: string;
  quantity: number; // positive amount to reserve
  referenceType: string;
  referenceId: string;
}

export interface ReleaseStockInput {
  itemId: string;
  quantity: number; // positive amount to release from reservation
  referenceType: string;
  referenceId: string;
}

export interface ConsumeStockInput {
  itemId: string;
  quantity: number; // positive amount to permanently consume
  referenceType: string;
  referenceId: string;
}

export interface SearchInventoryParams {
  query?: string;
  categoryId?: string;
  status?: InventoryStatus;
  lowStockOnly?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface InventorySearchParams extends SearchInventoryParams, PaginationParams {}

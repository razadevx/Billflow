import { BaseService } from "@/server/core/BaseService";
import { Result, success, failure } from "@/server/core/Result";
import { RequestContext } from "@/server/core/RequestContext";
import { DbClient } from "@/server/db";
import { eventBus } from "@/server/events/InMemoryEventBus";
import { DomainEvents } from "@/server/events/DomainEventTypes";
import { InventoryRepository } from "./repository";
import { 
  InventoryItem, 
  CreateInventoryItemInput, 
  UpdateInventoryItemInput, 
  AdjustStockInput,
  ReserveStockInput,
  ReleaseStockInput,
  ConsumeStockInput,
  InventorySearchParams,
  PaginatedResult,
  InventoryStatus
} from "./types";

export class InventoryService extends BaseService {
  private repository: InventoryRepository;

  constructor(ctx: RequestContext, client?: DbClient) {
    super(ctx);
    this.repository = new InventoryRepository(client);
  }

  private calculateStatus(available: number, reorderLevel: number): InventoryStatus {
    if (available <= 0) return 'OUT_OF_STOCK';
    if (available <= reorderLevel) return 'LOW_STOCK';
    return 'AVAILABLE';
  }

  async createItem(input: CreateInventoryItemInput): Promise<Result<InventoryItem>> {
    this.requirePermission("inventory:write");

    try {
      const { initialStock = 0, ...itemData } = input;
      
      const status = this.calculateStatus(initialStock, input.reorderLevel || 0);

      const item = await this.repository.create(this.ctx.companyId, {
        ...itemData,
        currentStock: initialStock,
        availableQuantity: initialStock,
        reservedQuantity: 0,
        status,
      } as any); // Using any here to bypass complex Prisma types in BaseRepository

      await eventBus.publish({
        type: DomainEvents.INVENTORY_ITEM_CREATED,
        payload: { itemId: item.id, companyId: this.ctx.companyId },
        occurredOn: new Date()
      });

      if (initialStock > 0) {
        await this.repository.recordHistory({
          companyId: this.ctx.companyId,
          itemId: item.id,
          action: "INITIAL_STOCK",
          previousQuantity: 0,
          newQuantity: initialStock,
        });
      }

      this.logInfo(`Inventory item created: ${item.id}`);
      return success(item);
    } catch (error: any) {
      this.logError("Failed to create inventory item", error);
      return failure(error);
    }
  }

  async updateItem(id: string, input: UpdateInventoryItemInput): Promise<Result<InventoryItem>> {
    this.requirePermission("inventory:write");

    try {
      const existing = await this.repository.findById(id, this.ctx.companyId);
      if (!existing || existing.deletedAt) {
        return failure(new Error("Item not found"));
      }

      // Re-evaluate status if reorder level changes
      let newStatus = input.status || existing.status;
      if (input.reorderLevel !== undefined && input.status === undefined) {
        newStatus = this.calculateStatus(existing.availableQuantity, input.reorderLevel);
      }

      const item = await this.repository.update(id, this.ctx.companyId, {
        ...input,
        status: newStatus
      } as any);

      await eventBus.publish({
        type: DomainEvents.INVENTORY_ITEM_UPDATED,
        payload: { itemId: item.id, companyId: this.ctx.companyId },
        occurredOn: new Date()
      });

      return success(item);
    } catch (error: any) {
      this.logError(`Failed to update inventory item: ${id}`, error);
      return failure(error);
    }
  }

  async archiveItem(id: string): Promise<Result<boolean>> {
    this.requirePermission("inventory:delete");

    try {
      const existing = await this.repository.findById(id, this.ctx.companyId);
      if (!existing || existing.deletedAt) {
        return failure(new Error("Item not found"));
      }

      await this.repository.update(id, this.ctx.companyId, {
        deletedAt: new Date()
      } as any);

      return success(true);
    } catch (error: any) {
      this.logError(`Failed to archive inventory item: ${id}`, error);
      return failure(error);
    }
  }

  async adjustStock(input: AdjustStockInput): Promise<Result<InventoryItem>> {
    this.requirePermission("inventory:write");

    try {
      const item = await this.repository.findById(input.itemId, this.ctx.companyId);
      if (!item || item.deletedAt) {
        return failure(new Error("Item not found"));
      }

      if (input.quantity === 0) {
        return success(item);
      }

      const previousStock = item.currentStock;
      const newStock = item.currentStock + input.quantity;
      const newAvailable = item.availableQuantity + input.quantity;
      
      if (newStock < 0 || newAvailable < 0) {
        return failure(new Error("Adjustment would result in negative stock"));
      }

      const status = this.calculateStatus(newAvailable, item.reorderLevel);

      const updatedItem = await this.repository.update(item.id, this.ctx.companyId, {
        currentStock: newStock,
        availableQuantity: newAvailable,
        status
      } as any);

      await this.repository.recordAdjustment({
        companyId: this.ctx.companyId,
        itemId: item.id,
        userId: this.ctx.userId,
        quantity: input.quantity,
        reason: input.reason,
        notes: input.notes,
      });

      await this.repository.recordHistory({
        companyId: this.ctx.companyId,
        itemId: item.id,
        action: "ADJUSTED",
        previousQuantity: previousStock,
        newQuantity: newStock,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
      });

      await eventBus.publish({
        type: DomainEvents.INVENTORY_ADJUSTED,
        payload: { itemId: item.id, quantity: input.quantity, companyId: this.ctx.companyId },
        occurredOn: new Date()
      });

      return success(updatedItem);
    } catch (error: any) {
      this.logError(`Failed to adjust stock for item: ${input.itemId}`, error);
      return failure(error);
    }
  }

  async reserveStock(input: ReserveStockInput): Promise<Result<InventoryItem>> {
    this.requirePermission("inventory:write"); // Often called from other domains with systemic context

    try {
      const item = await this.repository.findById(input.itemId, this.ctx.companyId);
      if (!item || item.deletedAt) {
        return failure(new Error("Item not found"));
      }

      if (input.quantity <= 0) {
        return failure(new Error("Reservation quantity must be positive"));
      }

      if (item.availableQuantity < input.quantity) {
        return failure(new Error("Insufficient available stock to reserve"));
      }

      const newAvailable = item.availableQuantity - input.quantity;
      const newReserved = item.reservedQuantity + input.quantity;
      const status = this.calculateStatus(newAvailable, item.reorderLevel);

      const updatedItem = await this.repository.update(item.id, this.ctx.companyId, {
        availableQuantity: newAvailable,
        reservedQuantity: newReserved,
        status
      } as any);

      await this.repository.recordHistory({
        companyId: this.ctx.companyId,
        itemId: item.id,
        action: "RESERVED",
        previousQuantity: item.availableQuantity, // Tracking available quantity changes
        newQuantity: newAvailable,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
      });

      await eventBus.publish({
        type: DomainEvents.INVENTORY_RESERVED,
        payload: { itemId: item.id, quantity: input.quantity, reference: input.referenceId, companyId: this.ctx.companyId },
        occurredOn: new Date()
      });

      return success(updatedItem);
    } catch (error: any) {
      this.logError(`Failed to reserve stock for item: ${input.itemId}`, error);
      return failure(error);
    }
  }

  async releaseStock(input: ReleaseStockInput): Promise<Result<InventoryItem>> {
    this.requirePermission("inventory:write");

    try {
      const item = await this.repository.findById(input.itemId, this.ctx.companyId);
      if (!item || item.deletedAt) {
        return failure(new Error("Item not found"));
      }

      if (input.quantity <= 0) {
        return failure(new Error("Release quantity must be positive"));
      }

      if (item.reservedQuantity < input.quantity) {
        return failure(new Error("Cannot release more than reserved"));
      }

      const newAvailable = item.availableQuantity + input.quantity;
      const newReserved = item.reservedQuantity - input.quantity;
      const status = this.calculateStatus(newAvailable, item.reorderLevel);

      const updatedItem = await this.repository.update(item.id, this.ctx.companyId, {
        availableQuantity: newAvailable,
        reservedQuantity: newReserved,
        status
      } as any);

      await this.repository.recordHistory({
        companyId: this.ctx.companyId,
        itemId: item.id,
        action: "RELEASED",
        previousQuantity: item.availableQuantity,
        newQuantity: newAvailable,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
      });

      await eventBus.publish({
        type: DomainEvents.INVENTORY_RELEASED,
        payload: { itemId: item.id, quantity: input.quantity, reference: input.referenceId, companyId: this.ctx.companyId },
        occurredOn: new Date()
      });

      return success(updatedItem);
    } catch (error: any) {
      this.logError(`Failed to release stock for item: ${input.itemId}`, error);
      return failure(error);
    }
  }

  async consumeStock(input: ConsumeStockInput): Promise<Result<InventoryItem>> {
    this.requirePermission("inventory:write");

    try {
      const item = await this.repository.findById(input.itemId, this.ctx.companyId);
      if (!item || item.deletedAt) {
        return failure(new Error("Item not found"));
      }

      if (input.quantity <= 0) {
        return failure(new Error("Consume quantity must be positive"));
      }

      if (item.reservedQuantity < input.quantity) {
        return failure(new Error("Must reserve stock before consuming it, or quantity exceeds reservation"));
      }

      const newCurrent = item.currentStock - input.quantity;
      const newReserved = item.reservedQuantity - input.quantity;
      
      // availableQuantity remains unchanged because it was already reduced when reserved

      const updatedItem = await this.repository.update(item.id, this.ctx.companyId, {
        currentStock: newCurrent,
        reservedQuantity: newReserved,
      } as any);

      await this.repository.recordHistory({
        companyId: this.ctx.companyId,
        itemId: item.id,
        action: "CONSUMED",
        previousQuantity: item.currentStock,
        newQuantity: newCurrent,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
      });

      await eventBus.publish({
        type: DomainEvents.INVENTORY_CONSUMED,
        payload: { itemId: item.id, quantity: input.quantity, reference: input.referenceId, companyId: this.ctx.companyId },
        occurredOn: new Date()
      });

      return success(updatedItem);
    } catch (error: any) {
      this.logError(`Failed to consume stock for item: ${input.itemId}`, error);
      return failure(error);
    }
  }

  async search(params: InventorySearchParams): Promise<Result<PaginatedResult<InventoryItem>>> {
    this.requirePermission("inventory:read");
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;
      const result = await this.repository.search(this.ctx.companyId, params, page, limit);
      return success(result);
    } catch (error: any) {
      this.logError("Failed to search inventory", error);
      return failure(error);
    }
  }

  async getCategories(): Promise<Result<any[]>> {
    this.requirePermission("inventory:read");
    try {
      const result = await this.repository.getCategories(this.ctx.companyId);
      return success(result);
    } catch (error: any) {
      this.logError("Failed to get categories", error);
      return failure(error);
    }
  }
}

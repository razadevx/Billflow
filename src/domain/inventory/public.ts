import { RequestContext } from "@/server/core/RequestContext";
import { TransactionManager } from "@/server/db";
import { InventoryService } from "./service";
import { 
  CreateInventoryItemInput, 
  UpdateInventoryItemInput, 
  AdjustStockInput,
  ReserveStockInput,
  ReleaseStockInput,
  ConsumeStockInput,
  InventorySearchParams
} from "./types";

/**
 * InventoryFacade is the public interface for the Inventory domain.
 * Other domains (e.g., WorkOrders) MUST use this facade to interact with Inventory.
 */
export class InventoryFacade {
  
  static async createInventoryItem(ctx: RequestContext, input: CreateInventoryItemInput) {
    return TransactionManager.run(async (tx) => {
      const service = new InventoryService(ctx, tx);
      return service.createItem(input);
    });
  }

  static async updateInventoryItem(ctx: RequestContext, id: string, input: UpdateInventoryItemInput) {
    return TransactionManager.run(async (tx) => {
      const service = new InventoryService(ctx, tx);
      return service.updateItem(id, input);
    });
  }

  static async archiveInventoryItem(ctx: RequestContext, id: string) {
    return TransactionManager.run(async (tx) => {
      const service = new InventoryService(ctx, tx);
      return service.archiveItem(id);
    });
  }

  static async adjustStock(ctx: RequestContext, input: AdjustStockInput) {
    return TransactionManager.run(async (tx) => {
      const service = new InventoryService(ctx, tx);
      return service.adjustStock(input);
    });
  }

  static async reserveStock(ctx: RequestContext, input: ReserveStockInput) {
    return TransactionManager.run(async (tx) => {
      const service = new InventoryService(ctx, tx);
      return service.reserveStock(input);
    });
  }

  static async releaseStock(ctx: RequestContext, input: ReleaseStockInput) {
    return TransactionManager.run(async (tx) => {
      const service = new InventoryService(ctx, tx);
      return service.releaseStock(input);
    });
  }

  static async consumeStock(ctx: RequestContext, input: ConsumeStockInput) {
    return TransactionManager.run(async (tx) => {
      const service = new InventoryService(ctx, tx);
      return service.consumeStock(input);
    });
  }

  static async search(ctx: RequestContext, params: InventorySearchParams) {
    const service = new InventoryService(ctx); // Read operations may not need transactions
    return service.search(params);
  }

  static async paginate(ctx: RequestContext, params: InventorySearchParams) {
    const service = new InventoryService(ctx);
    return service.search(params); // search inherently paginates based on types
  }

  static async getCategories(ctx: RequestContext) {
    const service = new InventoryService(ctx);
    return service.getCategories();
  }
}

import { Result, success, failure } from "@/server/core/Result";
import { RequestContext } from "@/server/core/RequestContext";

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: "CUSTOMER" | "WORK_ORDER" | "INVOICE" | "PAYMENT" | "INVENTORY" | "REPORT" | "SYSTEM";
  icon: string;
  url: string;
  metadata?: Record<string, unknown>;
}

export class GlobalSearchService {
  constructor(private context: RequestContext) {}

  /**
   * Main entry point for Global Search (Ctrl + K)
   */
  async search(query: string): Promise<Result<SearchResult[], Error>> {
    if (!query || query.trim().length < 2) {
      return success([]);
    }

    try {
      const results: SearchResult[] = [];

      // Phase 5: Implement Customer Search
      // In the future, this will fan out to multiple services (e.g. InventoryService.search(), WorkOrderService.search())
      // For now, we will just prepare the architecture. 
      // The actual implementation will be injected or called from here once CustomerService is ready.
      
      // const customerResults = await this.customerService.search(query, this.context);
      // results.push(...customerResults);

      // Return unified results
      return success(results);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Global search failed"));
    }
  }
}

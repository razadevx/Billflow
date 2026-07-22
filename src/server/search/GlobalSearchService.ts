import { Result, success, failure } from "@/server/core/Result";
import { RequestContext } from "@/server/core/RequestContext";
import { db } from "@/server/db";

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

      const term = query.trim();
      const companyId = this.context.companyId;

      const [customers, workOrders, invoices, payments, inventory] = await Promise.all([
        db.customer.findMany({
          where: {
            companyId,
            deletedAt: null,
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { phone: { contains: term, mode: "insensitive" } },
              { email: { contains: term, mode: "insensitive" } },
              { customerCode: { contains: term, mode: "insensitive" } },
            ],
          },
          take: 5,
          orderBy: { updatedAt: "desc" },
        }),
        db.workOrder.findMany({
          where: {
            companyId,
            deletedAt: null,
            OR: [
              { orderNumber: { contains: term, mode: "insensitive" } },
              { title: { contains: term, mode: "insensitive" } },
              { customer: { name: { contains: term, mode: "insensitive" } } },
            ],
          },
          include: { customer: { select: { name: true } } },
          take: 5,
          orderBy: { updatedAt: "desc" },
        }),
        db.invoice.findMany({
          where: {
            companyId,
            deletedAt: null,
            OR: [
              { invoiceNumber: { contains: term, mode: "insensitive" } },
              { customer: { name: { contains: term, mode: "insensitive" } } },
            ],
          },
          include: { customer: { select: { name: true } } },
          take: 5,
          orderBy: { updatedAt: "desc" },
        }),
        db.payment.findMany({
          where: {
            companyId,
            deletedAt: null,
            OR: [
              { receiptNumber: { contains: term, mode: "insensitive" } },
              { referenceNumber: { contains: term, mode: "insensitive" } },
              { customer: { name: { contains: term, mode: "insensitive" } } },
            ],
          },
          include: { customer: { select: { name: true } } },
          take: 5,
          orderBy: { paymentDate: "desc" },
        }),
        db.inventoryItem.findMany({
          where: {
            companyId,
            deletedAt: null,
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { sku: { contains: term, mode: "insensitive" } },
            ],
          },
          take: 5,
          orderBy: { updatedAt: "desc" },
        }),
      ]);

      results.push(
        ...customers.map((customer) => ({
          id: customer.id,
          title: customer.name,
          subtitle: [customer.customerCode, customer.phone].filter(Boolean).join(" · "),
          type: "CUSTOMER" as const,
          icon: "customer",
          url: `/customers/${customer.id}`,
        })),
        ...workOrders.map((workOrder) => ({
          id: workOrder.id,
          title: `${workOrder.orderNumber} — ${workOrder.title}`,
          subtitle: `${workOrder.customer?.name || "No customer"} · ${workOrder.status}`,
          type: "WORK_ORDER" as const,
          icon: "workOrder",
          url: `/workorders/${workOrder.id}`,
        })),
        ...invoices.map((invoice) => ({
          id: invoice.id,
          title: `Invoice ${invoice.invoiceNumber}`,
          subtitle: `${invoice.customer?.name || "No customer"} · ${invoice.status}`,
          type: "INVOICE" as const,
          icon: "invoice",
          url: `/invoices/${invoice.id}`,
        })),
        ...payments.map((payment) => ({
          id: payment.id,
          title: `Payment ${payment.receiptNumber || payment.referenceNumber || payment.id.slice(0, 8)}`,
          subtitle: `${payment.customer?.name || "No customer"} · ${payment.method}`,
          type: "PAYMENT" as const,
          icon: "payment",
          url: `/payments`,
        })),
        ...inventory.map((item) => ({
          id: item.id,
          title: item.name,
          subtitle: [item.sku, `${item.availableQuantity} ${item.unit} available`].filter(Boolean).join(" · "),
          type: "INVENTORY" as const,
          icon: "inventory",
          url: `/inventory/${item.id}`,
        })),
      );

      return success(results);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error("Global search failed"));
    }
  }
}

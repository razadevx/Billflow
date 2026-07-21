import { RequestContext } from "@/server/core/RequestContext";
import { Result, success, failure } from "@/server/core/Result";
import { db as prisma } from "@/server/db";

export interface TimelineEvent {
  id: string;
  type: "CREATED" | "UPDATED" | "ORDER" | "INVOICE" | "PAYMENT" | "NOTE";
  title: string;
  description?: string;
  date: Date;
  metadata?: Record<string, unknown>;
}

export class CustomerTimelineService {
  async getTimeline(customerId: string, context: RequestContext): Promise<Result<TimelineEvent[], Error>> {
    try {
      const events: TimelineEvent[] = [];

      // 1. Get generic ActivityLogs (Created, Updated)
      const activityLogs = await prisma.activityLog.findMany({
        where: { entityType: "Customer", entityId: customerId, companyId: context.companyId },
        orderBy: { createdAt: "desc" },
        take: 10
      });

      activityLogs.forEach(log => {
        events.push({
          id: log.id,
          type: log.action === "CREATED" ? "CREATED" : "UPDATED",
          title: `Customer ${log.action.toLowerCase()}`,
          description: log.details || undefined,
          date: log.createdAt
        });
      });

      // 2. Get WorkOrders
      const orders = await prisma.workOrder.findMany({
        where: { customerId, companyId: context.companyId },
        orderBy: { createdAt: "desc" },
        take: 5
      });

      orders.forEach(order => {
        events.push({
          id: order.id,
          type: "ORDER",
          title: `Work Order ${order.orderNumber} created`,
          description: order.title,
          date: order.createdAt
        });
      });

      // 3. Get Payments
      const payments = await prisma.payment.findMany({
        where: { customerId, companyId: context.companyId },
        orderBy: { paymentDate: "desc" },
        take: 5
      });

      payments.forEach(payment => {
        events.push({
          id: payment.id,
          type: "PAYMENT",
          title: `Payment received`,
          description: `$${payment.amount} via ${payment.method}`,
          date: payment.paymentDate
        });
      });

      // Sort chronological descending
      events.sort((a, b) => b.date.getTime() - a.date.getTime());

      return success(events);
    } catch (error) {
      console.error(error);
      return failure(error instanceof Error ? error : new Error("Failed to compute timeline"));
    }
  }
}

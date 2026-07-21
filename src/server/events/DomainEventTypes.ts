export const DomainEvents = {
  // Inventory
  INVENTORY_ITEM_CREATED: "inventory.item.created.v1",
  INVENTORY_ITEM_UPDATED: "inventory.item.updated.v1",
  INVENTORY_ADJUSTED: "inventory.adjusted.v1",
  INVENTORY_RESERVED: "inventory.reserved.v1",
  INVENTORY_RELEASED: "inventory.released.v1",
  INVENTORY_CONSUMED: "inventory.consumed.v1",

  // Work Orders
  WORK_ORDER_CREATED: "workorder.created.v1",
  WORK_ORDER_UPDATED: "workorder.updated.v1",
  WORK_ORDER_COMPLETED: "workorder.completed.v1",
  WORK_ORDER_CANCELLED: "workorder.cancelled.v1",
  WORK_ORDER_ASSIGNED: "workorder.assigned.v1",

  // Payments
  PAYMENT_RECORDED: "payment.recorded.v1",
  PAYMENT_VOIDED: "payment.voided.v1",
  PAYMENT_UPDATED: "payment.updated.v1",

  // Invoices (Future)
  INVOICE_GENERATED: "invoice.generated.v1",
  INVOICE_SENT: "invoice.sent.v1",
  INVOICE_PAID: "invoice.paid.v1",
  INVOICE_VOIDED: "invoice.voided.v1",

  // Customers
  CUSTOMER_CREATED: "customer.created.v1",
  CUSTOMER_UPDATED: "customer.updated.v1",
  CUSTOMER_ARCHIVED: "customer.archived.v1",
} as const;

export type DomainEventType = typeof DomainEvents[keyof typeof DomainEvents];

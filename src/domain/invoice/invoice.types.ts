export interface CreateInvoiceFromWorkOrderDTO {
  workOrderId: string;
  notes?: string;
  terms?: string;
  dueDate?: Date;
}

export interface UpdateInvoiceStatusDTO {
  status: "DRAFT" | "ISSUED" | "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "CANCELLED";
  notes?: string;
}

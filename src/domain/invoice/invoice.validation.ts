import { z } from "zod";

export const CreateInvoiceFromWorkOrderSchema = z.object({
  workOrderId: z.string().uuid(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

export const UpdateInvoiceStatusSchema = z.object({
  status: z.enum(["DRAFT", "ISSUED", "PAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"]),
  notes: z.string().optional(),
});

import { z } from "zod";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

export const createPaymentSchema = z.object({
  customerId: z.string().uuid(),
  workOrderId: z.string().uuid().optional().nullable(),
  invoiceId: z.string().uuid().optional().nullable(),
  receiptNumber: z.string().optional().nullable(),
  amount: z.number().positive(),
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paymentDate: z.coerce.date().default(() => new Date()),
});

export const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paymentDate: z.coerce.date().optional(),
});

export const voidPaymentSchema = z.object({
  notes: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type VoidPaymentInput = z.infer<typeof voidPaymentSchema>;
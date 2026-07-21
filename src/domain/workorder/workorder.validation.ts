import { z } from "zod";
import { WorkOrderStatus } from "@prisma/client";

export const CreateWorkOrderLineItemSchema = z.object({
  inventoryItemId: z.string().uuid().optional(),
  description: z.string().min(1),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().min(0).optional(),
  taxRate: z.number().min(0).optional(),
  isSqFt: z.boolean().optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  rate: z.number().min(0).optional(),
});

export const CreateWorkOrderSchema = z.object({
  customerId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.number().int().min(0).max(2).optional(),
  expectedDate: z.coerce.date().optional(),
  lineItems: z.array(CreateWorkOrderLineItemSchema).min(1),
});

export const UpdateWorkOrderSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  priority: z.number().int().min(0).max(2).optional(),
  expectedDate: z.coerce.date().nullable().optional(),
  status: z.nativeEnum(WorkOrderStatus).optional(),
});

export const AssignWorkOrderSchema = z.object({
  userId: z.string().uuid(),
  date: z.coerce.date(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
});

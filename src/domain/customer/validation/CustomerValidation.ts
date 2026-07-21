import { z } from "zod";

export const CreateCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
  creditLimit: z.coerce.number().min(0).default(0),
  preferredContact: z.enum(["EMAIL", "PHONE", "WHATSAPP"]).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED", "BLOCKED"]).optional()
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;

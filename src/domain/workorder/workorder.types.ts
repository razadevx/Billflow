import { WorkOrderStatus } from "@prisma/client";

export interface CreateWorkOrderDTO {
  customerId: string;
  title: string;
  description?: string;
  priority?: number;
  expectedDate?: Date;
  lineItems: CreateWorkOrderLineItemDTO[];
}

export interface CreateWorkOrderLineItemDTO {
  inventoryItemId?: string;
  description: string;
  quantity?: number;
  unitPrice?: number;
  taxRate?: number;
  
  // SqFt Engine fields
  isSqFt?: boolean;
  width?: number;
  height?: number;
  rate?: number;
}

export interface UpdateWorkOrderDTO {
  title?: string;
  description?: string;
  priority?: number;
  expectedDate?: Date | null;
  status?: WorkOrderStatus;
}

export interface AssignWorkOrderDTO {
  userId: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  title: string;
  description?: string;
}

export interface WorkOrderFilter {
  status?: WorkOrderStatus;
  customerId?: string;
  searchTerm?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

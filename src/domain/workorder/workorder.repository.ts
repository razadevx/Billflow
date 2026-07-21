import { BaseRepository } from "@/server/core/BaseRepository";
import { DbClient } from "@/server/db";
import { WorkOrder, LineItem, Prisma } from "@prisma/client";

export class WorkOrderRepository extends BaseRepository<WorkOrder, Prisma.WorkOrderUncheckedCreateInput, Prisma.WorkOrderUpdateInput> {
  protected get delegate() { return this.db.workOrder; }
  
  constructor(protected readonly db: DbClient) {
    super(db);
  }

  async createWithLineItems(
    data: Prisma.WorkOrderUncheckedCreateInput,
    lineItems: Prisma.LineItemUncheckedCreateWithoutWorkOrderInput[]
  ) {
    return this.db.workOrder.create({
      data: {
        ...data,
        lineItems: { create: lineItems },
      },
      include: { lineItems: true },
    });
  }

  async findByIdWithDetails(id: string, companyId: string) {
    return this.db.workOrder.findUnique({
      where: { id, companyId },
      include: {
        lineItems: true,
        notes: true,
        attachments: true,
        customer: true,
        scheduleEntries: true,
        invoices: true,
      },
    });
  }

  async update(id: string, companyId: string, data: Prisma.WorkOrderUpdateInput) {
    return this.db.workOrder.update({
      where: { id, companyId },
      data,
    });
  }

  async createAssignment(data: Prisma.DailyScheduleUncheckedCreateInput) {
    return this.db.dailySchedule.create({
      data,
    });
  }
}

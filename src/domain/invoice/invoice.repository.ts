import { BaseRepository } from "@/server/core/BaseRepository";
import { Prisma } from "@prisma/client";

export class InvoiceRepository extends BaseRepository<Prisma.InvoiceGetPayload<{}>, Prisma.InvoiceUncheckedCreateInput, Prisma.InvoiceUncheckedUpdateInput> {
  protected get delegate() {
    return this.prisma.invoice;
  }

  async createInvoice(data: Prisma.InvoiceUncheckedCreateInput) {
    return this.prisma.invoice.create({ data });
  }

  async findById(id: string, companyId: string) {
    return this.prisma.invoice.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        customer: true,
        workOrder: {
          include: {
            lineItems: true
          }
        },
        payments: true
      }
    });
  }

  async findMany(companyId: string) {
    return this.prisma.invoice.findMany({
      where: { companyId, deletedAt: null },
      include: {
        customer: true,
        workOrder: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateStatus(id: string, companyId: string, status: "DRAFT" | "ISSUED" | "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "CANCELLED") {
    return this.prisma.invoice.updateMany({
      where: { id, companyId },
      data: { status }
    });
  }
}

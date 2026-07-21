import { BaseRepository } from "@/server/core/BaseRepository";
import { Payment, Prisma, PaymentStatus } from "@prisma/client";
import { DbClient, db } from "@/server/db";

export class PaymentRepository extends BaseRepository<Payment, Omit<Prisma.PaymentUncheckedCreateInput, "companyId">, Prisma.PaymentUncheckedUpdateInput> {
  constructor(prismaClient: DbClient = db) {
    super(prismaClient);
  }

  protected get delegate() {
    return this.prisma.payment;
  }

  async findWithHistory(id: string, companyId: string) {
    return this.delegate.findUnique({
      where: { id, companyId },
      include: { history: true },
    });
  }

  async addHistory(companyId: string, paymentId: string, status: PaymentStatus, notes?: string | null) {
    return this.prisma.paymentHistory.create({
      data: {
        companyId,
        paymentId,
        status,
        notes: notes || null,
      },
    });
  }
}

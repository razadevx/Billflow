import { BaseRepository } from "@/server/core/BaseRepository";
import { DbClient } from "@/server/db";
import { Invitation, Prisma } from "@prisma/client";

export class InvitationRepository extends BaseRepository<Invitation, Prisma.InvitationUncheckedCreateInput, Prisma.InvitationUpdateInput> {
  protected get delegate() { return this.db.invitation; }
  
  constructor(protected readonly db: DbClient) {
    super(db);
  }

  async findActiveByEmail(email: string, companyId: string) {
    return this.db.invitation.findFirst({
      where: {
        email,
        companyId,
        expiresAt: { gt: new Date() },
        acceptedAt: null,
      }
    });
  }

  async findByToken(token: string) {
    return this.db.invitation.findUnique({
      where: { token }
    });
  }
}

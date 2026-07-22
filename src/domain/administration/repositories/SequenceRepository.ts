import { Sequence, Prisma } from "@prisma/client";
import { BaseRepository } from "@/server/core/BaseRepository";
import { db as prisma, DbClient } from "@/server/db";

export class SequenceRepository extends BaseRepository<
  Sequence,
  Prisma.SequenceCreateInput,
  Prisma.SequenceUpdateInput
> {
  protected get delegate() {
    return this.prisma.sequence;
  }

  constructor(protected readonly db: DbClient = prisma) {
    super(db);
  }

  async findByType(companyId: string, type: string): Promise<Sequence | null> {
    return this.delegate.findUnique({
      where: {
        companyId_type: {
          companyId,
          type,
        },
      },
    });
  }
}

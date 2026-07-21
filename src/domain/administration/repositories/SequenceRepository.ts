import { Sequence, Prisma } from "@prisma/client";
import { BaseRepository } from "@/server/core/BaseRepository";
import { db as prisma } from "@/server/db";

export class SequenceRepository extends BaseRepository<
  Sequence,
  Prisma.SequenceCreateInput,
  Prisma.SequenceUpdateInput
> {
  protected get delegate() {
    return this.prisma.sequence;
  }

  constructor() {
    super(prisma);
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

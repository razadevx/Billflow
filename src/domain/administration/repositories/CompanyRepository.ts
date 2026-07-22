import { Company, Prisma } from "@prisma/client";
import { BaseRepository } from "@/server/core/BaseRepository";
import { db as prisma, DbClient } from "@/server/db";

export class CompanyRepository extends BaseRepository<
  Company,
  Prisma.CompanyCreateInput,
  Prisma.CompanyUpdateInput
> {
  protected get delegate() {
    return this.prisma.company;
  }

  constructor(protected readonly db: DbClient = prisma) {
    super(db);
  }
}

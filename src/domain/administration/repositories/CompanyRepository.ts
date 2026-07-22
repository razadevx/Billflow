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

  // Overrides for Company model because it is the tenant root and has no companyId
  override async findById(id: string, _companyId: string): Promise<Company | null> {
    return this.delegate.findUnique({
      where: { id },
    });
  }

  override async findMany(_companyId: string, args: any = {}): Promise<Company[]> {
    return this.delegate.findMany(args);
  }

  override async create(_companyId: string, data: Prisma.CompanyCreateInput): Promise<Company> {
    return this.delegate.create({
      data,
    });
  }

  override async update(id: string, _companyId: string, data: Prisma.CompanyUpdateInput): Promise<Company> {
    return this.delegate.update({
      where: { id },
      data,
    });
  }

  override async delete(id: string, _companyId: string): Promise<Company> {
    return this.delegate.delete({
      where: { id },
    });
  }

  override async exists(id: string, _companyId: string): Promise<boolean> {
    const count = await this.delegate.count({
      where: { id },
    });
    return count > 0;
  }
}

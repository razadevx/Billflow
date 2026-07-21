import { DbClient, db } from "../db";

export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  constructor(protected readonly prisma: DbClient = db) {}

  // The implementer must specify the Prisma delegate for their specific model
  protected abstract get delegate(): any;

  async findById(id: string, companyId: string): Promise<T | null> {
    return this.delegate.findUnique({
      where: { id, companyId },
    });
  }

  async findMany(companyId: string, args: any = {}): Promise<T[]> {
    return this.delegate.findMany({
      ...args,
      where: {
        ...args.where,
        companyId,
      },
    });
  }

  async create(companyId: string, data: CreateInput): Promise<T> {
    return this.delegate.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async update(id: string, companyId: string, data: UpdateInput): Promise<T> {
    return this.delegate.update({
      where: { id, companyId },
      data,
    });
  }

  async delete(id: string, companyId: string): Promise<T> {
    return this.delegate.delete({
      where: { id, companyId },
    });
  }

  async exists(id: string, companyId: string): Promise<boolean> {
    const count = await this.delegate.count({
      where: { id, companyId },
    });
    return count > 0;
  }
}

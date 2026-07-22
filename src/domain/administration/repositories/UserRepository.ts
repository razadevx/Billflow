import { User, Prisma } from "@prisma/client";
import { BaseRepository } from "@/server/core/BaseRepository";
import { db as prisma, DbClient } from "@/server/db";

export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  protected get delegate() {
    return this.prisma.user;
  }

  constructor(protected readonly db: DbClient = prisma) {
    super(db);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.delegate.findUnique({
      where: { email },
    });
  }
}

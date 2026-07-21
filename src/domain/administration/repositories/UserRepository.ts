import { User, Prisma } from "@prisma/client";
import { BaseRepository } from "@/server/core/BaseRepository";
import { db as prisma } from "@/server/db";

export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  protected get delegate() {
    return this.prisma.user;
  }

  constructor() {
    super(prisma);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.delegate.findUnique({
      where: { email },
    });
  }
}

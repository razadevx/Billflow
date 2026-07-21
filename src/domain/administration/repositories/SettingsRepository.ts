import { Settings, Prisma } from "@prisma/client";
import { BaseRepository } from "@/server/core/BaseRepository";
import { db as prisma } from "@/server/db";

export class SettingsRepository extends BaseRepository<
  Settings,
  Prisma.SettingsCreateInput,
  Prisma.SettingsUpdateInput
> {
  protected get delegate() {
    return this.prisma.settings;
  }

  constructor() {
    super(prisma);
  }

  async findByKey(companyId: string, key: string): Promise<Settings | null> {
    return this.delegate.findUnique({
      where: {
        companyId_key: {
          companyId,
          key,
        },
      },
    });
  }

  async upsertSetting(companyId: string, key: string, value: string): Promise<Settings> {
    return this.delegate.upsert({
      where: {
        companyId_key: {
          companyId,
          key,
        },
      },
      update: { value },
      create: { companyId, key, value },
    });
  }
}

import { RequestContext } from "@/server/core/RequestContext";
import { BaseService } from "@/server/core/BaseService";
import { SettingsRepository } from "../repositories/SettingsRepository";
import { UserRepository } from "../repositories/UserRepository";
import { CompanyRepository } from "../repositories/CompanyRepository";
import { SequenceRepository } from "../repositories/SequenceRepository";
import { Result, success, failure } from "@/server/core/Result";
import { User, Company, Settings, Sequence, Role } from "@prisma/client";

export class AdministrationService extends BaseService {
  private settingsRepo: SettingsRepository;
  private userRepo: UserRepository;
  private companyRepo: CompanyRepository;
  private sequenceRepo: SequenceRepository;

  constructor(ctx: RequestContext) {
    super(ctx);
    this.settingsRepo = new SettingsRepository();
    this.userRepo = new UserRepository();
    this.companyRepo = new CompanyRepository();
    this.sequenceRepo = new SequenceRepository();
  }

  // --- Company Settings ---
  async getCompanySettings(): Promise<Result<Settings[]>> {
    this.requirePermission("manage");
    try {
      const settings = await this.settingsRepo.findMany(this.ctx.companyId);
      return success(settings);
    } catch (e) {
      this.logError("Failed to fetch settings", e);
      return failure(e as Error);
    }
  }

  async updateSetting(key: string, value: string): Promise<Result<Settings>> {
    this.requirePermission("manage");
    try {
      const setting = await this.settingsRepo.upsertSetting(this.ctx.companyId, key, value);
      this.logInfo(`Updated setting ${key}`);
      return success(setting);
    } catch (e) {
      this.logError(`Failed to update setting ${key}`, e);
      return failure(e as Error);
    }
  }

  // --- Users ---
  async listUsers(): Promise<Result<User[]>> {
    this.requirePermission("manage");
    try {
      const users = await this.userRepo.findMany(this.ctx.companyId);
      return success(users);
    } catch (e) {
      this.logError("Failed to list users", e);
      return failure(e as Error);
    }
  }

  async updateUserRole(userId: string, role: Role): Promise<Result<User>> {
    this.requirePermission("manage");
    try {
      const user = await this.userRepo.update(userId, this.ctx.companyId, { role });
      this.logInfo(`Updated user ${userId} role to ${role}`);
      return success(user);
    } catch (e) {
      this.logError(`Failed to update user role ${userId}`, e);
      return failure(e as Error);
    }
  }

  // --- Company Details ---
  async getCompany(): Promise<Result<Company>> {
    this.requirePermission("manage");
    try {
      const company = await this.companyRepo.findById(this.ctx.companyId, this.ctx.companyId);
      if (!company) throw new Error("Company not found");
      return success(company);
    } catch (e) {
      this.logError("Failed to fetch company", e);
      return failure(e as Error);
    }
  }

  async updateCompany(data: Partial<Company>): Promise<Result<Company>> {
    this.requirePermission("manage");
    try {
      const company = await this.companyRepo.update(this.ctx.companyId, this.ctx.companyId, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        taxId: data.taxId,
      });
      this.logInfo("Updated company details");
      return success(company);
    } catch (e) {
      this.logError("Failed to update company", e);
      return failure(e as Error);
    }
  }

  // --- Sequences ---
  async listSequences(): Promise<Result<Sequence[]>> {
    this.requirePermission("manage");
    try {
      const sequences = await this.sequenceRepo.findMany(this.ctx.companyId);
      return success(sequences);
    } catch (e) {
      this.logError("Failed to list sequences", e);
      return failure(e as Error);
    }
  }

  async updateSequence(id: string, lastValue: number): Promise<Result<Sequence>> {
    this.requirePermission("manage");
    try {
      const sequence = await this.sequenceRepo.update(id, this.ctx.companyId, { lastValue });
      this.logInfo(`Updated sequence ${id}`);
      return success(sequence);
    } catch (e) {
      this.logError(`Failed to update sequence ${id}`, e);
      return failure(e as Error);
    }
  }

  // --- Profile Management ---
  async getProfile(): Promise<Result<User>> {
    try {
      const user = await this.userRepo.findById(this.ctx.userId, this.ctx.companyId);
      if (!user) throw new Error("User not found");
      return success(user);
    } catch (e) {
      this.logError("Failed to fetch profile", e);
      return failure(e as Error);
    }
  }

  async updateProfile(name: string): Promise<Result<User>> {
    try {
      const user = await this.userRepo.update(this.ctx.userId, this.ctx.companyId, { name });
      this.logInfo("Updated profile");
      return success(user);
    } catch (e) {
      this.logError("Failed to update profile", e);
      return failure(e as Error);
    }
  }
}

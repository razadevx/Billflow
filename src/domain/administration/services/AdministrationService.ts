import { RequestContext } from "@/server/core/RequestContext";
import { BaseService } from "@/server/core/BaseService";
import { SettingsRepository } from "../repositories/SettingsRepository";
import { UserRepository } from "../repositories/UserRepository";
import { CompanyRepository } from "../repositories/CompanyRepository";
import { SequenceRepository } from "../repositories/SequenceRepository";
import { InvitationRepository } from "../repositories/InvitationRepository";
import { Result, success, failure } from "@/server/core/Result";
import { User, Company, Settings, Sequence, Role, Invitation } from "@prisma/client";
import { TransactionManager, db } from "@/server/db";
import crypto from "crypto";

export class AdministrationService extends BaseService {
  private settingsRepo: SettingsRepository;
  private userRepo: UserRepository;
  private companyRepo: CompanyRepository;
  private sequenceRepo: SequenceRepository;
  private invitationRepo: InvitationRepository;

  constructor(ctx: RequestContext) {
    super(ctx);
    this.settingsRepo = new SettingsRepository(db);
    this.userRepo = new UserRepository(db);
    this.companyRepo = new CompanyRepository(db);
    this.sequenceRepo = new SequenceRepository(db);
    this.invitationRepo = new InvitationRepository(db);
  }

  private async logActivity(tx: any, action: string, details: any) {
    await tx.activityLog.create({
      data: {
        companyId: this.ctx.companyId,
        userId: this.ctx.userId,
        entityType: "Administration",
        entityId: this.ctx.companyId,
        action,
        details: JSON.stringify(details),
      }
    });
  }

  // --- Company Settings ---
  async getCompanySettings(): Promise<Result<Settings[]>> {
    this.requirePermission("settings:manage");
    try {
      const settings = await this.settingsRepo.findMany(this.ctx.companyId);
      return success(settings);
    } catch (e) {
      this.logError("Failed to fetch settings", e);
      return failure(e as Error);
    }
  }

  async updateSetting(key: string, value: string): Promise<Result<Settings>> {
    this.requirePermission("settings:manage");
    try {
      return await TransactionManager.run(async (tx) => {
        const repo = new SettingsRepository(tx);
        const setting = await repo.upsertSetting(this.ctx.companyId, key, value);
        await this.logActivity(tx, "SETTING_UPDATED", { key, value });
        return success(setting);
      });
    } catch (e) {
      this.logError(`Failed to update setting ${key}`, e);
      return failure(e as Error);
    }
  }

  // --- Users ---
  async listUsers(): Promise<Result<User[]>> {
    this.requirePermission("users:read");
    try {
      const users = await this.userRepo.findMany(this.ctx.companyId);
      return success(users);
    } catch (e) {
      this.logError("Failed to list users", e);
      return failure(e as Error);
    }
  }

  async updateUserRole(userId: string, role: Role): Promise<Result<User>> {
    this.requirePermission("users:manage");
    try {
      return await TransactionManager.run(async (tx) => {
        const repo = new UserRepository(tx);
        const user = await repo.update(userId, this.ctx.companyId, { role });
        await this.logActivity(tx, "USER_ROLE_UPDATED", { userId, role });
        return success(user);
      });
    } catch (e) {
      this.logError(`Failed to update user role ${userId}`, e);
      return failure(e as Error);
    }
  }

  async updateUserDetails(userId: string, data: { name?: string; email?: string }): Promise<Result<User>> {
    this.requirePermission("users:manage");
    try {
      return await TransactionManager.run(async (tx) => {
        const repo = new UserRepository(tx);
        const user = await repo.update(userId, this.ctx.companyId, data);
        await this.logActivity(tx, "USER_DETAILS_UPDATED", { userId, data });
        return success(user);
      });
    } catch (e) {
      this.logError(`Failed to update user details ${userId}`, e);
      return failure(e as Error);
    }
  }

  // --- Company Details ---
  async getCompany(): Promise<Result<Company>> {
    this.requirePermission("settings:read");
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
    this.requirePermission("settings:manage");
    try {
      return await TransactionManager.run(async (tx) => {
        const repo = new CompanyRepository(tx);
        const company = await repo.update(this.ctx.companyId, this.ctx.companyId, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          taxId: data.taxId,
        });
        await this.logActivity(tx, "COMPANY_PROFILE_UPDATED", { data });
        return success(company);
      });
    } catch (e) {
      this.logError("Failed to update company", e);
      return failure(e as Error);
    }
  }

  // --- Sequences ---
  async listSequences(): Promise<Result<Sequence[]>> {
    this.requirePermission("settings:read");
    try {
      const sequences = await this.sequenceRepo.findMany(this.ctx.companyId);
      return success(sequences);
    } catch (e) {
      this.logError("Failed to list sequences", e);
      return failure(e as Error);
    }
  }

  async updateSequence(id: string, lastValue: number): Promise<Result<Sequence>> {
    this.requirePermission("settings:manage");
    try {
      return await TransactionManager.run(async (tx) => {
        const repo = new SequenceRepository(tx);
        const existing = await repo.findById(id, this.ctx.companyId);
        if (!existing) throw new Error("Sequence not found");
        
        if (lastValue < existing.lastValue) {
          throw new Error("Cannot move sequence backwards");
        }

        const sequence = await repo.update(id, this.ctx.companyId, { lastValue });
        await this.logActivity(tx, "SEQUENCE_UPDATED", { type: existing.type, lastValue });
        return success(sequence);
      });
    } catch (e) {
      this.logError(`Failed to update sequence ${id}`, e);
      return failure(e as Error);
    }
  }

  // --- Invitations ---
  async listInvitations(): Promise<Result<Invitation[]>> {
    this.requirePermission("users:read");
    try {
      const invitations = await this.invitationRepo.findMany(this.ctx.companyId);
      return success(invitations);
    } catch (e) {
      this.logError("Failed to list invitations", e);
      return failure(e as Error);
    }
  }

  async createInvitation(email: string, role: Role): Promise<Result<Invitation>> {
    this.requirePermission("users:manage");
    try {
      return await TransactionManager.run(async (tx) => {
        const repo = new InvitationRepository(tx);
        
        // Check for active invite
        const active = await repo.findActiveByEmail(email, this.ctx.companyId);
        if (active) throw new Error("An active invitation already exists for this email");

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

        const invitation = await repo.create(this.ctx.companyId, {
          email,
          companyId: this.ctx.companyId,
          role,
          token,
          expiresAt
        });

        await this.logActivity(tx, "USER_INVITED", { email, role });
        return success(invitation);
      });
    } catch (e) {
      this.logError("Failed to create invitation", e);
      return failure(e as Error);
    }
  }

  async revokeInvitation(id: string): Promise<Result<boolean>> {
    this.requirePermission("users:manage");
    try {
      return await TransactionManager.run(async (tx) => {
        const repo = new InvitationRepository(tx);
        const invitation = await repo.findById(id, this.ctx.companyId);
        if (!invitation) throw new Error("Invitation not found");
        
        // Expire immediately
        await repo.update(id, this.ctx.companyId, { expiresAt: new Date() });
        
        await this.logActivity(tx, "INVITATION_REVOKED", { email: invitation.email });
        return success(true);
      });
    } catch (e) {
      this.logError("Failed to revoke invitation", e);
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
      return await TransactionManager.run(async (tx) => {
        const repo = new UserRepository(tx);
        const user = await repo.update(this.ctx.userId, this.ctx.companyId, { name });
        return success(user);
      });
    } catch (e) {
      this.logError("Failed to update profile", e);
      return failure(e as Error);
    }
  }
}

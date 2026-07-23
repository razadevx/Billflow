import { db, TransactionManager } from "../db";
import { Prisma } from "@prisma/client";
import { auth } from "../auth";

export interface BootstrapCompanyInput {
  companyName: string;
  userName: string;
  email: string;
  password?: string;
  // If not using email/password but OAuth, password might be optional
}

export class CompanyBootstrapService {
  /**
   * Orchestrates the creation of a new Company, the Owner user, and initial defaults.
   */
  static async bootstrap(input: BootstrapCompanyInput, reqHeaders: Headers) {
    // 1. Pre-flight check: Ensure user email doesn't already exist
    const existingUser = await db.user.findUnique({ where: { email: input.email } });
    if (existingUser) {
      throw new Error("Email is already registered");
    }

    // 2. Create Company & Defaults inside transaction
    const company = await TransactionManager.run(async (tx) => {
      const newCompany = await tx.company.create({
        data: { name: input.companyName },
      });

      await tx.sequence.createMany({
        data: [
          { companyId: newCompany.id, type: "CUSTOMER", lastValue: 0 },
          { companyId: newCompany.id, type: "WORK_ORDER", lastValue: 0 },
          { companyId: newCompany.id, type: "INVOICE", lastValue: 0 },
          { companyId: newCompany.id, type: "PAYMENT", lastValue: 0 },
        ],
      });

      return newCompany;
    });

    // 3. Create the User via BetterAuth
    try {
      if (!input.password) {
        throw new Error("Password is required for email registration");
      }

      const res = await auth.api.signUpEmail({
        body: {
          email: input.email,
          password: input.password,
          name: input.userName,
          companyId: company.id,
          role: "OWNER",
        } as any,
        headers: reqHeaders,
      });

      // 4. Create Audit Log
      await db.auditLog.create({
        data: {
          companyId: company.id,
          userId: res.user.id,
          event: "COMPANY_CREATED",
          details: JSON.stringify({ name: input.companyName }),
        },
      });

      return { company, user: res.user };
    } catch (e) {
      // If user creation fails, we might want to cleanup the company
      await db.company.delete({ where: { id: company.id } });
      throw e;
    }
  }
}

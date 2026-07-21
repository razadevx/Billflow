import { db } from "../db";

export class CurrentCompanyService {
  /**
   * Resolves the active company for the given user.
   * Future-proofs the application for when a single user can belong to multiple companies.
   * Right now, it just returns the user's primary companyId from the DB.
   */
  static async resolveActiveCompanyId(userId: string): Promise<string | null> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });
    
    return user?.companyId || null;
  }
}

import { db } from "../db";
import { Role } from "@prisma/client";
import crypto from "crypto";

export class InvitationService {
  /**
   * Generates a secure invitation for a given email and role, tied to a specific company.
   * Prints the invitation URL to the console for local development.
   */
  static async createInvitation(companyId: string, email: string, role: Role = "STAFF") {
    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("User already exists with this email.");
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create or update invitation
    const invitation = await db.invitation.create({
      data: {
        email,
        companyId,
        role,
        token,
        expiresAt,
      },
    });

    // In local dev, print the link
    const inviteUrl = `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/auth/invite/${token}`;
    console.log(`\n\n======================================================`);
    console.log(`✉️ INVITATION CREATED FOR: ${email}`);
    console.log(`🔗 INVITATION URL: ${inviteUrl}`);
    console.log(`======================================================\n\n`);

    return invitation;
  }

  /**
   * Validates an invitation token and returns the invitation details.
   */
  static async validateToken(token: string) {
    const invitation = await db.invitation.findUnique({
      where: { token },
      include: { company: true },
    });

    if (!invitation) {
      throw new Error("Invalid invitation token.");
    }

    if (invitation.acceptedAt) {
      throw new Error("Invitation has already been accepted.");
    }

    if (new Date() > invitation.expiresAt) {
      throw new Error("Invitation has expired.");
    }

    return invitation;
  }

  /**
   * Marks the invitation as accepted.
   */
  static async acceptInvitation(token: string) {
    return await db.invitation.update({
      where: { token },
      data: { acceptedAt: new Date() },
    });
  }
}

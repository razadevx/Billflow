import { NextRequest, NextResponse } from "next/server";
import { InvitationService } from "@/server/services/InvitationService";
import { getRequestContext } from "@/server/core/context";
import { successResponse, errorResponse } from "@/server/api/response";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    // Only OWNER or ADMIN can invite
    if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
      return errorResponse("Forbidden", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const { email, role } = body;

    if (!email) {
      return errorResponse("Email is required", "INVALID_INPUT", 400);
    }

    const invitation = await InvitationService.createInvitation(
      ctx.companyId,
      email,
      role || "STAFF"
    );

    return successResponse({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt
    });

  } catch (error: any) {
    console.error("Failed to create invitation:", error);
    return errorResponse(error.message || "Failed to create invitation", "INVITATION_FAILED", 500);
  }
}

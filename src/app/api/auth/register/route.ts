import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { CompanyBootstrapService } from "@/server/services/CompanyBootstrapService";
import { successResponse, errorResponse } from "@/server/api/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, userName, email, password } = body;

    if (!companyName || !userName || !email || !password) {
      return errorResponse("Missing required fields", "INVALID_INPUT", 400);
    }

    // Pass headers down to better-auth
    const result = await CompanyBootstrapService.bootstrap(
      {
        companyName,
        userName,
        email,
        password,
      },
      req.headers
    );

    return successResponse({
      company: result.company,
      user: result.user,
    });
  } catch (error: any) {
    console.error("Registration failed:", error);
    return errorResponse(error.message || "Registration failed", "REGISTRATION_FAILED", 500);
  }
}

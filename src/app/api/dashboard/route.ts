import { getRequestContext } from "@/server/core/context";
import { NextRequest } from "next/server";
import { DashboardService } from "@/domain/dashboard.service";
import { successResponse, errorResponse } from "@/server/api/response";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const context = await getRequestContext();
    if (!context) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);

    const service = new DashboardService();
    const result = await service.getDashboardData(context.companyId);

    if (result.isSuccess()) {
      return successResponse(result.value);
    } else {
      return errorResponse(result.error.message, "INTERNAL_ERROR", 500);
    }
  } catch (error: unknown) {
    return errorResponse((error as Error).message || "Failed to fetch dashboard data", "INTERNAL_ERROR", 500);
  }
}

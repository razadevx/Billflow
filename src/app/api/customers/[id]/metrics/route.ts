import { NextRequest, NextResponse } from "next/server";
import { CustomerMetricsService } from "@/domain/customer/services/CustomerMetricsService";
import { RequestContext } from "@/server/core/RequestContext";
import { successResponse, errorResponse } from "@/server/api/response";
import { getRequestContext } from "@/server/core/context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const context = await getRequestContext();

    if (!context) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    }

    const service = new CustomerMetricsService();
    
    const result = await service.getMetrics(params.id, context);
    
    if (result.isSuccess()) {
      return successResponse(result.value);
    } else {
      return NextResponse.json(errorResponse(result.error.message, "BAD_REQUEST"), { status: 400 });
    }
  } catch (error) {
    return errorResponse("Failed to fetch customer metrics", "INTERNAL_ERROR", 500);
  }
}

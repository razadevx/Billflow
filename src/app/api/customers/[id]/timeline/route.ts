import { getRequestContext } from "@/server/core/context";
import { NextRequest, NextResponse } from "next/server";
import { CustomerTimelineService } from "@/domain/customer/services/CustomerTimelineService";
import { RequestContext } from "@/server/core/RequestContext";
import { successResponse, errorResponse } from "@/server/api/response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const context = await getRequestContext();
    if (!context) return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
    const service = new CustomerTimelineService();
    
    const result = await service.getTimeline(params.id, context);
    
    if (result.isSuccess()) {
      return successResponse(result.value);
    } else {
      return NextResponse.json(errorResponse(result.error.message, "BAD_REQUEST"), { status: 400 });
    }
  } catch (error) {
    return errorResponse("Failed to fetch customer timeline", "INTERNAL_ERROR", 500);
  }
}

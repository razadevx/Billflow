import { NextResponse, NextRequest } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { WorkOrderService } from "@/domain/workorder/workorder.service";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await request.json();
    const { granularStatus, prismaStatus } = body;
    
    if (!granularStatus || !prismaStatus) {
      return NextResponse.json({ error: "Missing status fields" }, { status: 400 });
    }

    const service = new WorkOrderService(ctx);
    let result;

    if (prismaStatus === 'COMPLETED') {
      result = await service.completeWorkOrder(id);
    } else if (prismaStatus === 'CANCELLED') {
      result = await service.cancelWorkOrder(id);
    } else {
      result = await service.updateStatus(id, granularStatus, prismaStatus);
    }
    
    if (result.isFailure()) {
      return NextResponse.json({ error: result.error?.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

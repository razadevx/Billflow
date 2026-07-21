import { NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { WorkOrderService } from "@/domain/workorder/workorder.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const action = body.action; // 'complete', 'cancel', 'assign'
    
    const service = new WorkOrderService(ctx);
    let result;

    switch (action) {
      case "complete":
        result = await service.completeWorkOrder( resolvedParams.id);
        break;
      case "cancel":
        result = await service.cancelWorkOrder( resolvedParams.id);
        break;
      case "assign":
        result = await service.assignWorkOrder( resolvedParams.id, body.assignmentData);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    
    if (result.isFailure()) {
      return NextResponse.json({ error: result.error?.message }, { status: 400 });
    }
    return NextResponse.json(result.value, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

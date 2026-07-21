import { NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { WorkOrderService } from "@/domain/workorder/workorder.service";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    
    const service = new WorkOrderService(ctx);
    const result = await service.editWorkOrder( resolvedParams.id, body);
    
    if (result.isFailure()) {
      return NextResponse.json({ error: result.error?.message }, { status: 400 });
    }
    return NextResponse.json(result.value, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

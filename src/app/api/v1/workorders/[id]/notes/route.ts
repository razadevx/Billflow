import { NextResponse, NextRequest } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { WorkOrderService } from "@/domain/workorder/workorder.service";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    
    const service = new WorkOrderService(ctx);
    const result = await service.addNote(id, text);
    
    if (result.isFailure()) {
      return NextResponse.json({ error: result.error?.message }, { status: 400 });
    }
    
    return NextResponse.json(result.value);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

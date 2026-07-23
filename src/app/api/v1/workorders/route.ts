import { NextResponse, NextRequest } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { WorkOrderService } from "@/domain/workorder/workorder.service";
import { db } from "@/server/db";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status") as any;
    
    const workOrders = await db.workOrder.findMany({
      where: {
        companyId: ctx.companyId,
        deletedAt: null,
        customer: { deletedAt: null },
        ...(customerId ? { customerId } : {}),
        ...(status && status !== 'ALL' ? { status } : {}),
      },
      include: {
        customer: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(workOrders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    
    const service = new WorkOrderService(ctx);
    const result = await service.createWorkOrder( body);
    
    if (result.isFailure()) {
      console.error("WORKORDER CREATE FAILED:", result.error);
      return NextResponse.json({ error: result.error?.message }, { status: 400 });
    }
    return NextResponse.json(result.value, { status: 201 });
  } catch (err: any) {
    console.error("WORKORDER POST EXCEPTION:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

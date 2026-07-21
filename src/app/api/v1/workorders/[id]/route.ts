import { NextResponse, NextRequest } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { WorkOrderService } from "@/domain/workorder/workorder.service";
import { db } from "@/server/db";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const workOrder = await db.workOrder.findUnique({
      where: { id, companyId: ctx.companyId },
      include: {
        customer: true,
        lineItems: {
          include: { inventoryItem: true }
        },
        notes: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: 'desc' }
        },
        attachments: true,
        invoices: true,
        payments: true,
      }
    });

    if (!workOrder) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const activityLogs = await db.activityLog.findMany({
      where: { companyId: ctx.companyId, entityType: "WorkOrder", entityId: id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } }
    });

    return NextResponse.json({ ...workOrder, activityLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await request.json();
    
    const service = new WorkOrderService(ctx);
    const result = await service.editWorkOrder(id, body);
    
    if (result.isFailure()) {
      return NextResponse.json({ error: result.error?.message }, { status: 400 });
    }
    
    return NextResponse.json(result.value);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

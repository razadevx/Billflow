import { NextResponse, NextRequest } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { InvoiceService } from "@/domain/invoice/invoice.service";
import { db } from "@/server/db";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const invoiceService = new InvoiceService(ctx);
    
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const result = await invoiceService.generateFromWorkOrder({
      workOrderId: id,
      dueDate,
      notes: "Generated from Work Order"
    });

    if (result.isFailure()) {
      return NextResponse.json({ error: result.error?.message }, { status: 400 });
    }

    // Add activity log manually since generateFromWorkOrder doesn't do it for WorkOrder
    await db.activityLog.create({
      data: {
        companyId: ctx.companyId,
        userId: ctx.userId,
        action: "INVOICE_GENERATED",
        entityType: "WorkOrder",
        entityId: id,
        details: JSON.stringify({ invoiceId: (result.value as any).id }),
      }
    });

    return NextResponse.json(result.value, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

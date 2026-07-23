import { NextRequest, NextResponse } from "next/server";
import { InvoiceService } from "@/domain/invoice/invoice.service";
import { getRequestContext } from "@/server/core/context";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getRequestContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const service = new InvoiceService(ctx);
  const result = await service.getInvoice(id);

  if (result.isFailure()) {
    return NextResponse.json({ error: result.error?.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { db } = await import("@/server/db");
    await db.invoice.update({
      where: { id, companyId: ctx.companyId },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({ success: true, message: "Invoice moved to trash" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

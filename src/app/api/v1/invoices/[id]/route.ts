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

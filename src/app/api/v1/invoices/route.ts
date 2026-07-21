import { NextRequest, NextResponse } from "next/server";
import { InvoiceService } from "@/domain/invoice/invoice.service";
import { getRequestContext } from "@/server/core/context";

export async function GET(req: NextRequest) {
  const ctx = await getRequestContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = new InvoiceService(ctx);
  const result = await service.getInvoices();

  if (result.isFailure()) {
    return NextResponse.json({ error: result.error?.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value });
}

export async function POST(req: NextRequest) {
  const ctx = await getRequestContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const service = new InvoiceService(ctx);
  const result = await service.generateFromWorkOrder(body);

  if (result.isFailure()) {
    return NextResponse.json({ error: result.error?.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value }, { status: 201 });
}

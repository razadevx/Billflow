import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { PaymentService } from "@/domain/payments/services/PaymentService";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await new PaymentService(ctx).getPayment( id);
    
    if (result.isFailure()) {
      return NextResponse.json({ error: result.error.message }, { status: 404 });
    }

    return NextResponse.json(result.value);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

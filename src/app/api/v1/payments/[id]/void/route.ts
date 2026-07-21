import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { PaymentService } from "@/domain/payments/services/PaymentService";
import { voidPaymentSchema } from "@/domain/payments/validations/PaymentSchema";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parseResult = voidPaymentSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: "Validation failed", details: parseResult.error.format() }, { status: 400 });
    }

    const result = await new PaymentService(ctx).voidPayment( id, parseResult.data);
    
    if (result.isFailure()) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json(result.value);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

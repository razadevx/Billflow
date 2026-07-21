import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { PaymentService } from "@/domain/payments/services/PaymentService";
import { createPaymentSchema } from "@/domain/payments/validations/PaymentSchema";

export async function POST(req: NextRequest) {
  const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parseResult = createPaymentSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: "Validation failed", details: parseResult.error.format() }, { status: 400 });
    }

    const result = await new PaymentService(ctx).recordPayment( parseResult.data);
    
    if (result.isFailure()) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json(result.value, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await new PaymentService(ctx).listPayments(ctx);
    
    if (result.isFailure()) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json(result.value);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

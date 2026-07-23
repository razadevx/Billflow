import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { PaymentService } from "@/domain/payments/services/PaymentService";
import { createPaymentSchema } from "@/domain/payments/validations/PaymentSchema";
import { db } from "@/server/db";

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
    const customerId = req.nextUrl.searchParams.get("customerId");
    if (customerId) {
      const payments = await db.payment.findMany({
        where: { companyId: ctx.companyId, customerId, deletedAt: null },
        include: {
          customer: { select: { name: true, customerCode: true } },
          workOrder: { select: { orderNumber: true, title: true } },
          invoice: { select: { invoiceNumber: true } },
        },
        orderBy: { paymentDate: "desc" },
      });

      return NextResponse.json(payments);
    }

    const payments = await db.payment.findMany({
      where: { companyId: ctx.companyId, deletedAt: null, customer: { deletedAt: null } },
      include: {
        customer: { select: { name: true, customerCode: true } },
        workOrder: { select: { orderNumber: true, title: true } },
        invoice: { select: { invoiceNumber: true } },
      },
      orderBy: { paymentDate: "desc" },
    });
    
    return NextResponse.json(payments);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

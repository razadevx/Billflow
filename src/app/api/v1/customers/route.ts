import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { CustomerService } from "@/domain/customer/services/CustomerService";
import { CreateCustomerSchema } from "@/domain/customer/validation/CustomerValidation";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customers = await db.customer.findMany({
      where: { companyId: ctx.companyId, deletedAt: null },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = CreateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      const issueMessage = parsed.error.issues[0]?.message || "Invalid customer input";
      return NextResponse.json({ error: issueMessage }, { status: 400 });
    }

    const service = new CustomerService(ctx);
    const result = await service.createCustomer(parsed.data);

    if (result.isSuccess()) {
      return NextResponse.json({ data: result.value }, { status: 201 });
    } else {
      return NextResponse.json({ error: result.error?.message || "Failed to create customer" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create customer" }, { status: 500 });
  }
}

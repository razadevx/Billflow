import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { CustomerService } from "@/domain/customer/services/CustomerService";
import { UpdateCustomerSchema } from "@/domain/customer/validation/CustomerValidation";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const customer = await db.customer.findFirst({
      where: { id, companyId: ctx.companyId, deletedAt: null },
      include: { notes: true, tags: { include: { tag: true } } }
    });

    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json({ data: customer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const body = await request.json();
    const parsed = UpdateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      const issueMessage = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: issueMessage }, { status: 400 });
    }

    const service = new CustomerService(ctx);
    const result = await service.updateCustomer(id, parsed.data);

    if (result.isSuccess()) {
      return NextResponse.json({ data: result.value });
    } else {
      return NextResponse.json({ error: result.error?.message || "Failed to update customer" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const service = new CustomerService(ctx);
    const result = await service.archiveCustomer(id);

    if (result.isSuccess()) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error?.message || "Failed to delete customer" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete customer" }, { status: 500 });
  }
}

import { NextResponse, NextRequest } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { db } from "@/server/db";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customers = await db.customer.findMany({
      where: { companyId: ctx.companyId },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

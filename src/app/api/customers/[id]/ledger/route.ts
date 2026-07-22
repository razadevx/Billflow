import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const context = await getRequestContext();
    if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const entries = await db.khataEntry.findMany({
      where: { companyId: context.companyId, customerId: params.id },
      include: {
        payment: { select: { receiptNumber: true, method: true, status: true } },
        invoice: { select: { invoiceNumber: true, status: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(entries);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch ledger" }, { status: 500 });
  }
}

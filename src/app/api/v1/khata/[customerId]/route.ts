import { NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { LedgerFacade } from "@/domain/ledger/public";

export async function GET(request: Request, context: { params: Promise<{ customerId: string }> }) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId } = await context.params;

    const result = await LedgerFacade.getStatement(ctx, customerId);
    
    if (result.isFailure()) {
      return NextResponse.json({ error: result.error?.message }, { status: 400 });
    }

    return NextResponse.json(result.value);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

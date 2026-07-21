import { NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { LedgerFacade } from "@/domain/ledger/public";

export async function GET(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await LedgerFacade.getCustomersWithBalances(ctx);
    
    if (result.isFailure()) {
      return NextResponse.json({ error: result.error?.message }, { status: 400 });
    }

    return NextResponse.json(result.value);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { InventoryFacade } from "@/domain/inventory/public";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getRequestContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;

  try {
    const body = await request.json();
    const result = await InventoryFacade.adjustStock(ctx, {
      itemId: resolvedParams.id,
      quantity: body.quantity,
      reason: body.reason,
      notes: body.notes,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
    });

    if (result.isFailure()) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json(result.value);
  } catch (error: any) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}

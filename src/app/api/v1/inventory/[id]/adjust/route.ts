import { NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { InventoryFacade } from "@/domain/inventory/public";
import { z } from "zod";

const adjustStockSchema = z.object({
  quantity: z.number(), // can be positive or negative
  type: z.string().min(1, "Type is required"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = adjustStockSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const result = await InventoryFacade.adjustStock(ctx, {
      itemId: id,
      quantity: parsed.data.quantity,
      type: parsed.data.type,
      reason: parsed.data.reason,
      notes: parsed.data.notes,
    });
    
    if (result.isFailure()) {
      return NextResponse.json({ error: result.error?.message }, { status: 400 });
    }

    return NextResponse.json(result.value);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

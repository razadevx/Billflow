import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { InventoryFacade } from "@/domain/inventory/public";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getRequestContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  
  try {
    const body = await request.json();
    const result = await InventoryFacade.updateInventoryItem(ctx, resolvedParams.id, body);

    if (result.isFailure()) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json(result.value);
  } catch (error: any) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getRequestContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;

  const result = await InventoryFacade.archiveInventoryItem(ctx, resolvedParams.id);

  if (result.isFailure()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

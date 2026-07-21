import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { InventoryFacade } from "@/domain/inventory/public";

export async function GET(request: NextRequest) {
  const ctx = await getRequestContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const status = searchParams.get("status") as any || undefined;
  const lowStockOnly = searchParams.get("lowStockOnly") === "true";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const result = await InventoryFacade.search(ctx, {
    query, categoryId, status, lowStockOnly, page, limit
  });

  if (result.isFailure()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json(result.value);
}

export async function POST(request: NextRequest) {
  const ctx = await getRequestContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const result = await InventoryFacade.createInventoryItem(ctx, body);

    if (result.isFailure()) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json(result.value, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { InventoryFacade } from "@/domain/inventory/public";
import { z } from "zod";

const createItemSchema = z.object({
  categoryId: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().min(0).optional(),
  reorderLevel: z.number().min(0).optional(),
  initialStock: z.number().min(0).optional(),
});

export async function GET(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const status = searchParams.get("status") || undefined;
    const lowStockOnly = searchParams.get("lowStockOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const result = await InventoryFacade.search(ctx, {
      query,
      categoryId,
      status: status as any,
      lowStockOnly,
      page,
      limit
    });

    if (result.isFailure()) {
      return NextResponse.json({ error: result.error?.message }, { status: 400 });
    }

    return NextResponse.json(result.value);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createItemSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const result = await InventoryFacade.createInventoryItem(ctx, {
      ...parsed.data,
      sku: parsed.data.sku || undefined,
      description: parsed.data.description || undefined,
      categoryId: parsed.data.categoryId || undefined,
    });
    
    if (result.isFailure()) {
      return NextResponse.json({ error: result.error?.message }, { status: 400 });
    }

    return NextResponse.json(result.value);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

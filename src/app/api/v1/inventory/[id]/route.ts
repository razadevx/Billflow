import { NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { InventoryFacade } from "@/domain/inventory/public";
import { z } from "zod";
import { db } from "@/server/db";

const updateItemSchema = z.object({
  categoryId: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required").optional(),
  sku: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  unit: z.string().min(1).optional(),
  unitPrice: z.number().min(0).optional(),
  reorderLevel: z.number().min(0).optional(),
});

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Fast-path direct lookup for GET since facade doesn't have a getById (it relies on search)
    const item = await db.inventoryItem.findFirst({
      where: { id, companyId: ctx.companyId, deletedAt: null },
      include: {
        category: true,
        history: {
          orderBy: { createdAt: 'desc' },
        },
        adjustments: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateItemSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const result = await InventoryFacade.updateInventoryItem(ctx, id, {
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

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await InventoryFacade.archiveInventoryItem(ctx, id);
    
    if (result.isFailure()) {
      return NextResponse.json({ error: result.error?.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

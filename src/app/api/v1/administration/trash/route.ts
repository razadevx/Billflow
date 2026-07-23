import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [customers, workOrders, inventory, invoices] = await Promise.all([
      db.customer.findMany({
        where: { companyId: ctx.companyId, deletedAt: { not: null } },
        orderBy: { updatedAt: "desc" },
      }),
      db.workOrder.findMany({
        where: { companyId: ctx.companyId, deletedAt: { not: null } },
        include: { customer: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
      }),
      db.inventoryItem.findMany({
        where: { companyId: ctx.companyId, deletedAt: { not: null } },
        orderBy: { updatedAt: "desc" },
      }),
      db.invoice.findMany({
        where: { companyId: ctx.companyId, deletedAt: { not: null } },
        include: { customer: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      customers,
      workOrders,
      inventory,
      invoices,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Restore soft-deleted item
export async function POST(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { entityType, entityId } = await request.json();

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType and entityId are required" }, { status: 400 });
    }

    if (entityType === "Customer") {
      await db.customer.update({
        where: { id: entityId, companyId: ctx.companyId },
        data: { deletedAt: null, status: "ACTIVE" },
      });
    } else if (entityType === "WorkOrder") {
      await db.workOrder.update({
        where: { id: entityId, companyId: ctx.companyId },
        data: { deletedAt: null },
      });
    } else if (entityType === "InventoryItem") {
      await db.inventoryItem.update({
        where: { id: entityId, companyId: ctx.companyId },
        data: { deletedAt: null, status: "AVAILABLE" },
      });
    } else if (entityType === "Invoice") {
      await db.invoice.update({
        where: { id: entityId, companyId: ctx.companyId },
        data: { deletedAt: null },
      });
    } else {
      return NextResponse.json({ error: "Invalid entityType" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `${entityType} restored successfully` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Permanent Delete from Supabase / DB
export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getRequestContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const emptyAll = searchParams.get("emptyAll") === "true";
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (emptyAll) {
      // Empty entire trash permanently
      await Promise.all([
        db.customer.deleteMany({ where: { companyId: ctx.companyId, deletedAt: { not: null } } }),
        db.workOrder.deleteMany({ where: { companyId: ctx.companyId, deletedAt: { not: null } } }),
        db.inventoryItem.deleteMany({ where: { companyId: ctx.companyId, deletedAt: { not: null } } }),
        db.invoice.deleteMany({ where: { companyId: ctx.companyId, deletedAt: { not: null } } }),
      ]);
      return NextResponse.json({ success: true, message: "Trash emptied permanently" });
    }

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType and entityId are required" }, { status: 400 });
    }

    if (entityType === "Customer") {
      await db.customer.delete({ where: { id: entityId, companyId: ctx.companyId } });
    } else if (entityType === "WorkOrder") {
      await db.workOrder.delete({ where: { id: entityId, companyId: ctx.companyId } });
    } else if (entityType === "InventoryItem") {
      await db.inventoryItem.delete({ where: { id: entityId, companyId: ctx.companyId } });
    } else if (entityType === "Invoice") {
      await db.invoice.delete({ where: { id: entityId, companyId: ctx.companyId } });
    } else {
      return NextResponse.json({ error: "Invalid entityType" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `${entityType} permanently deleted from database` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

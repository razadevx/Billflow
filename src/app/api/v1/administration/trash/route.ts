import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/server/core/context";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

async function permanentlyDeleteWorkOrder(companyId: string, workOrderId: string) {
  await db.lineItem.deleteMany({ where: { workOrderId } });
  await db.workOrderNote.deleteMany({ where: { workOrderId } });
  await db.workOrderAttachment.deleteMany({ where: { workOrderId } });
  await db.dailySchedule.deleteMany({ where: { workOrderId } });
  await db.payment.updateMany({ where: { workOrderId, companyId }, data: { workOrderId: null } });
  await db.invoice.updateMany({ where: { workOrderId, companyId }, data: { workOrderId: null } });
  await db.workOrder.delete({ where: { id: workOrderId, companyId } });
}

async function permanentlyDeleteCustomer(companyId: string, customerId: string) {
  // 1. Delete Khata entries
  await db.khataEntry.deleteMany({ where: { customerId, companyId } });

  // 2. Delete payments and history
  const payments = await db.payment.findMany({ where: { customerId, companyId }, select: { id: true } });
  const paymentIds = payments.map(p => p.id);
  if (paymentIds.length > 0) {
    await db.paymentHistory.deleteMany({ where: { paymentId: { in: paymentIds } } });
    await db.payment.deleteMany({ where: { id: { in: paymentIds } } });
  }

  // 3. Delete work orders and child items
  const workOrders = await db.workOrder.findMany({ where: { customerId, companyId }, select: { id: true } });
  for (const wo of workOrders) {
    await permanentlyDeleteWorkOrder(companyId, wo.id);
  }

  // 4. Delete invoices
  await db.invoice.deleteMany({ where: { customerId, companyId } });

  // 5. Delete notes & tags
  await db.customerNote.deleteMany({ where: { customerId, companyId } });
  await db.customerTag.deleteMany({ where: { customerId } });

  // 6. Delete Customer
  await db.customer.delete({ where: { id: customerId, companyId } });
}

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
      // Restore customer's work orders, invoices, payments
      await db.workOrder.updateMany({
        where: { customerId: entityId, companyId: ctx.companyId },
        data: { deletedAt: null },
      });
      await db.invoice.updateMany({
        where: { customerId: entityId, companyId: ctx.companyId },
        data: { deletedAt: null },
      });
      await db.payment.updateMany({
        where: { customerId: entityId, companyId: ctx.companyId },
        data: { deletedAt: null },
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
      // 1. Permanently delete all trashed customers
      const trashedCustomers = await db.customer.findMany({
        where: { companyId: ctx.companyId, deletedAt: { not: null } },
        select: { id: true }
      });
      for (const c of trashedCustomers) {
        await permanentlyDeleteCustomer(ctx.companyId, c.id);
      }

      // 2. Permanently delete remaining trashed work orders
      const trashedWorkOrders = await db.workOrder.findMany({
        where: { companyId: ctx.companyId, deletedAt: { not: null } },
        select: { id: true }
      });
      for (const wo of trashedWorkOrders) {
        await permanentlyDeleteWorkOrder(ctx.companyId, wo.id);
      }

      // 3. Permanently delete trashed inventory items
      await db.inventoryItem.deleteMany({
        where: { companyId: ctx.companyId, deletedAt: { not: null } }
      });

      // 4. Permanently delete remaining trashed invoices
      await db.invoice.deleteMany({
        where: { companyId: ctx.companyId, deletedAt: { not: null } }
      });

      return NextResponse.json({ success: true, message: "Trash emptied permanently from Supabase database" });
    }

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType and entityId are required" }, { status: 400 });
    }

    if (entityType === "Customer") {
      await permanentlyDeleteCustomer(ctx.companyId, entityId);
    } else if (entityType === "WorkOrder") {
      await permanentlyDeleteWorkOrder(ctx.companyId, entityId);
    } else if (entityType === "InventoryItem") {
      await db.inventoryItem.delete({ where: { id: entityId, companyId: ctx.companyId } });
    } else if (entityType === "Invoice") {
      await db.invoice.delete({ where: { id: entityId, companyId: ctx.companyId } });
    } else {
      return NextResponse.json({ error: "Invalid entityType" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `${entityType} permanently deleted from Supabase database` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

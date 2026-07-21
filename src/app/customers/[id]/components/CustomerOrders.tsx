"use client";

import React from "react";
import { DataTable } from "../../../../components/shared/DataTable";
import { ColumnDef } from "@tanstack/react-table";

export function CustomerOrders({ customerId }: { customerId: string }) {
  // Placeholder for when Work Orders module is built
  const columns: ColumnDef<any>[] = [
    { header: "Order Number", accessorKey: "orderNumber" },
    { header: "Title", accessorKey: "title" },
    { header: "Status", accessorKey: "status" },
    { header: "Total", accessorKey: "total" },
  ];

  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-4">Work Orders</h3>
      <DataTable data={[]} columns={columns} />
    </div>
  );
}

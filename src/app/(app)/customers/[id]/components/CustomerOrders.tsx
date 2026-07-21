"use client";

import React from "react";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function CustomerOrders({ customerId }: { customerId: string }) {
  const columns = [
    { header: "Order #", accessorKey: "orderNumber" },
    { header: "Date", accessorKey: "date" },
    { header: "Amount", accessorKey: "amount" },
    { 
      header: "Status", 
      accessorKey: "status",
      cell: (info: any) => <StatusBadge variant="info">{info.getValue()}</StatusBadge>
    }
  ];

  const data = [
    { orderNumber: "WO-001", date: "10/12/2023", amount: ".00", status: "COMPLETED" },
    { orderNumber: "WO-002", date: "11/05/2023", amount: ".00", status: "PENDING" },
  ];

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      <DataTable data={data} columns={columns} />
    </div>
  );
}

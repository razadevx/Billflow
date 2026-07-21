"use client";

import React from "react";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function CustomerStatements({ customerId }: { customerId: string }) {
  const columns = [
    { header: "Statement Date", accessorKey: "date" },
    { header: "Opening Balance", accessorKey: "opening" },
    { header: "Invoiced", accessorKey: "invoiced" },
    { header: "Paid", accessorKey: "paid" },
    { header: "Closing Balance", accessorKey: "closing" },
  ];

  const data = [
    { date: "Oct 31, 2023", opening: ".00", invoiced: ".00", paid: ".00", closing: ".00" },
    { date: "Nov 30, 2023", opening: ".00", invoiced: ".00", paid: ".00", closing: ".00" },
  ];

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      <DataTable data={data} columns={columns} />
    </div>
  );
}

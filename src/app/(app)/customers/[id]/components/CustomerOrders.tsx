"use client";

import React, { useEffect, useState } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export function CustomerOrders({ customerId }: { customerId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/workorders?customerId=${customerId}`)
      .then((res) => res.json())
      .then((orders) => setData(Array.isArray(orders) ? orders : []))
      .finally(() => setLoading(false));
  }, [customerId]);

  const columns = [
    {
      header: "Order #",
      accessorKey: "orderNumber",
      cell: (info: any) => (
        <Link className="font-medium hover:underline" href={`/workorders/${info.row.original.id}`}>
          {info.getValue()}
        </Link>
      )
    },
    { header: "Title", accessorKey: "title" },
    {
      header: "Date",
      accessorKey: "createdAt",
      cell: (info: any) => new Date(info.getValue()).toLocaleDateString()
    },
    {
      header: "Amount",
      accessorKey: "total",
      cell: (info: any) => formatCurrency(Number(info.getValue() || 0))
    },
    { 
      header: "Status", 
      accessorKey: "status",
      cell: (info: any) => <StatusBadge variant="info">{info.getValue()}</StatusBadge>
    }
  ];

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      <DataTable data={data} columns={columns} loading={loading} />
    </div>
  );
}

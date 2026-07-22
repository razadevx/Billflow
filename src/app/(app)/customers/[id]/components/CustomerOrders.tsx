"use client";

import React from "react";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export function CustomerOrders({ customerId }: { customerId: string }) {
  const { data = [], isLoading: loading } = useQuery({
    queryKey: ["workorders", { customerId }],
    queryFn: async () => {
      const res = await fetch(`/api/v1/workorders?customerId=${customerId}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const orders = await res.json();
      return Array.isArray(orders) ? orders : [];
    }
  });

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

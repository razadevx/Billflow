"use client";

import React from "react";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export function CustomerStatements({ customerId, mode = "ledger" }: { customerId: string; mode?: "ledger" | "payments" }) {
  const { data = [], isLoading: loading } = useQuery({
    queryKey: [mode === "payments" ? "payments" : "ledger", { customerId }],
    queryFn: async () => {
      const url = mode === "payments" ? `/api/v1/payments?customerId=${customerId}` : `/api/customers/${customerId}/ledger`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch data");
      const rows = await res.json();
      return Array.isArray(rows) ? rows : [];
    }
  });

  const columns = mode === "payments" ? [
    { header: "Receipt", accessorKey: "receiptNumber" },
    { header: "Date", accessorKey: "paymentDate", cell: (info: any) => new Date(info.getValue()).toLocaleDateString() },
    { header: "Method", accessorKey: "method" },
    { header: "Work Order", accessorKey: "workOrder.orderNumber", cell: (info: any) => info.row.original.workOrder?.orderNumber || "—" },
    { header: "Amount", accessorKey: "amount", cell: (info: any) => formatCurrency(Number(info.getValue() || 0)) },
    { header: "Status", accessorKey: "status", cell: (info: any) => <StatusBadge variant="info">{info.getValue()}</StatusBadge> },
  ] : [
    { header: "Date", accessorKey: "date", cell: (info: any) => new Date(info.getValue()).toLocaleDateString() },
    { header: "Type", accessorKey: "type" },
    { header: "Description", accessorKey: "description" },
    { header: "Invoice", accessorKey: "invoice.invoiceNumber", cell: (info: any) => info.row.original.invoice?.invoiceNumber || "—" },
    { header: "Payment", accessorKey: "payment.receiptNumber", cell: (info: any) => info.row.original.payment?.receiptNumber || "—" },
    { header: "Amount", accessorKey: "amount", cell: (info: any) => formatCurrency(Number(info.getValue() || 0)) },
    { header: "Balance", accessorKey: "runningBalance", cell: (info: any) => info.getValue() == null ? "—" : formatCurrency(Number(info.getValue())) },
  ];

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      <DataTable data={data} columns={columns} loading={loading} />
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";

export function CustomerStatements({ customerId, mode = "ledger" }: { customerId: string; mode?: "ledger" | "payments" }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = mode === "payments" ? `/api/v1/payments?customerId=${customerId}` : `/api/customers/${customerId}/ledger`;
    fetch(url)
      .then((res) => res.json())
      .then((rows) => setData(Array.isArray(rows) ? rows : []))
      .finally(() => setLoading(false));
  }, [customerId, mode]);

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

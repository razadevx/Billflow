"use client";

import React, { useState, useEffect } from "react";
import { DashboardContainer } from "@/components/layout/DashboardContainer";
import { PageHeader } from "@/components/layout/PageLayout";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { InvoiceStatus } from "@prisma/client";

export default function InvoicesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/v1/invoices")
      .then(res => res.json())
      .then(json => {
        setData(json.data || []);
        setLoading(false);
      });
  }, []);

  const columns = [
    {
      header: "Invoice #",
      accessorKey: "invoiceNumber",
      cell: (info: any) => <span className="font-medium">{info.getValue()}</span>
    },
    {
      header: "Customer",
      accessorKey: "customer.name",
    },
    {
      header: "Issue Date",
      accessorKey: "issueDate",
      cell: (info: any) => new Date(info.getValue()).toLocaleDateString()
    },
    {
      header: "Amount",
      accessorKey: "total",
      cell: (info: any) => formatCurrency(info.getValue())
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (info: any) => {
        const val = info.getValue() as InvoiceStatus;
        let variant: "default" | "primary" | "success" | "warning" | "danger" | "info" = "default";
        
        switch (val) {
          case "DRAFT": variant = "default"; break;
          case "ISSUED": variant = "info"; break;
          case "PAID": variant = "success"; break;
          case "PARTIALLY_PAID": variant = "warning"; break;
          case "OVERDUE": variant = "danger"; break;
          case "CANCELLED": variant = "danger"; break;
        }

        return <StatusBadge variant={variant}>{val}</StatusBadge>;
      }
    },
    {
      id: "actions",
      cell: ({ row }: any) => {
        return (
          <Button variant="ghost" size="sm" onClick={() => router.push(`/invoices/${row.original.id}`)}>
            View
          </Button>
        );
      }
    }
  ];

  return (
    <DashboardContainer className="py-8">
      <PageHeader 
        title="Invoices" 
        description="Manage your customer invoices, track payments, and send billing links." 
      />
      
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Icons.loader className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable data={data} columns={columns} />
        )}
      </div>
    </DashboardContainer>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { DataTable } from "../../components/shared/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Icons } from "../../components/ui/icons";
import { Button } from "../../components/ui/button";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  customerCode: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  creditLimit: number;
  status: string;
}

import { CustomerForm } from "./components/CustomerForm";

export default function CustomersPage() {
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const router = useRouter();

  const loadData = () => {
    fetch("/api/customers")
      .then((res) => res.json())
      .then((json) => {
        setData(json.data || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: ColumnDef<Customer>[] = [
    {
      header: "Code",
      accessorKey: "customerCode",
      cell: (info) => <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{(info.getValue() as string) || "N/A"}</span>
    },
    {
      header: "Name",
      accessorKey: "name",
      cell: (info) => (
        <span 
          className="font-medium hover:underline cursor-pointer"
          onClick={() => router.push(`/customers/${info.row.original.id}`)}
        >
          {info.getValue() as string}
        </span>
      )
    },
    { header: "Phone", accessorKey: "phone" },
    { header: "Email", accessorKey: "email" },
    {
      header: "Status",
      accessorKey: "status",
      cell: (info) => {
        const val = info.getValue() as string;
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${
            val === 'ACTIVE' ? 'bg-success/20 text-success' : 
            val === 'ARCHIVED' ? 'bg-muted text-muted-foreground' : 
            'bg-warning/20 text-warning'
          }`}>
            {val}
          </span>
        );
      }
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[var(--container-wide)] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[length:var(--text-heading-l)] font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">Manage your CRM, view credit history and risk profiles.</p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Icons.add className="mr-2 h-4 w-4" /> New Customer
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Icons.loader className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable 
              data={data} 
              columns={columns} 
            />
          )}
        </div>
      </div>
      <CustomerForm open={formOpen} onOpenChange={setFormOpen} onSuccess={loadData} />
    </AppLayout>
  );
}

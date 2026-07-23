"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/shared/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { notifyDataChanged } from "@/lib/realtime-sync";
import { Trash2 } from "lucide-react";

interface Customer {
  id: string;
  customerCode: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  creditLimit: number;
  outstandingBalance: number;
  preferredContact: string | null;
  status: string;
}

import { CustomerForm } from "./components/CustomerForm";

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data = [], isLoading: loading, refetch: loadData } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json().then(json => json.data || []);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/customers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete customer");
      return res.json();
    },
    onSuccess: () => {
      notifyDataChanged("customer");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer moved to trash");
      loadData();
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete customer")
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

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
      header: "Credit",
      accessorKey: "outstandingBalance",
      cell: (info) => {
        const balance = Number(info.getValue() || 0);
        return (
          <div>
            <div className={balance > 0 ? "font-semibold text-warning" : "font-semibold text-success"}>
              {formatCurrency(balance)}
            </div>
            <div className="text-xs text-muted-foreground">Limit {formatCurrency(info.row.original.creditLimit || 0)}</div>
          </div>
        );
      }
    },
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
    },
    {
      header: "Actions",
      id: "actions",
      cell: (info) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/workorders/new?customerId=${info.row.original.id}`)}
          >
            <Icons.add className="h-4 w-4 mr-2" /> Work Order
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingCustomer(info.row.original);
              setFormOpen(true);
            }}
          >
            <Icons.edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10"
            onClick={() => {
              if (confirm(`Move "${info.row.original.name}" to trash? You can restore it anytime from Settings -> Trash.`)) {
                deleteMutation.mutate(info.row.original.id);
              }
            }}
            title="Move to trash"
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <>    
      <div className="space-y-6 max-w-[var(--container-wide)] mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[length:var(--text-heading-l)] font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">Manage your CRM, view credit history and risk profiles.</p>
          </div>
          <Button onClick={() => { setEditingCustomer(null); setFormOpen(true); }}>
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
      <CustomerForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingCustomer(null);
        }}
        onSuccess={loadData}
        customer={editingCustomer}
        redirectOnCreate={false}
      />
    </>
  );
}

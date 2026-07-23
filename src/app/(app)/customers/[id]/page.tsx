"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "../components/CustomerForm";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notifyDataChanged } from "@/lib/realtime-sync";
import { Trash2 } from "lucide-react";

// Future components
import { CustomerOverview } from "./components/CustomerOverview";
import { CustomerActivity } from "./components/CustomerActivity";
import { CustomerOrders } from "./components/CustomerOrders";
import { CustomerStatements } from "./components/CustomerStatements";

export default function CustomerProfilePage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: customer, isLoading: loading } = useQuery({
    queryKey: ["customers", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch customer");
      return res.json().then(json => json.data);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/customers/${params.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete customer");
      return res.json();
    },
    onSuccess: () => {
      notifyDataChanged("customer");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer moved to trash");
      router.push("/customers");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete customer")
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "activity", label: "Activity" },
    { id: "orders", label: "Orders" },
    { id: "payments", label: "Payments" },
    { id: "ledger", label: "Ledger" },
    { id: "statements", label: "Statements" },
    { id: "settings", label: "Settings" }
  ];

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-full">
          <Icons.loader className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      
    );
  }

  if (!customer) {
    return (
      
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <h2 className="text-xl font-semibold">Customer not found</h2>
          <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
        </div>
      
    );
  }

  return (
    
      <div className="max-w-[var(--container-wide)] mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex items-start justify-between bg-card p-6 border rounded-xl shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-primary/10 text-primary flex items-center justify-center rounded-full text-2xl font-bold">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{customer.customerCode}</span>
                {customer.status === "ACTIVE" ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-success/20 text-success">Active</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-warning/20 text-warning">{customer.status}</span>
                )}
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-2 space-x-4">
                {customer.phone && <span className="flex items-center"><Icons.phone className="h-3 w-3 mr-1"/> {customer.phone}</span>}
                {customer.email && <span className="flex items-center"><Icons.email className="h-3 w-3 mr-1"/> {customer.email}</span>}
                {customer.address && <span className="flex items-center"><Icons.location className="h-3 w-3 mr-1"/> {customer.address}</span>}
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline"><Icons.phone className="mr-2 h-4 w-4" /> Call</Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}><Icons.edit className="mr-2 h-4 w-4" /> Edit</Button>
            <Button 
              variant="outline"
              className="text-red-400 hover:text-red-500 hover:bg-red-500/10 border-red-500/30"
              onClick={() => {
                if (confirm(`Move "${customer.name}" to trash? You can restore it anytime from Settings -> Trash.`)) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Trash
            </Button>
            <Button onClick={() => router.push(`/workorders/new?customerId=${customer.id}`)}><Icons.add className="mr-2 h-4 w-4" /> New Work Order</Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border flex space-x-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="mt-6">
          {activeTab === "overview" && <CustomerOverview customerId={customer.id} />}
          {activeTab === "activity" && <CustomerActivity customerId={customer.id} />}
          {activeTab === "orders" && <CustomerOrders customerId={customer.id} />}
          {activeTab === "payments" && <CustomerStatements customerId={customer.id} mode="payments" />}
          {activeTab === "ledger" && <CustomerStatements customerId={customer.id} mode="ledger" />}
          {activeTab === "statements" && <CustomerStatements customerId={customer.id} />}
          {/* Implement other tabs as needed */}
          {["settings"].includes(activeTab) && (
            <div className="py-12 text-center text-muted-foreground border rounded-xl border-dashed">
              This module will be implemented in future phases.
            </div>
          )}
        </div>
        <CustomerForm open={editOpen} onOpenChange={setEditOpen} customer={customer} redirectOnCreate={false} />
      </div>
    
  );
}




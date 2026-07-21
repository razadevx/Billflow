"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";

export function CustomerOverview({ customerId }: { customerId: string }) {
  const stats = {
    totalRevenue: 45200,
    outstandingBalance: 1250,
    activeOrders: 3,
    lifetimeOrders: 42
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-card p-6 rounded-xl border shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
        <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalRevenue)}</p>
      </div>
      <div className="bg-card p-6 rounded-xl border shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground">Outstanding Balance</h3>
        <p className="text-3xl font-bold text-danger mt-2">{formatCurrency(stats.outstandingBalance)}</p>
      </div>
      <div className="bg-card p-6 rounded-xl border shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground">Active Work Orders</h3>
        <p className="text-3xl font-bold mt-2">{stats.activeOrders}</p>
      </div>
      <div className="bg-card p-6 rounded-xl border shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground">Lifetime Orders</h3>
        <p className="text-3xl font-bold mt-2">{stats.lifetimeOrders}</p>
      </div>
    </div>
  );
}

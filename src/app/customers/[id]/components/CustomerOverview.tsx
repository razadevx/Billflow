"use client";

import React, { useEffect, useState } from "react";
import { Icons } from "../../../../components/ui/icons";
import { CustomerHealthBadge } from "./CustomerHealthBadge";

interface Metrics {
  totalOrders: number;
  totalRevenue: number;
  outstandingBalance: number;
  averageOrderValue: number;
  creditUtilization: number;
  lastPaymentDate: string | null;
  health: "HEALTHY" | "NEEDS_ATTENTION" | "HIGH_RISK";
}

export function CustomerOverview({ customerId }: { customerId: string }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${customerId}/metrics`)
      .then(res => res.json())
      .then(json => {
        setMetrics(json.data);
        setLoading(false);
      });
  }, [customerId]);

  if (loading) {
    return <div className="h-64 flex items-center justify-center border rounded-xl bg-card"><Icons.loader className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Outstanding */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground flex items-center justify-between">
            Outstanding <Icons.payment className="h-4 w-4" />
          </p>
          <p className="text-2xl font-bold mt-2">${metrics.outstandingBalance.toFixed(2)}</p>
          <div className="mt-4">
            <CustomerHealthBadge health={metrics.health} />
          </div>
        </div>
        
        {/* Total Revenue */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground flex items-center justify-between">
            Total Revenue <Icons.ledger className="h-4 w-4" />
          </p>
          <p className="text-2xl font-bold mt-2">${metrics.totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-2">Lifetime value</p>
        </div>

        {/* Orders */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground flex items-center justify-between">
            Total Orders <Icons.workOrder className="h-4 w-4" />
          </p>
          <p className="text-2xl font-bold mt-2">{metrics.totalOrders}</p>
          <p className="text-xs text-muted-foreground mt-2">Avg ${metrics.averageOrderValue.toFixed(2)}/order</p>
        </div>

        {/* Utilization */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground flex items-center justify-between">
            Credit Utilized <Icons.report className="h-4 w-4" />
          </p>
          <p className="text-2xl font-bold mt-2">{metrics.creditUtilization.toFixed(0)}%</p>
          <div className="w-full bg-muted rounded-full h-1.5 mt-4">
            <div 
              className={`h-1.5 rounded-full ${metrics.creditUtilization > 80 ? 'bg-destructive' : 'bg-primary'}`} 
              style={{ width: `${Math.min(metrics.creditUtilization, 100)}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

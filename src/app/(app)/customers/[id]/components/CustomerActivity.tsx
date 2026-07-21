"use client";

import React from "react";

export function CustomerActivity({ customerId }: { customerId: string }) {
  return (
    <div className="bg-card p-6 rounded-xl border shadow-sm">
      <h3 className="text-lg font-semibold mb-6">Customer Timeline</h3>
      <div className="space-y-8">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="flex gap-4 relative">
            <div className="w-px h-full bg-border absolute left-2.5 top-6"></div>
            <div className="h-5 w-5 rounded-full bg-primary/20 border-2 border-primary z-10 shrink-0 mt-1"></div>
            <div>
              <p className="text-sm font-medium">Work Order #WO-2023-00{i+1} completed</p>
              <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

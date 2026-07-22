"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";

export function CustomerActivity({ customerId }: { customerId: string }) {
  const { data: events = [], isLoading: loading } = useQuery({
    queryKey: ["customers", customerId, "timeline"],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${customerId}/timeline`);
      if (!res.ok) throw new Error("Failed to fetch timeline");
      return res.json().then(json => json.data || []);
    }
  });

  return (
    <div className="bg-card p-6 rounded-xl border shadow-sm">
      <h3 className="text-lg font-semibold mb-6">Customer Timeline</h3>
      <div className="space-y-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading timeline...</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : events.map((event: any) => (
          <div key={`${event.type}-${event.id}`} className="flex gap-4 relative">
            <div className="w-px h-full bg-border absolute left-2.5 top-6"></div>
            <div className="h-5 w-5 rounded-full bg-primary/20 border-2 border-primary z-10 shrink-0 mt-1"></div>
            <div>
              <p className="text-sm font-medium">{event.title}</p>
              {event.description && <p className="text-sm text-muted-foreground mt-1">{event.description}</p>}
              <p className="text-xs text-muted-foreground mt-1">{new Date(event.date).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

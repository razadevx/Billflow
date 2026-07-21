"use client";

import React, { useEffect, useState } from "react";
import { Icons } from "../../../../components/ui/icons";
import { Loader2 } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: "CREATED" | "UPDATED" | "ORDER" | "INVOICE" | "PAYMENT" | "NOTE";
  title: string;
  description?: string;
  date: string;
}

export function CustomerActivity({ customerId }: { customerId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTimeline() {
      try {
        const res = await fetch(`/api/customers/${customerId}/timeline`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch timeline", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTimeline();
  }, [customerId]);

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (events.length === 0) {
    return <div className="p-12 text-center text-muted-foreground border rounded-xl border-dashed">No activity recorded yet.</div>;
  }

  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-6">Activity Timeline</h3>
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {events.map((ev, index) => {
          let Icon = Icons.customer;
          let bgColor = "bg-primary";
          if (ev.type === "ORDER") { Icon = Icons.workOrder; bgColor = "bg-warning"; }
          if (ev.type === "PAYMENT") { Icon = Icons.payment; bgColor = "bg-success"; }
          if (ev.type === "INVOICE") { Icon = Icons.invoice; bgColor = "bg-info"; }

          return (
            <div key={ev.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              {/* Icon */}
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 border-background ${bgColor} text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10`}>
                <Icon className="h-3 w-3" />
              </div>
              
              {/* Card */}
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border bg-background shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <div className="font-semibold text-foreground text-sm">{ev.title}</div>
                  <time className="font-mono text-xs text-muted-foreground">{new Date(ev.date).toLocaleDateString()}</time>
                </div>
                {ev.description && <div className="text-sm text-muted-foreground">{ev.description}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

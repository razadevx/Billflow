"use client";

import React from "react";
import { Icons } from "@/components/ui/icons";

interface Props {
  health: "HEALTHY" | "NEEDS_ATTENTION" | "HIGH_RISK";
}

export function CustomerHealthBadge({ health }: Props) {
  if (health === "HEALTHY") {
    return (
      <div className="inline-flex items-center space-x-1.5 bg-success/10 text-success px-2.5 py-1 rounded-md text-xs font-medium border border-success/20">
        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        <span>Healthy</span>
      </div>
    );
  }
  if (health === "NEEDS_ATTENTION") {
    return (
      <div className="inline-flex items-center space-x-1.5 bg-warning/10 text-warning px-2.5 py-1 rounded-md text-xs font-medium border border-warning/20">
        <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
        <span>Needs Attention</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center space-x-1.5 bg-destructive/10 text-destructive px-2.5 py-1 rounded-md text-xs font-medium border border-destructive/20">
      <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
      <span>High Risk</span>
    </div>
  );
}

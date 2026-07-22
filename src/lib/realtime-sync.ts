"use client";

import { queryClient } from "@/components/providers/QueryProvider";

export type EntityType = "customer" | "workorder" | "invoice" | "payment" | "khata" | "inventory";

const SYNC_CHANNEL_NAME = "billflow_realtime_sync";

let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
}

export function notifyDataChanged(entity: EntityType) {
  // Invalidate local queries immediately
  invalidateQueriesForEntity(entity);

  // Broadcast to other tabs
  if (broadcastChannel) {
    broadcastChannel.postMessage({ entity, timestamp: Date.now() });
  }
}

export function setupRealtimeSyncListener(onMessageReceived?: (entity: EntityType) => void) {
  if (typeof window === "undefined" || !broadcastChannel) return () => {};

  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.entity) {
      const entity = event.data.entity as EntityType;
      invalidateQueriesForEntity(entity);
      if (onMessageReceived) {
        onMessageReceived(entity);
      }
    }
  };

  broadcastChannel.addEventListener("message", handleMessage);

  return () => {
    broadcastChannel?.removeEventListener("message", handleMessage);
  };
}

export function invalidateQueriesForEntity(entity: EntityType) {
  if (!queryClient) return;

  switch (entity) {
    case "customer":
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      break;
    case "workorder":
      queryClient.invalidateQueries({ queryKey: ["workorders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      break;
    case "invoice":
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["khata"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      break;
    case "payment":
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["khata"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      break;
    case "khata":
      queryClient.invalidateQueries({ queryKey: ["khata"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      break;
    case "inventory":
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      break;
    default:
      queryClient.invalidateQueries();
  }
}

"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "bg-background border border-border text-foreground shadow-lg rounded-lg",
          title: "font-medium",
          description: "text-muted-foreground text-sm",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
          error: "border-destructive text-destructive",
          success: "border-success text-success",
          warning: "border-warning text-warning",
          info: "border-info text-info",
        },
      }}
    />
  );
}

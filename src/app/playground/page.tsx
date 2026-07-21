"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { toast } from "sonner";
import { Icons } from "@/components/ui/icons";
import { AppLayout } from "@/components/layout/AppLayout";

export default function PlaygroundPage() {
  const confirm = useConfirm();

  const handleTestConfirm = async () => {
    const isConfirmed = await confirm({
      title: "Delete Customer?",
      description: "This action cannot be undone. Are you sure?",
      confirmText: "Delete",
      variant: "destructive",
    });

    if (isConfirmed) {
      toast.success("Customer deleted successfully!");
    } else {
      toast.info("Action cancelled.");
    }
  };

  const handleTestToast = () => {
    toast.success("Payment recorded successfully!");
  };

  return (
    
      <div className="max-w-[var(--container-wide)] mx-auto space-y-12">
        <div>
          <h1 className="text-[length:var(--text-heading-xl)] font-bold tracking-tight mb-2">BDS Playground</h1>
          <p className="text-muted-foreground text-[length:var(--text-body)]">
            Test environment for the BillFlow Design System tokens, typography, and components.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-[length:var(--text-heading-m)] font-semibold border-b pb-2">UX Systems</h2>
          <div className="flex gap-4">
            <Button onClick={handleTestToast} variant="default">
              <Icons.check className="mr-2 h-4 w-4" /> Trigger Toast
            </Button>
            <Button onClick={handleTestConfirm} variant="danger">
              <Icons.delete className="mr-2 h-4 w-4" /> Trigger ConfirmDialog
            </Button>
            <Button variant="outline" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' }))}>
              <Icons.search className="mr-2 h-4 w-4" /> Open Command Palette
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Try pressing <kbd className="bg-muted px-1 rounded border">Ctrl + K</kbd> to open global search.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-[length:var(--text-heading-m)] font-semibold border-b pb-2">Typography</h2>
          <div className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
            <div className="text-[length:var(--text-heading-xl)] font-bold">Heading XL (40px)</div>
            <div className="text-[length:var(--text-heading-l)] font-semibold">Heading L (32px)</div>
            <div className="text-[length:var(--text-heading-m)] font-semibold">Heading M (24px)</div>
            <div className="text-[length:var(--text-heading-s)] font-medium">Heading S (20px)</div>
            <div className="text-[length:var(--text-body)]">Body (16px) - The quick brown fox jumps over the lazy dog.</div>
            <div className="text-[length:var(--text-body-s)]">Body Small (14px) - The quick brown fox jumps over the lazy dog.</div>
            <div className="text-[length:var(--text-caption)] text-muted-foreground uppercase tracking-wider">Caption (12px)</div>
          </div>
        </section>
        
        <section className="space-y-4">
          <h2 className="text-[length:var(--text-heading-m)] font-semibold border-b pb-2">Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-primary text-primary-foreground p-4 rounded-md shadow-sm">Primary</div>
            <div className="bg-secondary text-secondary-foreground p-4 rounded-md shadow-sm">Secondary</div>
            <div className="bg-destructive text-destructive-foreground p-4 rounded-md shadow-sm">Destructive</div>
            <div className="bg-success text-success-foreground p-4 rounded-md shadow-sm">Success</div>
            <div className="bg-warning text-warning-foreground p-4 rounded-md shadow-sm">Warning</div>
            <div className="bg-info text-info-foreground p-4 rounded-md shadow-sm">Info</div>
            <div className="bg-muted text-muted-foreground p-4 rounded-md shadow-sm">Muted</div>
            <div className="bg-card text-card-foreground border p-4 rounded-md shadow-sm">Card</div>
          </div>
        </section>
      </div>
    
  );
}



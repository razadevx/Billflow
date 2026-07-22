"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useShortcuts } from "../../hooks/useShortcuts";
import { Icons } from "../ui/icons";
import { useRouter } from "next/navigation";
import { SearchResult } from "../../server/search/GlobalSearchService";

const quickLinks = [
  { label: "Dashboard", href: "/dashboard", icon: Icons.dashboard, hint: "Business overview" },
  { label: "Customers", href: "/customers", icon: Icons.customer, hint: "CRM and credit history" },
  { label: "Work Orders", href: "/workorders", icon: Icons.workOrder, hint: "Jobs and production" },
  { label: "Inventory", href: "/inventory", icon: Icons.inventory, hint: "Materials and stock" },
  { label: "Invoices", href: "/invoices", icon: Icons.invoice, hint: "Billing documents" },
  { label: "Payments", href: "/payments", icon: Icons.payment, hint: "Received payments" },
  { label: "Khata / Ledger", href: "/khata", icon: Icons.ledger, hint: "Customer balances" },
];

const actions = [
  { label: "Create Work Order", href: "/workorders/new", icon: Icons.add, hint: "Start a new job" },
  { label: "Receive Payment", href: "/payments/new", icon: Icons.payment, hint: "Record cash, bank, or card payment" },
  { label: "Add Inventory Item", href: "/inventory", icon: Icons.inventory, hint: "Create flex, vinyl, or stock item" },
  { label: "Settings", href: "/settings", icon: Icons.settings, hint: "Company, currency, users" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const close = () => {
    setOpen(false);
    setSearch("");
    setResults([]);
  };

  const go = (url: string) => {
    router.push(url);
    close();
  };

  useShortcuts({
    "Ctrl+k": (e) => {
      e.preventDefault();
      setOpen((value) => !value);
    },
    Escape: close,
  });

  useEffect(() => {
    const openPalette = () => setOpen(true);
    window.addEventListener("billflow:open-command-palette", openPalette);
    return () => window.removeEventListener("billflow:open-command-palette", openPalette);
  }, []);

  useEffect(() => {
    if (!open) return;

    const fetchSearchResults = async () => {
      if (search.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        setResults(res.ok ? data.data || [] : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = window.setTimeout(fetchSearchResults, 250);
    return () => window.clearTimeout(debounce);
  }, [open, search]);

  const visibleQuickLinks = useMemo(() => {
    if (!search.trim()) return quickLinks;
    const term = search.toLowerCase();
    return quickLinks.filter((link) => link.label.toLowerCase().includes(term));
  }, [search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onMouseDown={close}>
      <div className="mx-auto mt-[10vh] w-[min(760px,calc(100vw-2rem))]" onMouseDown={(event) => event.stopPropagation()}>
        <div className="overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <Icons.search className="h-5 w-5 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers, work orders, invoices, payments, inventory..."
              className="h-10 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
            {loading && <Icons.loader className="h-4 w-4 animate-spin text-muted-foreground" />}
            <kbd className="rounded border bg-muted px-2 py-1 text-[11px] text-muted-foreground">Esc</kbd>
            <button onClick={close} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              <Icons.close className="h-4 w-4" />
            </button>
          </div>

          <div className="grid max-h-[66vh] grid-cols-1 gap-4 overflow-y-auto p-4 md:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <section>
                <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {search.trim().length >= 2 ? "Search Results" : "Quick Navigation"}
                </div>
                <div className="space-y-1">
                  {search.trim().length >= 2 ? (
                    results.length > 0 ? results.map((result) => {
                      const Icon = Icons[result.icon as keyof typeof Icons] || Icons.search;
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => go(result.url)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-muted"
                        >
                          <span className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{result.title}</span>
                            <span className="block truncate text-sm text-muted-foreground">{result.subtitle || result.type}</span>
                          </span>
                        </button>
                      );
                    }) : (
                      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        No results found for “{search}”.
                      </div>
                    )
                  ) : visibleQuickLinks.map((link) => (
                    <button
                      key={link.href}
                      onClick={() => go(link.href)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-muted"
                    >
                      <span className="rounded-lg bg-muted p-2"><link.icon className="h-4 w-4" /></span>
                      <span>
                        <span className="block font-medium">{link.label}</span>
                        <span className="text-sm text-muted-foreground">{link.hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <aside className="rounded-xl border bg-muted/30 p-3">
              <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</div>
              <div className="space-y-1">
                {actions.map((action) => (
                  <button
                    key={action.href + action.label}
                    onClick={() => go(action.href)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-background"
                  >
                    <action.icon className="h-4 w-4 text-primary" />
                    <span>
                      <span className="block text-sm font-medium">{action.label}</span>
                      <span className="text-xs text-muted-foreground">{action.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

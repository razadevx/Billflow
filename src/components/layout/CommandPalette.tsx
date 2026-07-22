"use client";

import React, { useState, useEffect } from "react";
import { Command } from "cmdk";
import { useShortcuts } from "../../hooks/useShortcuts";
import { Icons } from "../ui/icons";
import { useRouter } from "next/navigation";
import { SearchResult } from "../../server/search/GlobalSearchService";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useShortcuts({
    "Ctrl+k": (e) => {
      e.preventDefault();
      setOpen((o) => !o);
    },
    "Escape": () => setOpen(false),
  });

  useEffect(() => {
    const fetchSearchResults = async (query: string) => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.data || []);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Search error", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(() => {
      fetchSearchResults(search);
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <Command 
        className="w-full max-w-xl bg-background text-foreground border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        shouldFilter={false} // We do filtering on the backend
      >
        <div className="flex items-center border-b border-border px-4 py-3">
          <Icons.search className="h-5 w-5 text-muted-foreground mr-3" />
          <Command.Input 
            autoFocus 
            value={search}
            onValueChange={setSearch}
            placeholder="Search Customers, Invoices, Work Orders..." 
            className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
          />
          {loading && <Icons.loader className="h-4 w-4 animate-spin text-muted-foreground mr-3" />}
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <Icons.close className="h-5 w-5" />
          </button>
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          {!loading && results.length === 0 && search.trim().length >= 2 && (
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found for "{search}".
            </Command.Empty>
          )}

          {results.length > 0 && (
            <Command.Group heading="Search Results" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {results.map((result) => {
                const IconComponent = Icons[result.icon as keyof typeof Icons] || Icons.inventory;
                return (
                  <Command.Item 
                    key={result.id}
                    onSelect={() => { router.push(result.url); setOpen(false); }}
                    className="flex items-center px-3 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[selected=true]:bg-accent mt-1"
                  >
                    <IconComponent className="mr-3 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground mt-0.5">{result.subtitle}</span>
                      )}
                    </div>
                  </Command.Item>
                );
              })}
            </Command.Group>
          )}

          {search.trim().length === 0 && (
            <>
              <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                <Command.Item 
                  onSelect={() => { router.push("/customers"); setOpen(false); }}
                  className="flex items-center px-3 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[selected=true]:bg-accent mt-1"
                >
                  <Icons.customer className="mr-2 h-4 w-4 text-muted-foreground" /> Customers
                </Command.Item>
                <Command.Item 
                  onSelect={() => { router.push("/inventory"); setOpen(false); }}
                  className="flex items-center px-3 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[selected=true]:bg-accent mt-1"
                >
                  <Icons.inventory className="mr-2 h-4 w-4 text-muted-foreground" /> Inventory
                </Command.Item>
                <Command.Item 
                  onSelect={() => { router.push("/workorders"); setOpen(false); }}
                  className="flex items-center px-3 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[selected=true]:bg-accent mt-1"
                >
                  <Icons.workOrder className="mr-2 h-4 w-4 text-muted-foreground" /> Work Orders
                </Command.Item>
              </Command.Group>

              <Command.Group heading="Actions" className="px-2 py-1.5 text-xs font-medium text-muted-foreground mt-2">
                <Command.Item 
                  onSelect={() => { router.push("/workorders/new"); setOpen(false); }}
                  className="flex items-center px-3 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[selected=true]:bg-accent mt-1"
                >
                  <Icons.add className="mr-2 h-4 w-4 text-muted-foreground" /> Create Work Order
                </Command.Item>
                <Command.Item 
                  onSelect={() => { router.push("/customers"); setOpen(false); }}
                  className="flex items-center px-3 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[selected=true]:bg-accent mt-1"
                >
                  <Icons.add className="mr-2 h-4 w-4 text-muted-foreground" /> Create New Customer
                </Command.Item>
              </Command.Group>
            </>
          )}
        </Command.List>
      </Command>
    </div>
  );
}

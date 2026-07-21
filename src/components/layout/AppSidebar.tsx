"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "../ui/icons";
import { cn } from "../../lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Icons.dashboard },
  { name: "Customers", href: "/customers", icon: Icons.customer },
  { name: "Inventory", href: "/inventory", icon: Icons.inventory },
  { name: "Work Orders", href: "/workorders", icon: Icons.workOrder },
  { name: "Invoices", href: "/invoices", icon: Icons.invoice },
  { name: "Payments", href: "/payments", icon: Icons.payment },
  { name: "Khata / Ledger", href: "/khata", icon: Icons.ledger },
  { name: "Reports", href: "/reports", icon: Icons.report },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border h-full transition-all">
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <Icons.inventory className="h-6 w-6 text-primary mr-2" />
        <span className="font-semibold text-sidebar-foreground tracking-tight">BillFlow</span>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-4 px-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Main Menu
          </p>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 flex-shrink-0 h-4 w-4",
                      isActive ? "text-sidebar-primary-foreground" : "text-muted-foreground"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      
      <div className="p-4 border-t border-sidebar-border">
        <Link
          href="/settings"
          className={cn(
            "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
            pathname.startsWith("/settings")
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Icons.settings className="mr-3 h-4 w-4 text-muted-foreground" />
          Settings
        </Link>
      </div>
    </aside>
  );
}

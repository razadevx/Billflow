"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icons } from "../ui/icons";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { authClient } from "@/lib/auth-client";

const navGroups = [
  {
    label: "Core",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Icons.dashboard },
      { name: "Customers", href: "/customers", icon: Icons.customer },
      { name: "Work Orders", href: "/workorders", icon: Icons.workOrder },
      { name: "Inventory", href: "/inventory", icon: Icons.inventory },
    ],
  },
  {
    label: "Finance",
    items: [
      { name: "Invoices", href: "/invoices", icon: Icons.invoice },
      { name: "Payments", href: "/payments", icon: Icons.payment },
      { name: "Khata / Ledger", href: "/khata", icon: Icons.ledger },
    ],
  },
  {
    label: "Administration",
    items: [
      { name: "Reports", href: "/reports", icon: Icons.report },
      { name: "Settings", href: "/settings", icon: Icons.settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ name?: string | null; email?: string | null; image?: string | null }>({ name: "User Profile", email: "user@billflow.com", image: null });
  React.useEffect(() => {
    authClient
      .getSession()
      .then((response: any) => {
        const sessionUser = response?.data?.user || response?.user;
        if (sessionUser) setUser(sessionUser);
      })
      .catch(() => {});
  }, []);
  const initials = (user.name || user.email || "US")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside 
      className={cn(
        "print:hidden flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border h-full transition-all duration-300 z-20",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      <div className={cn(
        "h-14 flex items-center border-b border-sidebar-border transition-all",
        collapsed ? "justify-center px-0" : "px-4 justify-between"
      )}>
        <div className="flex items-center">
          <Icons.inventory className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && (
            <span className="font-semibold text-sidebar-foreground tracking-tight ml-2 animate-in fade-in">
              BillFlow
            </span>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-8 w-8 text-muted-foreground hover:bg-sidebar-accent", collapsed && "hidden")}
        >
          <Icons.chevronLeft className="h-4 w-4" />
        </Button>
      </div>
      
      {collapsed && (
        <div className="flex justify-center mt-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(false)}
            className="h-8 w-8 text-muted-foreground hover:bg-sidebar-accent"
          >
            <Icons.chevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-4 overflow-x-hidden scrollbar-none">
        <nav className="space-y-6">
          {navGroups.map((group) => (
            <div key={group.label} className="px-3">
              {!collapsed && (
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={collapsed ? item.name : undefined}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "flex-shrink-0 h-5 w-5",
                          isActive ? "text-sidebar-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                          !collapsed && "mr-3"
                        )}
                        aria-hidden="true"
                      />
                      {!collapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
      
      <button
        type="button"
        onClick={() => router.push("/settings?tab=profile")}
        className={cn(
        "p-4 border-t border-sidebar-border transition-all",
        collapsed ? "flex justify-center hover:bg-sidebar-accent" : "flex items-center space-x-3 text-left hover:bg-sidebar-accent"
      )}>
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="Profile" className="h-8 w-8 rounded-full object-cover border border-border/50 shrink-0 shadow-sm" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-medium text-xs">{initials}</span>
          </div>
        )}
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{user.name || "User Profile"}</span>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
          </div>
        )}
      </button>
    </aside>
  );
}


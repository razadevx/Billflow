"use client";

import React, { useEffect, useState } from "react";
import { Icons } from "../ui/icons";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { authClient } from "../../lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "warning" | "danger" | "info";
};

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [session, setSession] = useState<{ user: { name?: string | null; email?: string | null; image?: string | null } }>({
    user: { name: "User Profile", email: "user@billflow.com", image: null },
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  // Simple Breadcrumb logic based on pathname
  const segments = pathname.split("/").filter(Boolean);

  const getInitials = (name?: string) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/auth/login");
  };

  useEffect(() => {
    authClient
      .getSession()
      .then((response: any) => {
        const user = response?.data?.user || response?.user;
        if (user) setSession({ user });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        const data = json?.data;
        const lowStock = (data?.lowStockItems || []).map((item: any) => ({
          id: `stock-${item.id}`,
          title: "Low stock",
          description: `${item.name}: ${item.availableQuantity} ${item.unit} left`,
          href: `/inventory/${item.id}`,
          tone: "warning" as const,
        }));
        const outstanding = (data?.outstandingCustomers || []).map((customer: any) => ({
          id: `customer-${customer.id}`,
          title: "Outstanding balance",
          description: `${customer.name} has unpaid balance of ${Number(customer.balance).toLocaleString()}`,
          href: `/khata/${customer.id}`,
          tone: "danger" as const,
        }));
        setNotifications([...lowStock, ...outstanding]);
      })
      .catch(() => setNotifications([]));
  }, [pathname]);

  const notificationCount = notifications.length;
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <header className="print:hidden h-14 bg-background border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-muted-foreground capitalize">
          <span className="hover:text-foreground cursor-pointer">BillFlow</span>
          {segments.map((segment, index) => (
            <React.Fragment key={index}>
              <Icons.chevronRight className="h-4 w-4 mx-2" />
              <span className={index === segments.length - 1 ? "text-foreground font-medium" : "hover:text-foreground cursor-pointer"}>
                {segment}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("billflow:open-command-palette"))}
          className="hidden sm:flex items-center text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md cursor-pointer hover:text-foreground"
        >
          <Icons.search className="mr-2 h-4 w-4" />
          <span>Search...</span>
          <kbd className="ml-4 font-mono text-[10px] bg-background px-1.5 rounded border border-border">Ctrl K</kbd>
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="relative rounded-lg p-2 text-muted-foreground outline-none hover:bg-muted hover:text-foreground">
            <Icons.notification className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute right-0 top-0 min-w-4 h-4 px-1 rounded-full bg-destructive text-[10px] leading-4 text-destructive-foreground text-center">
                {notificationCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Notifications</span>
                <span className="text-xs text-muted-foreground">{notificationCount} active</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No alerts right now. Tiny miracle.
              </div>
            ) : notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => router.push(notification.href)}
                className="items-start gap-3 py-3"
              >
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.tone === "danger" ? "bg-destructive" : "bg-warning"}`} />
                <span className="min-w-0">
                  <span className="block font-medium">{notification.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{notification.description}</span>
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard")}>View dashboard</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => setTheme(nextTheme)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          title={`Switch to ${nextTheme} mode`}
        >
          {resolvedTheme === "dark" ? <Icons.sun className="h-5 w-5" /> : <Icons.moon className="h-5 w-5" />}
        </button>

        <button
          onClick={() => router.push("/workorders/new")}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Create work order"
        >
          <Icons.add className="h-5 w-5" />
        </button>
        
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              {session.user.image ? (
                <img src={session.user.image} alt="Profile" className="h-8 w-8 rounded-full object-cover border border-border cursor-pointer" />
              ) : (
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer">
                  {getInitials(session.user.name || session.user.email || "US")}
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 text-sm">
                <div className="flex flex-col space-y-1">
                  <p className="font-medium leading-none">{session.user.name || "User Profile"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.user.email || "user@billflow.com"}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Icons.settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings?tab=profile")}>
                <Icons.user className="mr-2 h-4 w-4" />
                <span>User Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
            <Icons.loader className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </header>
  );
}


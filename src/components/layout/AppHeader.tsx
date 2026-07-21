"use client";

import React from "react";
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

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  // const { data: session } = authClient.useSession();
  const session = { user: { name: "Mock User", email: "mock@example.com" } };
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

  return (
    <header className="h-14 bg-background border-b border-border flex items-center justify-between px-6 flex-shrink-0">
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
        <div className="hidden sm:flex items-center text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md cursor-pointer hover:text-foreground">
          <Icons.search className="mr-2 h-4 w-4" />
          <span>Search...</span>
          <kbd className="ml-4 font-mono text-[10px] bg-background px-1.5 rounded border border-border">Ctrl K</kbd>
        </div>
        
        <button className="text-muted-foreground hover:text-foreground relative">
          <Icons.notification className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 bg-destructive rounded-full" />
        </button>

        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-muted-foreground hover:text-foreground"
        >
          {theme === "dark" ? <Icons.add className="h-5 w-5" /> : <Icons.dashboard className="h-5 w-5" />}
        </button>
        
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                {getInitials(session.user.name)}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session.user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Icons.settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
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

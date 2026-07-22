import React from "react";
import { Icons } from "@/components/ui/icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0a0a0a] p-4 sm:p-8">
      <div className="mx-auto flex w-full max-w-[400px] flex-col items-center justify-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md">
            <Icons.dashboard className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">BillFlow</span>
        </div>
        
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
}

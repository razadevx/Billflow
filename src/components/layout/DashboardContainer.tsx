import * as React from "react";
import { cn } from "../../lib/utils";

export interface DashboardContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardContainer({ className, children, ...props }: DashboardContainerProps) {
  return (
    <div 
      className={cn("w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8", className)}
      {...props}
    >
      {children}
    </div>
  );
}

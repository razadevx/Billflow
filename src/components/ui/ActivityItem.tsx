import * as React from "react";
import { cn } from "../../lib/utils";

export type ActivityStatus = "default" | "success" | "warning" | "danger" | "info";

export interface ActivityItemProps extends React.HTMLAttributes<HTMLDivElement> {
  user: string;
  action: string;
  time: string;
  status?: ActivityStatus;
}

export function ActivityItem({
  user,
  action,
  time,
  status = "default",
  className,
  ...props
}: ActivityItemProps) {
  const statusColors = {
    default: "bg-muted",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
  };

  return (
    <div className={cn("flex items-start gap-4 py-3", className)} {...props}>
      <div className={cn("mt-1 h-2.5 w-2.5 rounded-full shrink-0", statusColors[status])} />
      <div className="flex-1 space-y-1">
        <p className="text-small font-medium leading-none">
          {user}
        </p>
        <p className="text-body text-muted-foreground text-sm">
          {action}
        </p>
      </div>
      <div className="text-caption text-xs whitespace-nowrap">
        {time}
      </div>
    </div>
  );
}

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { cn } from "../../lib/utils";
import { type LucideIcon } from "lucide-react";

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  trend?: number; // percentage, e.g., 14 for 14%
  trendLabel?: string;
  icon?: LucideIcon;
  accentColor?: "primary" | "success" | "warning" | "danger" | "info" | "muted";
}

export function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  icon: Icon,
  accentColor = "primary",
  className,
  ...props
}: MetricCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;
  
  return (
    <Card className={cn("hover-lift overflow-hidden relative", className)} {...props}>
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1",
        accentColor === "primary" && "bg-primary",
        accentColor === "success" && "bg-success",
        accentColor === "warning" && "bg-warning",
        accentColor === "danger" && "bg-danger",
        accentColor === "info" && "bg-info",
        accentColor === "muted" && "bg-muted"
      )} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(trend !== undefined || trendLabel) && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {trend !== undefined && (
              <span className={cn(
                "font-medium",
                isPositive ? "text-success" : isNegative ? "text-danger" : "text-muted-foreground"
              )}>
                {isPositive ? "?" : isNegative ? "?" : ""} {Math.abs(trend)}%
              </span>
            )}
            {trendLabel && <span>{trendLabel}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

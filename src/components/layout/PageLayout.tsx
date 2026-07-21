import * as React from "react";
import { cn } from "../../lib/utils";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div 
      className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6", className)} 
      {...props}
    >
      <div className="space-y-1">
        <h1 className="text-h1">{title}</h1>
        {description && <p className="text-body text-muted-foreground">{description}</p>}
      </div>
      {actions && (
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
}

export interface PageSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageSection({
  title,
  description,
  actions,
  children,
  className,
  ...props
}: PageSectionProps) {
  return (
    <section className={cn("space-y-4 mb-8", className)} {...props}>
      {(title || actions) && (
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {title && <h2 className="text-h2">{title}</h2>}
            {description && <p className="text-caption">{description}</p>}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

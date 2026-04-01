import { cn } from "@/lib/utils";
import React from "react";

export interface DashboardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DashboardGrid({ children, className, ...props }: DashboardGridProps) {
  return (
    <div 
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 w-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

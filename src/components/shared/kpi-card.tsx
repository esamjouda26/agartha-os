"use client";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label?: string };
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
  children?: ReactNode;
}

export function KpiCard({ title, value, icon: Icon, trend, subtitle, variant = "default", className, children }: KpiCardProps) {
  const borderColors = {
    default: "border-border",
    success: "border-emerald-500/30",
    warning: "border-yellow-500/30",
    danger: "border-red-500/30",
  };

  return (
    <div className={cn(
      "rounded-lg border bg-card/60 backdrop-blur-xl p-5 relative",
      "before:absolute before:top-[-1px] before:left-[-1px] before:w-2 before:h-2 before:border-t before:border-l before:border-[#d4af37]",
      "after:absolute after:bottom-[-1px] after:right-[-1px] after:w-2 after:h-2 after:border-b after:border-r after:border-[#d4af37]",
      borderColors[variant],
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{title}</span>
        <Icon className="h-4 w-4 text-[#d4af37]/60" />
      </div>
      <div className="font-orbitron text-2xl font-bold text-foreground">{value}</div>
      {trend && (
        <div className={cn(
          "text-xs mt-1 font-medium",
          trend.value >= 0 ? "text-emerald-400" : "text-red-400"
        )}>
          {trend.value >= 0 ? "+" : ""}{trend.value}%{trend.label ? ` ${trend.label}` : ""}
        </div>
      )}
      {subtitle && (
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      )}
      {children}
    </div>
  );
}

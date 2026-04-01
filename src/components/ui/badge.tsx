import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "gold" | "success" | "destructive" | "warning" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest",
        {
          "bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white": variant === "default",
          "bg-[#d4af37]/10 text-yellow-700 border border-[#d4af37]/30 dark:text-[#d4af37]": variant === "gold",
          "bg-emerald-100 text-emerald-700 border border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400": variant === "success",
          "bg-red-100 text-red-700 border border-red-500/20 dark:bg-red-500/10 dark:text-red-500": variant === "destructive",
          "bg-amber-100 text-amber-700 border border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-500": variant === "warning",
          "border border-gray-300 text-gray-600 dark:border-white/20 dark:text-gray-300": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "gold" | "success" | "destructive" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest",
        {
          "bg-primary/10 text-primary": variant === "default",
          "bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30": variant === "gold",
          "bg-emerald-500/10 text-emerald-400": variant === "success",
          "bg-destructive/10 text-destructive": variant === "destructive",
          "border border-border text-muted-foreground": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };

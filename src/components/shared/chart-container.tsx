"use client";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  timeToggle?: boolean;
  className?: string;
}

const timeOptions = [
  { value: "D", label: "D" },
  { value: "W", label: "W" },
  { value: "M", label: "M" },
];

export function ChartContainer({ title, subtitle, children, timeToggle = false, className }: ChartContainerProps) {
  const [activeTime, setActiveTime] = useState("W");

  return (
    <div className={cn(
      "rounded-lg border border-border bg-card/60 backdrop-blur-xl p-5 relative",
      "before:absolute before:top-[-1px] before:left-[-1px] before:w-2 before:h-2 before:border-t before:border-l before:border-[#d4af37]",
      "after:absolute after:bottom-[-1px] after:right-[-1px] after:w-2 after:h-2 after:border-b after:border-r after:border-[#d4af37]",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold tracking-wider text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {timeToggle && (
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card/40 p-0.5">
            {timeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setActiveTime(opt.value)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                  activeTime === opt.value
                    ? "bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

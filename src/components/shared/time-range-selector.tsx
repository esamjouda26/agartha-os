"use client";
import { cn } from "@/lib/utils";

interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options?: { value: string; label: string }[];
  className?: string;
}

const defaultOptions = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7D" },
  { value: "mtd", label: "MTD" },
  { value: "ytd", label: "YTD" },
  { value: "custom", label: "Custom" },
];

export function TimeRangeSelector({ value, onChange, options = defaultOptions, className }: TimeRangeSelectorProps) {
  return (
    <div className={cn("flex items-center gap-1 rounded-lg border border-border bg-card/40 p-1", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1 rounded-md text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

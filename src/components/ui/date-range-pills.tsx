"use client";

import { cn } from "@/lib/utils";
import { Button } from "./button";

const RANGES = [
  { label: "Today", value: "today" },
  { label: "7D", value: "7d" },
  { label: "MTD", value: "mtd" },
  { label: "YTD", value: "ytd" },
];

export interface DateRangePillsProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DateRangePills({ value, onChange, className }: DateRangePillsProps) {
  return (
    <div className={cn("inline-flex bg-white shadow-inner dark:bg-black/40 p-1 rounded-xl border border-gray-200 dark:border-white/5", className)}>
      {RANGES.map((range) => (
        <Button
          key={range.value}
          variant={value === range.value ? "default" : "ghost"}
          size="sm"
          className={cn(
            "rounded-lg min-h-[36px] px-3", 
            value === range.value 
              ? "bg-[#d4af37] border-transparent text-white dark:text-black hover:bg-yellow-600 dark:hover:bg-white shadow-sm shadow-[#d4af37]/20" 
              : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400"
          )}
          onClick={() => onChange(range.value)}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}

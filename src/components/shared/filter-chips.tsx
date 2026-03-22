"use client";
import { cn } from "@/lib/utils";

interface FilterChipsProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterChips({ options, value, onChange, className }: FilterChipsProps) {
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
            value === opt.value
              ? "bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30"
              : "bg-card/40 text-muted-foreground border-border hover:text-foreground hover:border-foreground/20"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

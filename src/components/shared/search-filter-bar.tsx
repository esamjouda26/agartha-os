"use client";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import type { ReactNode } from "react";

interface FilterDef {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

interface SearchFilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterDef[];
  children?: ReactNode;
  className?: string;
}

export function SearchFilterBar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filters,
  children,
  className,
}: SearchFilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {/* search input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "w-full rounded-lg border border-border bg-card/40 py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-1 focus:ring-[#d4af37]/50 focus:border-[#d4af37]/50 transition-colors"
          )}
        />
      </div>

      {/* filter dropdowns */}
      {filters?.map((filter) => (
        <select
          key={filter.key}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className={cn(
            "rounded-lg border border-border bg-card/40 py-2 px-3 text-xs text-foreground",
            "focus:outline-none focus:ring-1 focus:ring-[#d4af37]/50 focus:border-[#d4af37]/50 transition-colors",
            "appearance-none cursor-pointer"
          )}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {/* extra action buttons */}
      {children}
    </div>
  );
}

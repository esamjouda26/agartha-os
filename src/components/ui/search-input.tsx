"use client";

import { useState, useEffect, forwardRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  debounceMs?: number;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, debounceMs = 300, ...props }, ref) => {
    const [query, setQuery] = useState((props.value as string) || props.defaultValue || "");

    useEffect(() => {
      const handler = setTimeout(() => {
        if (onSearch) {
          onSearch(query as string);
        }
      }, debounceMs);

      return () => clearTimeout(handler);
    }, [query, onSearch, debounceMs]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      if (props.onChange) {
        props.onChange(e);
      }
    };

    const handleClear = () => {
      setQuery("");
      if (onSearch) onSearch("");
    };

    return (
      <div className={cn("relative flex items-center w-full min-h-[44px]", className)}>
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#d4af37] transition-colors" />
        <Input
          ref={ref}
          type="text"
          value={query}
          onChange={handleChange}
          className="pl-10 pr-10"
          {...props}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

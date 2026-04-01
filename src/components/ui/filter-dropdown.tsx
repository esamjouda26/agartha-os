"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, ChevronDown, Check } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDropdownProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export function FilterDropdown({ title, options, selectedValues, onChange, className }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      <Button 
        variant="outline" 
        size="md" 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "min-h-[44px]", 
          selectedValues.length > 0 && "border-[#d4af37]/50 text-yellow-700 dark:text-[#d4af37]"
        )}
      >
        <Filter className="h-4 w-4 mr-2" />
        {title}
        {selectedValues.length > 0 && (
          <span className="ml-2 rounded flex h-5 w-5 items-center justify-center bg-[#d4af37] text-[10px] text-white dark:text-black">
            {selectedValues.length}
          </span>
        )}
        <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-56 rounded-md border border-gray-200 dark:border-white/10 bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-2xl ring-1 ring-black ring-opacity-5 origin-top-left left-0 transition-opacity">
          <div className="p-2 space-y-1">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-md flex items-center min-h-[44px] transition-colors"
                >
                  <div className={cn(
                    "mr-3 flex h-4 w-4 items-center justify-center rounded border",
                    isSelected 
                      ? "border-[#d4af37] bg-[#d4af37] text-white dark:text-black" 
                      : "border-gray-300 dark:border-gray-500 bg-transparent"
                  )}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  {option.label}
                </button>
              );
            })}
          </div>
          {selectedValues.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-white/10">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => { onChange([]); setIsOpen(false); }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

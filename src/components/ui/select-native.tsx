import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const SelectNative = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            "w-full appearance-none rounded-lg px-4 py-3 min-h-[44px] text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm backdrop-blur-md",
            // Light Mode
            "bg-white/70 border border-gray-200 text-gray-900 focus:border-[#d4af37] focus:bg-white",
            // Dark Mode
            "dark:bg-black/40 dark:border-white/10 dark:text-white dark:focus:border-[#d4af37] dark:focus:bg-black/80 dark:shadow-inner",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    );
  }
);

SelectNative.displayName = "SelectNative";
export { SelectNative };

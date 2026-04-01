import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-lg px-4 py-3 min-h-[88px] text-sm transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 disabled:opacity-50 disabled:cursor-not-allowed resize-y",
          // Light Mode
          "bg-white/70 border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-[#d4af37] focus:bg-white backdrop-blur-md",
          // Dark Mode
          "dark:bg-black/40 dark:border-white/10 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-[#d4af37] dark:focus:bg-black/80 dark:shadow-inner",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
export { Textarea };

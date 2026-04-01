import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div className="flex items-center min-h-[44px]">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            "h-5 w-5 appearance-none rounded border checked:bg-[#d4af37] checked:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 relative before:content-[''] before:absolute before:inset-0 before:bg-no-repeat before:bg-center before:bg-[length:12px_12px] checked:before:bg-[url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"20 6 9 17 4 12\"/></svg>')]",
            // Light 
            "border-gray-300 bg-white/70 shadow-sm",
            // Dark
            "dark:border-white/20 dark:bg-black/40 dark:shadow-inner",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
export { Checkbox };

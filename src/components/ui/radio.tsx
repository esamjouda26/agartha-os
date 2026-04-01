import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Radio = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div className="flex items-center min-h-[44px]">
        <input
          type="radio"
          ref={ref}
          className={cn(
            "h-5 w-5 appearance-none rounded-full border checked:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 relative before:content-[''] before:absolute before:inset-[4px] before:rounded-full before:bg-transparent checked:before:bg-[#d4af37]",
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

Radio.displayName = "Radio";
export { Radio };

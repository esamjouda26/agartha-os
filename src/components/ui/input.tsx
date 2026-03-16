import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "w-full rounded-lg border border-border bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#d4af37] focus:bg-black/80 focus:outline-none focus:ring-1 focus:ring-[#d4af37]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export { Input };

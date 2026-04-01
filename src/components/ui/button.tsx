import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "gold";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/50",
          {
            "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200": variant === "default",
            "border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-100 dark:border-white/10 dark:text-white dark:hover:bg-white/5": variant === "outline",
            "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5": variant === "ghost",
            "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500": variant === "destructive",
            "bg-[#d4af37] text-white hover:bg-yellow-600 dark:text-black dark:hover:bg-white border border-[#d4af37] shadow-lg shadow-[#d4af37]/20": variant === "gold",
          },
          {
            "h-9 min-h-[44px] px-4 text-xs rounded-md": size === "sm",
            "h-11 min-h-[44px] px-6 text-sm rounded-lg": size === "md",
            "h-14 min-h-[56px] px-8 text-base rounded-xl": size === "lg",
            "h-11 w-11 min-h-[44px] min-w-[44px] rounded-lg p-0": size === "icon",
          },
          className
        )}
        {...props}
      >
        {isLoading && <Spinner size="sm" />}
        {!isLoading && children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };

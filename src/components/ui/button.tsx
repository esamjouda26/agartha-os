import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "gold";
  size?: "sm" | "md" | "lg" | "icon";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-wider transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          {
            "bg-primary text-primary-foreground hover:opacity-90": variant === "default",
            "border border-border bg-transparent text-foreground hover:bg-muted": variant === "outline",
            "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted": variant === "ghost",
            "bg-destructive text-white hover:opacity-90": variant === "destructive",
            "bg-[#d4af37] text-black hover:bg-white hover:text-black border border-[#d4af37] shadow-lg shadow-yellow-900/20": variant === "gold",
          },
          {
            "h-8 px-3 text-[10px] rounded-md": size === "sm",
            "h-10 px-5 text-xs rounded-lg": size === "md",
            "h-12 px-6 text-sm rounded-lg": size === "lg",
            "h-9 w-9 rounded-md p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button };

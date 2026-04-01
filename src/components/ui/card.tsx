import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border shadow-lg relative bg-white/70 border-gray-200 dark:bg-card/60 dark:border-border backdrop-blur-xl transition-colors",
        // Gold corner accents
        "before:absolute before:top-[-1px] before:left-[-1px] before:w-2 before:h-2 before:border-t before:border-l before:border-[#d4af37]",
        "after:absolute after:bottom-[-1px] after:right-[-1px] after:w-2 after:h-2 after:border-b after:border-r after:border-[#d4af37]",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pb-4", className)} {...props} />;
}

function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-bold tracking-wider text-gray-900 dark:text-foreground", className)} {...props} />;
}

function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[10px] text-gray-500 dark:text-muted-foreground uppercase tracking-[0.2em]", className)} {...props} />;
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0 flex gap-3", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card/60 backdrop-blur-xl shadow-lg relative",
        // Gold corner accents (matching legacy voc-panel)
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
  return <h3 className={cn("text-lg font-bold tracking-wider text-foreground", className)} {...props} />;
}

function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[10px] text-muted-foreground uppercase tracking-[0.2em]", className)} {...props} />;
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0 flex gap-3", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

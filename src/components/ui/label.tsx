import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "block text-[10px] uppercase text-muted-foreground tracking-[0.1em] font-semibold mb-1.5",
          className
        )}
        {...props}
      />
    );
  }
);

Label.displayName = "Label";
export { Label };

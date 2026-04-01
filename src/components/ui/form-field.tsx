import { ReactNode } from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
  id?: string;
}

export function FormField({ label, error, className, children, id }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-[10px] text-red-600 dark:text-red-500 uppercase tracking-wider font-bold">{error}</p>}
    </div>
  );
}

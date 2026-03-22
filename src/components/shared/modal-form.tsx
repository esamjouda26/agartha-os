"use client";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface ModalFormProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function ModalForm({ open, onClose, title, icon: Icon, children, footer, className }: ModalFormProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* panel */}
      <div className={cn(
        "relative z-10 w-full max-w-lg mx-4 rounded-lg border border-[#d4af37]/30 bg-card/80 backdrop-blur-xl shadow-2xl",
        "before:absolute before:top-[-1px] before:left-[-1px] before:w-3 before:h-3 before:border-t before:border-l before:border-[#d4af37]",
        "after:absolute after:bottom-[-1px] after:right-[-1px] after:w-3 after:h-3 after:border-b after:border-r after:border-[#d4af37]",
        className
      )}>
        {/* header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-[#d4af37]" />}
            <h2 className="text-sm font-bold tracking-wider text-foreground uppercase">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* body */}
        <div className="p-5">{children}</div>

        {/* footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 p-5 pt-0">{footer}</div>
        )}
      </div>
    </div>
  );
}

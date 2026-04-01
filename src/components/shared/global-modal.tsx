"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "../ui/button";

export interface GlobalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function GlobalModal({ isOpen, onClose, title, children, footer }: GlobalModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-auto">
      <div 
        className="fixed inset-0 bg-gray-900/50 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className={cn(
        "z-50 w-full sm:max-w-lg overflow-hidden border shadow-2xl transition-all",
        "bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-white/10",
        "rounded-t-2xl sm:rounded-2xl",
        "max-h-[85vh] flex flex-col transform"
      )}>
        {/* Mobile drag handle */}
        <div className="sm:hidden w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full" />
        </div>

        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
          <h2 className="text-lg font-bold tracking-widest uppercase text-gray-900 dark:text-white font-cinzel">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full !min-h-[36px] !min-w-[36px] !h-9 !w-9">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
        
        {footer && (
          <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/60 flex flex-col-reverse sm:flex-row justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

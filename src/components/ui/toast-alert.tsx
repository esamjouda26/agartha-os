"use client";

import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastAlertProps {
  id: string;
  type?: ToastType;
  title: string;
  message?: string;
  onClose?: (id: string) => void;
  duration?: number;
}

export function ToastAlert({ id, type = "info", title, message, onClose, duration = 5000 }: ToastAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose(id);
    }, 300); // Wait for exit animation
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    error: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
    info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
  };

  const borders = {
    success: "border-emerald-500/20",
    error: "border-red-500/20",
    warning: "border-amber-500/20",
    info: "border-blue-500/20",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg shadow-2xl ring-1 ring-black ring-opacity-5 border",
        // Light
        "bg-white/95 text-gray-900 border-gray-200",
        // Dark
        "dark:bg-black/90 dark:text-white dark:border-white/10",
        borders[type],
        "transform transition-all duration-300 ease-in-out backdrop-blur-md",
        isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-2 opacity-0 scale-95"
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{icons[type]}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium uppercase tracking-wider">{title}</p>
            {message && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{message}</p>}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className="inline-flex rounded-md text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none min-h-[44px] min-w-[44px] items-center justify-center -m-2 transition-colors"
              onClick={handleClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

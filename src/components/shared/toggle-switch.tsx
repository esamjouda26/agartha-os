"use client";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function ToggleSwitch({ checked, onChange, label, disabled = false, className }: ToggleSwitchProps) {
  return (
    <label className={cn("inline-flex items-center gap-2 cursor-pointer", disabled && "opacity-50 cursor-not-allowed", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors duration-200",
          checked ? "bg-[#d4af37]/20 border-[#d4af37]/50" : "bg-border/50 border-border"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 rounded-full shadow-sm transition-transform duration-200 translate-y-[1px]",
            checked ? "translate-x-[17px] bg-[#d4af37]" : "translate-x-[1px] bg-muted-foreground/60"
          )}
        />
      </button>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </label>
  );
}

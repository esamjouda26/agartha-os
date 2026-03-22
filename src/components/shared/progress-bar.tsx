import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
  variant?: "gold" | "success" | "danger";
  className?: string;
}

const gradients = {
  gold: "bg-gradient-to-r from-[#806b45] to-[#d4af37]",
  success: "bg-gradient-to-r from-emerald-700 to-emerald-400",
  danger: "bg-gradient-to-r from-red-700 to-red-400",
};

export function ProgressBar({ value, label, showPercentage = false, variant = "gold", className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>}
          {showPercentage && <span className="text-xs font-orbitron text-muted-foreground">{clamped}%</span>}
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", gradients[variant])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

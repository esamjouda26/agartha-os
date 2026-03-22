import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type StatusVariant =
  | "online"
  | "offline"
  | "quarantined"
  | "active"
  | "pending"
  | "suspended"
  | "on_leave"
  | "completed"
  | "failed"
  | "draft"
  | "scheduled"
  | "paused"
  | "expired"
  | "pending_mac"
  | "active_mab"
  | "revoked"
  | "missed"
  | "swapped"
  | "compliant"
  | "flagged"
  | "critical"
  | "override"
  | "justified"
  | "overridden"
  | "unresolved"
  | "in_transit"
  | "cancelled"
  | "pending_runner"
  | "needs_reconciliation"
  | "closed";

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: StatusVariant;
  label?: string;
}

const statusConfig: Record<StatusVariant, { color: string; dotColor: string; pulse?: boolean }> = {
  online:      { color: "bg-emerald-500/10 text-emerald-400", dotColor: "bg-emerald-400", pulse: true },
  offline:     { color: "bg-red-500/10 text-red-400", dotColor: "bg-red-400" },
  quarantined: { color: "bg-yellow-500/10 text-yellow-400", dotColor: "bg-yellow-400", pulse: true },
  active:      { color: "bg-emerald-500/10 text-emerald-400", dotColor: "bg-emerald-400" },
  pending:     { color: "bg-[#d4af37]/10 text-[#d4af37]", dotColor: "bg-[#d4af37]" },
  suspended:   { color: "bg-orange-500/10 text-orange-400", dotColor: "bg-orange-400" },
  on_leave:    { color: "bg-blue-500/10 text-blue-400", dotColor: "bg-blue-400" },
  completed:   { color: "bg-emerald-500/10 text-emerald-400", dotColor: "bg-emerald-400" },
  failed:      { color: "bg-red-500/10 text-red-400", dotColor: "bg-red-400" },
  draft:       { color: "bg-zinc-500/10 text-zinc-400", dotColor: "bg-zinc-400" },
  scheduled:   { color: "bg-violet-500/10 text-violet-400", dotColor: "bg-violet-400" },
  paused:      { color: "bg-orange-500/10 text-orange-400", dotColor: "bg-orange-400" },
  expired:     { color: "bg-red-500/10 text-red-400", dotColor: "bg-red-400" },
  pending_mac: { color: "bg-amber-500/10 text-amber-400", dotColor: "bg-amber-400", pulse: true },
  active_mab:  { color: "bg-emerald-500/10 text-emerald-400", dotColor: "bg-emerald-400", pulse: true },
  revoked:     { color: "bg-red-500/10 text-red-400", dotColor: "bg-red-400" },
  missed:      { color: "bg-red-500/10 text-red-400", dotColor: "bg-red-400" },
  swapped:     { color: "bg-cyan-500/10 text-cyan-400", dotColor: "bg-cyan-400" },
  compliant:   { color: "bg-emerald-500/10 text-emerald-400", dotColor: "bg-emerald-400" },
  flagged:     { color: "bg-amber-500/10 text-amber-400", dotColor: "bg-amber-400", pulse: true },
  critical:    { color: "bg-red-500/10 text-red-400", dotColor: "bg-red-400", pulse: true },
  override:    { color: "bg-amber-500/10 text-amber-400", dotColor: "bg-amber-400" },
  justified:   { color: "bg-emerald-500/10 text-emerald-400", dotColor: "bg-emerald-400" },
  overridden:  { color: "bg-blue-500/10 text-blue-400", dotColor: "bg-blue-400" },
  unresolved:  { color: "bg-red-500/10 text-red-400", dotColor: "bg-red-400", pulse: true },
  in_transit:          { color: "bg-blue-500/10 text-blue-400", dotColor: "bg-blue-400", pulse: true },
  cancelled:           { color: "bg-red-500/10 text-red-400", dotColor: "bg-red-400" },
  pending_runner:      { color: "bg-[#d4af37]/10 text-[#d4af37]", dotColor: "bg-[#d4af37]", pulse: true },
  needs_reconciliation:{ color: "bg-yellow-500/10 text-yellow-400", dotColor: "bg-yellow-400", pulse: true },
  closed:              { color: "bg-emerald-500/10 text-emerald-400", dotColor: "bg-emerald-400" },
};

const statusLabels: Record<StatusVariant, string> = {
  online: "Online",
  offline: "Offline",
  quarantined: "Quarantined",
  active: "Active",
  pending: "Pending",
  suspended: "Suspended",
  on_leave: "On Leave",
  completed: "Completed",
  failed: "Failed",
  draft: "Draft",
  scheduled: "Scheduled",
  paused: "Paused",
  expired: "Expired",
  pending_mac: "Awaiting Window",
  active_mab: "MAB Active",
  revoked: "Revoked",
  missed: "Missed",
  swapped: "Swapped",
  compliant: "Compliant",
  flagged: "Flagged",
  critical: "Critical",
  override: "Override",
  justified: "Justified",
  overridden: "Overridden",
  unresolved: "Unresolved",
  in_transit: "In Transit",
  cancelled: "Cancelled",
  pending_runner: "Pending Runner",
  needs_reconciliation: "Needs Recon",
  closed: "Closed",
};

export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label ?? statusLabels[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest",
        config.color,
        className
      )}
      {...props}
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.pulse && (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", config.dotColor)} />
        )}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", config.dotColor)} />
      </span>
      {displayLabel}
    </span>
  );
}

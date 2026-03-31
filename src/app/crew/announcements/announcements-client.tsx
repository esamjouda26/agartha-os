"use client";

import { useState } from "react";
import { Bell, AlertTriangle, Info, Megaphone, Clock, ChevronDown, ChevronUp } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  body: string;
  priority: "normal" | "urgent" | "critical";
  created_at: string;
  created_by_name?: string | null;
};

const PRIORITY_CONFIG = {
  critical: {
    label: "CRITICAL",
    icon: AlertTriangle,
    border: "border-red-500/50",
    bg: "bg-red-500/5",
    badge: "bg-red-500/20 text-red-400 border-red-500/40",
    icon_color: "text-red-400",
    accent: "bg-red-500",
    ring: "shadow-[0_0_20px_rgba(239,68,68,0.1)]",
  },
  urgent: {
    label: "URGENT",
    icon: AlertTriangle,
    border: "border-amber-500/40",
    bg: "bg-amber-500/5",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon_color: "text-amber-400",
    accent: "bg-amber-500",
    ring: "shadow-[0_0_20px_rgba(245,158,11,0.08)]",
  },
  normal: {
    label: "BROADCAST",
    icon: Megaphone,
    border: "border-white/10",
    bg: "bg-black/20",
    badge: "bg-white/5 text-gray-400 border-white/10",
    icon_color: "text-[#d4af37]",
    accent: "bg-[#d4af37]/40",
    ring: "",
  },
};

function AnnouncementCard({ item }: { item: Announcement }) {
  const [expanded, setExpanded] = useState(item.priority !== "normal");
  const config = PRIORITY_CONFIG[item.priority];
  const Icon = config.icon;

  return (
    <div className={`relative rounded-2xl border overflow-hidden transition-all ${config.border} ${config.bg} ${config.ring}`}>
      {/* Priority accent bar */}
      <div className={`absolute top-0 left-0 w-1 h-full ${config.accent}`} />

      <div className="pl-5 pr-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`mt-0.5 flex-shrink-0 ${config.icon_color}`}>
              <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${config.badge}`}>
                  {config.label}
                </span>
              </div>
              <h3 className="font-bold text-white text-base leading-snug">{item.title}</h3>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 p-1.5 text-gray-500 hover:text-white transition rounded-lg hover:bg-white/5 mt-0.5"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {expanded && (
          <p className="mt-3 ml-9 text-gray-300 text-sm leading-relaxed animate-fadeIn">
            {item.body}
          </p>
        )}

        <div className="mt-3 ml-9 flex items-center gap-4 text-[10px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <Clock size={10} />
            {new Date(item.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
          </span>
          {item.created_by_name && (
            <span className="flex items-center gap-1.5">
              <Info size={10} />
              {item.created_by_name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsClient({ announcements }: { announcements: Announcement[] }) {
  const [filter, setFilter] = useState<"all" | "priority">("all");

  const displayed = filter === "priority"
    ? announcements.filter(a => a.priority !== "normal")
    : announcements;

  const criticalCount = announcements.filter(a => a.priority === "critical").length;
  const urgentCount = announcements.filter(a => a.priority === "urgent").length;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="glass-panel-gold p-6 rounded-2xl border border-[#d4af37]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Bell className="text-[#d4af37] flex-shrink-0" size={28} />
            <div>
              <h2 className="text-2xl font-cinzel text-[#d4af37] font-bold">Announcements</h2>
              <p className="text-gray-400 text-sm mt-0.5">Operational broadcasts &amp; shift notices</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                {criticalCount} CRITICAL
              </span>
            )}
            {urgentCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {urgentCount} URGENT
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter toggles */}
      <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl w-full max-w-xs border border-white/5">
        {(["all", "priority"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2.5 rounded-lg font-bold text-xs tracking-wider transition-all ${filter === f ? "bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40" : "text-gray-400 hover:text-white"}`}
          >
            {f === "all" ? "All" : "Priority Only"}
          </button>
        ))}
      </div>

      {/* Feed */}
      {displayed.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-black/20 border border-dashed border-white/10 rounded-2xl">
          <Bell size={48} className="text-[#d4af37]/20 mb-4" />
          <h3 className="text-lg font-cinzel text-[#d4af37] font-bold mb-2">No Announcements</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            {filter === "priority" ? "No urgent or critical alerts at this time." : "No broadcasts have been issued for your shift."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(item => <AnnouncementCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

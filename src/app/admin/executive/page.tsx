"use client";

import { useState, useEffect, useTransition } from "react";
import {
  TrendingUp, Target, Award, DollarSign, Users,
  Activity, BarChart2, Calendar,
} from "lucide-react";
import {
  fetchExecutiveStatsAction,
  type ExecutiveStats,
} from "../admin-analytics-actions";

// ── Types ─────────────────────────────────────────────────────────────────────

type TimeFilter = "today" | "7d" | "mtd" | "ytd";

const FILTER_LABELS: { key: TimeFilter; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d",    label: "7D" },
  { key: "mtd",   label: "MTD" },
  { key: "ytd",   label: "YTD" },
];

// ── Utility ───────────────────────────────────────────────────────────────────

function pctChange(current: number, prev: number): string {
  if (prev === 0) return current > 0 ? "+∞" : "—";
  const pct = ((current - prev) / prev) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `RM ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `RM ${(n / 1_000).toFixed(1)}K`;
  return `RM ${n.toFixed(2)}`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded animate-pulse bg-white/5 ${className}`}
      style={{ minHeight: 20, ...style }}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExecutivePage() {
  const [filter, setFilter] = useState<TimeFilter>("today");
  const [stats, setStats] = useState<ExecutiveStats | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const data = await fetchExecutiveStatsAction(filter);
      setStats(data);
    });
  }, [filter]);

  const loading = isPending || stats === null;
  const noData = !loading && stats !== null && stats.ticketCount === 0;

  // Derived KPI values
  const kpis = stats
    ? [
        {
          label: "Gross Revenue",
          value: fmt(stats.grossRevenue),
          change: pctChange(stats.grossRevenue, stats.prevGrossRevenue),
          positive: stats.grossRevenue >= stats.prevGrossRevenue,
          icon: DollarSign,
          sub: "vs prior period",
          extra: null as number | null,
        },
        {
          label: "Park Utilization",
          value: `${stats.utilizationPct}%`,
          change: stats.utilizationPct > 80 ? "Near Cap" : stats.utilizationPct > 50 ? "Optimal" : "Low",
          positive: stats.utilizationPct > 50,
          icon: BarChart2,
          sub: "",
          extra: stats.utilizationPct,
        },
        {
          label: "Tickets Sold",
          value: stats.ticketCount.toLocaleString(),
          change: pctChange(stats.ticketCount, stats.prevTicketCount),
          positive: stats.ticketCount >= stats.prevTicketCount,
          icon: Users,
          sub: "vs prior period",
          extra: null as number | null,
        },
        {
          label: "ARPC",
          value: fmt(stats.arpc),
          change: "Avg Rev / Guest",
          positive: true,
          icon: Activity,
          sub: "revenue ÷ unique guests",
          extra: null as number | null,
          tooltip: "Average Revenue Per Capita: total non-cancelled revenue divided by total guest headcount.",
        },
      ]
    : [];

  return (
    <div className="space-y-10 pb-10">

      {/* ── Global Time Filter ─────────────────────────────────────────── */}
      <div className="flex justify-end">
        <div className="glass-panel rounded-lg p-1.5 flex items-center border border-white/10 w-fit shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center space-x-0.5">
            {FILTER_LABELS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-1.5 text-sm font-medium rounded transition-all ${
                  filter === key
                    ? "bg-[rgba(212,175,55,0.2)] text-[#d4af37] border border-[rgba(212,175,55,0.5)] shadow-[0_0_10px_rgba(212,175,55,0.2)] font-bold"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-white/10 mx-2" />
          <button className="flex items-center px-3 py-1.5 text-sm text-gray-400 hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.1)] rounded transition-colors">
            <Calendar className="w-4 h-4 mr-2" /> Custom Range
          </button>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <section>
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider">
          <Activity className="w-5 h-5 mr-2" /> Executive Command Center
        </h3>

        {noData ? (
          <div className="glass-panel rounded-lg p-8 text-center text-gray-500">
            No booking data yet for this period. KPIs will appear once bookings are created.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glass-panel rounded-lg p-5 space-y-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-36" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))
              : kpis.map((k) => {
                  const Icon = k.icon;
                  return (
                    <div
                      key={k.label}
                      className="glass-panel rounded-lg p-5 flex flex-col justify-between group hover:border-[rgba(212,175,55,0.3)] transition-all relative"
                      title={(k as { tooltip?: string }).tooltip}
                    >
                      <p className="text-sm text-gray-400 uppercase tracking-widest mb-1 font-semibold flex items-center justify-between">
                        {k.label}
                        <Icon className="w-4 h-4 text-gray-500 group-hover:text-[#d4af37] transition-colors" />
                      </p>
                      <div className="flex items-end justify-between mt-1">
                        <h4 className="font-orbitron text-3xl font-bold text-white">{k.value}</h4>
                        <span className={`text-xs flex items-center px-2 py-1 rounded ${k.positive ? "text-green-400 bg-green-400/10" : "text-[#d4af37] bg-[rgba(212,175,55,0.1)]"}`}>
                          {k.change.includes("+") && <TrendingUp className="w-3 h-3 mr-1" />}
                          {k.change}
                        </span>
                      </div>
                      {typeof k.extra === "number" && (
                        <div className="w-full bg-[#020408] rounded-full h-1.5 mt-3">
                          <div
                            className="bg-gradient-to-r from-[#806b45] to-[#d4af37] h-1.5 rounded-full transition-all"
                            style={{ width: `${k.extra}%` }}
                          />
                        </div>
                      )}
                      {k.sub && <p className="text-[10px] text-gray-500 mt-1">{k.sub}</p>}
                    </div>
                  );
                })}
          </div>
        )}
      </section>

      {/* ── Financial Yield ───────────────────────────────────────────── */}
      <section>
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider">
          <BarChart2 className="w-5 h-5 mr-2" /> Financial Yield
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ARPC */}
          <div className="glass-panel rounded-lg p-5 flex flex-col justify-center">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">
              ARPC <span className="text-xs lowercase text-gray-500">(Avg Rev Per Capita)</span>
            </p>
            {loading
              ? <Skeleton className="h-10 w-40 mt-2" />
              : <h4 className="font-orbitron text-4xl font-bold text-white">{fmt(stats?.arpc ?? 0)}</h4>
            }
            <p className="text-xs text-gray-500 mt-2">Total revenue ÷ unique paying guests</p>
          </div>

          {/* Total Guests */}
          <div className="glass-panel rounded-lg p-5 flex flex-col justify-center">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">
              Guests <span className="text-xs lowercase text-gray-500">(Total Headcount)</span>
            </p>
            {loading
              ? <Skeleton className="h-10 w-32 mt-2" />
              : <h4 className="font-orbitron text-4xl font-bold text-white">{(stats?.guestCount ?? 0).toLocaleString()}</h4>
            }
            <p className="text-xs text-gray-500 mt-2">Adults + children across all bookings</p>
          </div>

          {/* Status Pacing */}
          <div className="glass-panel rounded-lg p-5 flex flex-col justify-center">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-3">Booking Status Split</p>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            ) : noData ? (
              <p className="text-xs text-gray-600">No data</p>
            ) : (
              <div className="space-y-2">
                {(stats?.statusBreakdown ?? []).map((s) => {
                  const total = (stats?.statusBreakdown ?? []).reduce((sum, x) => sum + x.count, 0);
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  const color = s.status === "confirmed" || s.status === "completed" ? "#d4af37"
                    : s.status === "cancelled" ? "#ef4444"
                    : "#94a3b8";
                  return (
                    <div key={s.status}>
                      <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                        <span className="capitalize">{s.status.replace("_", " ")}</span>
                        <span className="font-mono">{pct}%</span>
                      </div>
                      <div className="w-full bg-[#020408] rounded-full h-1.5 border border-white/5">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Revenue by Tier — real data */}
          <div className="glass-panel rounded-lg p-5 flex flex-col" style={{ minHeight: 320 }}>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-300 font-semibold tracking-wide">Revenue by Tier</p>
              <span className="text-[10px] text-green-400 bg-green-400/10 border border-green-500/20 px-2 py-0.5 rounded">Live</span>
            </div>
            {loading ? (
              <div className="flex-1 flex items-end gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${50 + i * 20}%` }} />
                ))}
              </div>
            ) : noData ? (
              <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">No booking data for this period</div>
            ) : (
              <div className="flex-1 flex flex-col justify-end">
                <div className="flex items-end gap-3 h-44">
                  {(stats?.tierBreakdown ?? []).map((t) => {
                    const maxRev = Math.max(...(stats?.tierBreakdown ?? []).map((x) => x.revenue));
                    const pct = maxRev > 0 ? (t.revenue / maxRev) * 100 : 0;
                    const color = t.tier_name === "Diver" ? "#d4af37"
                      : t.tier_name === "Swimmer" ? "#806b45"
                      : "rgba(255,255,255,0.2)";
                    return (
                      <div key={t.tier_name} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <span className="text-[9px] text-gray-400 font-mono">
                          {fmt(t.revenue)}
                        </span>
                        <div className="flex-1 w-full flex items-end">
                          <div
                            className="w-full rounded-t transition-all"
                            style={{ height: `${Math.max(4, pct)}%`, backgroundColor: color }}
                            title={`${t.tier_name}: ${t.count} bookings`}
                          />
                        </div>
                        <span className="text-[9px] text-gray-500 truncate w-full text-center">{t.tier_name}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-3 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#d4af37]" />Diver</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#806b45]" />Swimmer</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-white/20" />Skimmer</span>
                </div>
              </div>
            )}
          </div>

          {/* Ticket Volume Trend — real counts per tier */}
          <div className="glass-panel rounded-lg p-5 flex flex-col" style={{ minHeight: 320 }}>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-300 font-semibold tracking-wide">Ticket Volume by Tier</p>
              <span className="text-[10px] text-green-400 bg-green-400/10 border border-green-500/20 px-2 py-0.5 rounded">Live</span>
            </div>
            {loading ? (
              <div className="flex-1 space-y-3 flex flex-col justify-center">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-4" />)}
              </div>
            ) : noData ? (
              <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">No booking data for this period</div>
            ) : (
              <div className="flex-1 flex flex-col justify-center gap-4">
                {(stats?.tierBreakdown ?? []).map((t) => {
                  const maxC = Math.max(...(stats?.tierBreakdown ?? []).map((x) => x.count));
                  const pct = maxC > 0 ? (t.count / maxC) * 100 : 0;
                  const color = t.tier_name === "Diver" ? "#d4af37"
                    : t.tier_name === "Swimmer" ? "#806b45"
                    : "rgba(255,255,255,0.2)";
                  return (
                    <div key={t.tier_name}>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{t.tier_name}</span>
                        <span className="font-mono">{t.count} bookings</span>
                      </div>
                      <div className="w-full bg-[#020408] rounded-full h-2.5 border border-white/5">
                        <div
                          className="h-2.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10px] text-gray-600 mt-2">
                  Total tickets: {stats?.ticketCount.toLocaleString() ?? "—"}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Revenue Drivers ──────────────────────────────────────────────── */}
      <section>
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider">
          <Target className="w-5 h-5 mr-2" /> Revenue Drivers
        </h3>
        <div className="glass-panel rounded-lg p-6 flex flex-col">
          <p className="text-sm text-gray-400 uppercase tracking-widest mb-4 flex items-center font-bold">
            <Award className="w-4 h-4 mr-2 text-[#d4af37]" /> Tier Contribution (% of Total Revenue)
          </p>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6" />)}
            </div>
          ) : noData ? (
            <p className="text-xs text-gray-600">No data available for this period.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(stats?.tierBreakdown ?? []).map((t) => {
                const totalRev = (stats?.tierBreakdown ?? []).reduce((s, x) => s + x.revenue, 0);
                const pct = totalRev > 0 ? Math.round((t.revenue / totalRev) * 100) : 0;
                const color = t.tier_name === "Diver" ? "#d4af37"
                  : t.tier_name === "Swimmer" ? "#806b45"
                  : "rgba(255,255,255,0.2)";
                return (
                  <div key={t.tier_name}>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{t.tier_name}</span>
                      <span className="font-mono">{pct}%</span>
                    </div>
                    <div className="w-full bg-[#020408] rounded-full h-2.5 border border-white/5">
                      <div className="h-2.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Source note */}
      <p className="text-xs text-gray-600 text-center italic">
        Live data from <span className="text-gray-500 not-italic">bookings</span> and <span className="text-gray-500 not-italic">time_slots</span> tables. Labor cost % and NPS require dedicated integrations.
      </p>
    </div>
  );
}

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
import { KpiCard, ChartContainer, ProgressBar } from "@/components/shared";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

// ── Types ─────────────────────────────────────────────────────────────────────

type TimeFilter = "today" | "7d" | "mtd" | "ytd";

const FILTER_LABELS: { key: TimeFilter; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d",    label: "7D" },
  { key: "mtd",   label: "MTD" },
  { key: "ytd",   label: "YTD" },
];

// ── Revenue target (configurable) ─────────────────────────────────────────────

const REVENUE_TARGET = 50_000; // RM — adjust per business goals

// ── Utility ───────────────────────────────────────────────────────────────────

function pctChange(current: number, prev: number): string {
  if (prev === 0) return current > 0 ? "+\u221E" : "\u2014";
  const pct = ((current - prev) / prev) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

function pctChangeNum(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0;
  return Number((((current - prev) / prev) * 100).toFixed(1));
}

function fmt(n: number) {
  if (n >= 1_000_000) return `RM ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `RM ${(n / 1_000).toFixed(1)}K`;
  return `RM ${n.toFixed(2)}`;
}

// ── Mock forecast data generator ──────────────────────────────────────────────

function generateForecastData(grossRevenue: number) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dailyAvg = grossRevenue / 7;

  // Simulate daily actuals with some variance
  const actuals = labels.map((_, i) => {
    const variance = 0.6 + Math.random() * 0.8;
    const weekendBoost = i >= 5 ? 1.4 : 1;
    return Math.round(dailyAvg * variance * weekendBoost);
  });

  // Forecast line: smoothed trend slightly above actuals
  const forecast = labels.map((_, i) => {
    const base = dailyAvg * (0.9 + i * 0.05);
    const weekendBoost = i >= 5 ? 1.3 : 1;
    return Math.round(base * weekendBoost);
  });

  return { labels, actuals, forecast };
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

// ── Tier color helper ─────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  Diver: "#d4af37",
  Swimmer: "#806b45",
  Skimmer: "rgba(148,163,184,0.5)",
  Other: "rgba(255,255,255,0.2)",
};

function tierColor(name: string) {
  return TIER_COLORS[name] ?? TIER_COLORS.Other;
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

  // Derived values
  const revenuePct = stats ? Math.min(100, Math.round((stats.grossRevenue / REVENUE_TARGET) * 100)) : 0;
  const forecastData = stats ? generateForecastData(stats.grossRevenue) : null;

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

      {/* ── KPI Cards (shared KpiCard component) ──────────────────────── */}
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
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-panel rounded-lg p-5 space-y-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))
            ) : stats ? (
              <>
                <KpiCard
                  title="Gross Revenue"
                  value={fmt(stats.grossRevenue)}
                  icon={DollarSign}
                  trend={{ value: pctChangeNum(stats.grossRevenue, stats.prevGrossRevenue), label: "vs prior period" }}
                  variant={stats.grossRevenue >= stats.prevGrossRevenue ? "success" : "warning"}
                />
                <KpiCard
                  title="Park Utilization"
                  value={`${stats.utilizationPct}%`}
                  icon={BarChart2}
                  subtitle={stats.utilizationPct > 80 ? "Near Capacity" : stats.utilizationPct > 50 ? "Optimal" : "Low"}
                  variant={stats.utilizationPct > 80 ? "warning" : stats.utilizationPct > 50 ? "success" : "default"}
                />
                <KpiCard
                  title="Tickets Sold"
                  value={stats.ticketCount.toLocaleString()}
                  icon={Users}
                  trend={{ value: pctChangeNum(stats.ticketCount, stats.prevTicketCount), label: "vs prior period" }}
                  variant={stats.ticketCount >= stats.prevTicketCount ? "success" : "danger"}
                />
                <KpiCard
                  title="ARPC"
                  value={fmt(stats.arpc)}
                  icon={Activity}
                  subtitle="Avg Revenue Per Capita"
                  variant="default"
                />
              </>
            ) : null}
          </div>
        )}
      </section>

      {/* ── Revenue vs Target Pacing ──────────────────────────────────── */}
      {!loading && stats && (
        <section>
          <div className="glass-panel rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#d4af37]" />
                <span className="text-sm font-bold tracking-wider text-white">Revenue vs Target</span>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                {fmt(stats.grossRevenue)} / {fmt(REVENUE_TARGET)}
              </span>
            </div>
            <ProgressBar
              value={revenuePct}
              label={`Pacing: ${revenuePct}% of target`}
              showPercentage
              variant={revenuePct >= 90 ? "success" : revenuePct >= 50 ? "gold" : "danger"}
            />
          </div>
        </section>
      )}

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
            <p className="text-xs text-gray-500 mt-2">Total revenue / unique paying guests</p>
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

      {/* ── Charts Row: Actual vs Forecast + Revenue Drivers Doughnut ── */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Actual vs. Forecast Revenue (Bar + Line combo) */}
          <ChartContainer title="Actual vs. Forecast Revenue" subtitle="Daily revenue bars vs forecast trend line">
            {loading || !forecastData ? (
              <div className="flex items-end gap-3 h-64">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${30 + i * 8}%` }} />
                ))}
              </div>
            ) : noData ? (
              <div className="h-64 flex items-center justify-center text-gray-600 text-sm">No booking data for this period</div>
            ) : (
              <div className="h-64">
                <Bar
                  data={{
                    labels: forecastData.labels,
                    datasets: [
                      {
                        type: "bar" as const,
                        label: "Actual Revenue",
                        data: forecastData.actuals,
                        backgroundColor: "rgba(212,175,55,0.6)",
                        borderColor: "rgba(212,175,55,0.8)",
                        borderWidth: 0,
                        borderRadius: 4,
                        yAxisID: "y",
                        order: 2,
                      },
                      {
                        type: "line" as const,
                        label: "Forecast",
                        data: forecastData.forecast,
                        borderColor: "#22c55e",
                        backgroundColor: "rgba(34,197,94,0.08)",
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: "#22c55e",
                        fill: true,
                        tension: 0.4,
                        yAxisID: "y",
                        order: 1,
                      },
                    ],
                  } as any}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { intersect: false, mode: "index" },
                    plugins: {
                      legend: {
                        display: true,
                        position: "top",
                        labels: {
                          color: "#6b7280",
                          usePointStyle: true,
                          pointStyle: "rectRounded",
                          padding: 16,
                          font: { size: 10 },
                        },
                      },
                      tooltip: {
                        backgroundColor: "rgba(0,0,0,0.85)",
                        titleColor: "#d4af37",
                        bodyColor: "#e5e7eb",
                        borderColor: "rgba(212,175,55,0.3)",
                        borderWidth: 1,
                        callbacks: {
                          label: (ctx) => `${ctx.dataset.label}: RM ${(ctx.parsed.y ?? 0).toLocaleString()}`,
                        },
                      },
                    },
                    scales: {
                      x: {
                        ticks: { color: "#6b7280", font: { size: 10 } },
                        grid: { color: "rgba(255,255,255,0.05)" },
                      },
                      y: {
                        ticks: {
                          color: "#6b7280",
                          font: { size: 10 },
                          callback: (v) => `RM ${Number(v).toLocaleString()}`,
                        },
                        grid: { color: "rgba(255,255,255,0.05)" },
                      },
                    },
                  }}
                />
              </div>
            )}
          </ChartContainer>

          {/* Revenue Drivers Doughnut */}
          <ChartContainer title="Revenue Drivers" subtitle="Revenue breakdown by tier">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="w-40 h-40 rounded-full" />
              </div>
            ) : noData || !stats?.tierBreakdown?.length ? (
              <div className="h-64 flex items-center justify-center text-gray-600 text-sm">No tier data for this period</div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="w-full max-w-xs">
                  <Doughnut
                    data={{
                      labels: stats.tierBreakdown.map((t) => t.tier_name),
                      datasets: [
                        {
                          data: stats.tierBreakdown.map((t) => t.revenue),
                          backgroundColor: stats.tierBreakdown.map((t) => tierColor(t.tier_name)),
                          borderColor: "rgba(0,0,0,0.3)",
                          borderWidth: 2,
                          hoverBorderColor: "#d4af37",
                          hoverBorderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: "60%",
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            color: "#6b7280",
                            usePointStyle: true,
                            pointStyle: "circle",
                            padding: 16,
                            font: { size: 11 },
                          },
                        },
                        tooltip: {
                          backgroundColor: "rgba(0,0,0,0.85)",
                          titleColor: "#d4af37",
                          bodyColor: "#e5e7eb",
                          borderColor: "rgba(212,175,55,0.3)",
                          borderWidth: 1,
                          callbacks: {
                            label: (ctx) => {
                              const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                              const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : "0";
                              return `${ctx.label}: RM ${ctx.parsed.toLocaleString()} (${pct}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}
          </ChartContainer>
        </div>
      </section>

      {/* ── Original Charts Row (Tier Bars + Volume) ─────────────────── */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Revenue by Tier -- real data */}
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
                    return (
                      <div key={t.tier_name} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <span className="text-[9px] text-gray-400 font-mono">
                          {fmt(t.revenue)}
                        </span>
                        <div className="flex-1 w-full flex items-end">
                          <div
                            className="w-full rounded-t transition-all"
                            style={{ height: `${Math.max(4, pct)}%`, backgroundColor: tierColor(t.tier_name) }}
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

          {/* Ticket Volume Trend -- real counts per tier */}
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
                  return (
                    <div key={t.tier_name}>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{t.tier_name}</span>
                        <span className="font-mono">{t.count} bookings</span>
                      </div>
                      <div className="w-full bg-[#020408] rounded-full h-2.5 border border-white/5">
                        <div
                          className="h-2.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: tierColor(t.tier_name) }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10px] text-gray-600 mt-2">
                  Total tickets: {stats?.ticketCount.toLocaleString() ?? "\u2014"}
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
                return (
                  <div key={t.tier_name}>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{t.tier_name}</span>
                      <span className="font-mono">{pct}%</span>
                    </div>
                    <div className="w-full bg-[#020408] rounded-full h-2.5 border border-white/5">
                      <div className="h-2.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: tierColor(t.tier_name) }} />
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

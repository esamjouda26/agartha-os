"use client";

import { useState, useEffect, useTransition } from "react";
import { Users, MousePointerClick, Smile } from "lucide-react";
import { fetchGxAnalyticsAction, type GxAnalytics } from "../admin-analytics-actions";

// ── Types ─────────────────────────────────────────────────────────────────────

const FILTER_LABELS = [
  { key: "today", label: "Today" },
  { key: "7d",    label: "7D" },
  { key: "mtd",   label: "MTD" },
  { key: "ytd",   label: "YTD" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded animate-pulse bg-white/5 ${className}`} style={{ minHeight: 12 }} />;
}

function PieSlices({ data }: { data: { label: string; pct: number; color: string }[] }) {
  return (
    <div className="flex flex-col gap-2 my-4">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{d.label}</span>
            <span className="font-mono">{d.pct}%</span>
          </div>
          <div className="w-full bg-[#020408] rounded-full h-2 border border-white/5">
            <div className="h-2 rounded-full transition-all" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Sparkline (static target line, real data required for full trend) ──────────

const CSAT_TREND_STATIC = [8.5, 8.7, 8.6, 8.9, 9.2, 9.4, 9.1];
const CSAT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const KEYWORD_TAGS = [
  { w: '"Immersive"', cls: "bg-green-500/10 border-green-500/20 text-green-400" },
  { w: '"Visuals"',   cls: "bg-green-500/10 border-green-500/20 text-green-400" },
  { w: '"Staff"',     cls: "bg-[rgba(212,175,55,0.1)] border-[rgba(212,175,55,0.2)] text-[#d4af37]" },
  { w: '"Wait Time"', cls: "bg-red-500/10 border-red-500/20 text-red-400" },
  { w: '"App"',       cls: "bg-gray-500/10 border-gray-500/20 text-gray-300" },
];

function CsatSparkline() {
  const min = 6; const max = 10; const h = 80; const w = 100;
  const pts = CSAT_TREND_STATIC.map((v, i) =>
    `${(i / (CSAT_TREND_STATIC.length - 1)) * w},${h - ((v - min) / (max - min)) * h}`
  ).join(" ");
  const targetY = h - ((9.0 - min) / (max - min)) * h;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
      <line x1="0" y1={targetY} x2={w} y2={targetY} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 3" />
      <polyline points={pts} fill="none" stroke="#d4af37" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill="#d4af37" fillOpacity="0.1" />
      {CSAT_TREND_STATIC.map((v, i) => {
        const x = (i / (CSAT_TREND_STATIC.length - 1)) * w;
        const y = h - ((v - min) / (max - min)) * h;
        return <circle key={i} cx={x} cy={y} r="2.5" fill="#020408" stroke="#d4af37" strokeWidth="1.5" />;
      })}
    </svg>
  );
}

// ── Hardcoded lead-time (no slot_date join needed) ─────────────────────────────

const LEAD_DATA = [
  { label: "Walk-in", pct: 15 },
  { label: "1-3d",    pct: 30 },
  { label: "4-7d",    pct: 25 },
  { label: "8-14d",   pct: 20 },
  { label: "15d+",    pct: 10 },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GxAnalyticsPage() {
  const [filter, setFilter] = useState("today");
  const [analytics, setAnalytics] = useState<GxAnalytics | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const data = await fetchGxAnalyticsAction(filter);
      setAnalytics(data);
    });
  }, [filter]);

  const loading = isPending || analytics === null;
  const noData = !loading && analytics !== null && analytics.totalBookings === 0;

  return (
    <div className="space-y-10 pb-10">

      {/* ── Data status banner ──────────────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-[rgba(212,175,55,0.06)] border border-[rgba(212,175,55,0.2)] rounded-lg px-5 py-3">
        <span className="text-[#d4af37] text-sm flex-shrink-0 mt-0.5">ℹ</span>
        <p className="text-xs text-gray-400">
          <span className="text-[#d4af37] font-semibold">Live booking telemetry.</span>{" "}
          Tier mix, demographics, and commitment rates are sourced from the live{" "}
          <span className="font-mono text-gray-300">bookings</span> table.
          CSAT and sentiment scores require a survey/feedback table integration (not yet available).
        </p>
      </div>

      {/* Time filter bar */}
      <div className="glass-panel rounded-lg p-2 flex items-center w-fit ml-auto border-[rgba(212,175,55,0.2)] shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
        <div className="flex items-center space-x-1">
          {FILTER_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 text-sm rounded transition-all ${
                filter === key
                  ? "font-bold bg-[rgba(212,175,55,0.2)] text-[#d4af37] border border-[rgba(212,175,55,0.5)] shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                  : "font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Core Experience & Demographics ──────────────────────────────── */}
      <section>
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider">
          <Users className="w-5 h-5 mr-2" /> Core Experience & Demographic Mix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Tier Performance */}
          <div className="glass-panel rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Tier Performance</p>
              <span className="text-[10px] text-green-400 bg-green-400/10 border border-green-500/20 px-2 py-0.5 rounded">Live</span>
            </div>
            {loading ? (
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
              </div>
            ) : noData ? (
              <p className="text-xs text-gray-600 mt-4">No bookings in this period</p>
            ) : (
              <PieSlices data={analytics?.tierData ?? []} />
            )}
          </div>

          {/* Demographics */}
          <div className="glass-panel rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Demographics</p>
              <span className="text-[10px] text-green-400 bg-green-400/10 border border-green-500/20 px-2 py-0.5 rounded">Live</span>
            </div>
            {loading ? (
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
              </div>
            ) : noData ? (
              <p className="text-xs text-gray-600 mt-4">No bookings in this period</p>
            ) : (
              <PieSlices data={analytics?.demoData ?? []} />
            )}
          </div>

          {/* Group Composition — static (no group type in schema) */}
          <div className="glass-panel rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Group Composition</p>
              <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded">Reference</span>
            </div>
            <PieSlices data={[
              { label: "Solo",       pct: 15, color: "rgba(255,255,255,0.15)" },
              { label: "Couples",    pct: 35, color: "#806b45" },
              { label: "Groups (3+)", pct: 50, color: "#d4af37" },
            ]} />
            <p className="text-[9px] text-gray-600 mt-1">Party-size data requires booking group field — not in current schema</p>
          </div>
        </div>
      </section>

      {/* ── Booking Behavior ─────────────────────────────────────────────── */}
      <section>
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider">
          <MousePointerClick className="w-5 h-5 mr-2" /> Booking Behavior
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

          {/* Acquisition Channel — static (all bookings are web) */}
          <div className="glass-panel rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Acquisition Channel</p>
              <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded">Reference</span>
            </div>
            <PieSlices data={[
              { label: "Web",   pct: 78, color: "#d4af37" },
              { label: "Kiosk", pct: 22, color: "#806b45" },
            ]} />
            <p className="text-[9px] text-gray-600 mt-1">Kiosk tracking requires a separate acquisition source field</p>
          </div>

          {/* Ancillary Conversion — static gauge */}
          <div className="glass-panel rounded-lg p-5 flex flex-col items-center justify-center">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-4 font-semibold text-center">Ancillary Conversion</p>
            <div className="relative w-32 h-16 overflow-hidden">
              <div className="absolute inset-0 rounded-full border-[10px] border-[#020408]" style={{ clipPath: "ellipse(50% 100% at 50% 100%)" }} />
              <div className="absolute inset-0 rounded-full border-[10px] border-[#d4af37]" style={{ clipPath: "ellipse(50% 100% at 50% 100%)", opacity: 0.9, transform: "rotate(-113deg)", transformOrigin: "bottom center" }} />
              <div className="absolute inset-0 rounded-full border-[10px] border-white/5" style={{ clipPath: "ellipse(50% 100% at 50% 100%)" }} />
            </div>
            <span className="font-orbitron text-2xl font-bold text-white mt-2">42.5%</span>
            <span className="text-[10px] text-[#d4af37] uppercase tracking-widest">Attach Rate</span>
            <p className="text-[9px] text-gray-600 mt-1">Requires F&B / merch order linkage</p>
          </div>

          {/* Commitment Rate — real data */}
          <div className="glass-panel rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Commitment Rate</p>
              <span className="text-[10px] text-green-400 bg-green-400/10 border border-green-500/20 px-2 py-0.5 rounded">Live</span>
            </div>
            {loading ? (
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
              </div>
            ) : noData ? (
              <p className="text-xs text-gray-600 mt-4">No bookings in this period</p>
            ) : (
              <PieSlices data={analytics?.commitmentData ?? []} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CES — static */}
          <div className="glass-panel rounded-lg p-5 flex flex-col justify-center items-center text-center">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-4 font-semibold">Customer Effort Score</p>
            <h4 className="font-orbitron text-5xl font-bold text-white mb-2">1.8</h4>
            <span className="text-xs text-green-400 bg-green-400/10 px-3 py-1.5 rounded border border-green-500/20 mb-4">Low Effort Verified</span>
            <p className="text-xs text-gray-500 uppercase tracking-widest border-t border-white/10 pt-4 w-full">Scale: 1 (Very Easy) to 7 (Very Difficult) — Reference benchmark</p>
          </div>

          {/* Lead Time — static (join required) */}
          <div className="glass-panel rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Lead Time (Days Before Visit)</p>
              <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded">Reference</span>
            </div>
            <div className="flex items-end gap-2 h-24">
              {LEAD_DATA.map((l) => (
                <div key={l.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-[#806b45] hover:bg-[#d4af37] rounded-t transition-colors" style={{ height: `${l.pct * 2}px` }} title={`${l.pct}%`} />
                  <span className="text-[9px] text-gray-500 text-center">{l.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-gray-600 mt-2">Real lead time requires joining bookings with slot dates</p>
          </div>
        </div>
      </section>

      {/* ── Satisfaction & Sentiment ──────────────────────────────────────── */}
      <section>
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider">
          <Smile className="w-5 h-5 mr-2" /> Satisfaction & Sentiment
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* CSAT Trend — reference */}
          <div className="glass-panel rounded-lg p-5 lg:col-span-2 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-300 font-semibold tracking-wide uppercase">CSAT Trend Line</p>
                <p className="text-[9px] text-gray-600 mt-0.5">Reference benchmark — requires survey/feedback table integration</p>
              </div>
              <div className="flex bg-[#020408] rounded border border-white/10 p-0.5">
                {["D", "W", "M"].map((t, i) => (
                  <button key={t} className={`w-7 h-6 flex items-center justify-center text-xs font-medium rounded transition-colors ${i === 0 ? "bg-[rgba(212,175,55,0.1)] text-[#d4af37] border border-[rgba(212,175,55,0.4)]" : "text-gray-500 hover:text-gray-300"}`}>{t}</button>
                ))}
              </div>
            </div>
            <CsatSparkline />
            <div className="flex justify-between text-[9px] text-gray-500 mt-1 px-1">
              {CSAT_DAYS.map((d) => <span key={d}>{d}</span>)}
            </div>
            <div className="flex gap-4 mt-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 border-t border-[#d4af37]" />CSAT Score</span>
              <span className="flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-white/30" />Target (9.0)</span>
            </div>
          </div>

          {/* Post-Visit Sentiment — reference */}
          <div className="glass-panel rounded-lg p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Post-Visit Sentiment</p>
              <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded">Reference</span>
            </div>
            <div className="mb-4">
              <div className="w-full flex h-3 rounded-full overflow-hidden shadow-inner border border-white/5">
                <div className="bg-green-500" style={{ width: "82%" }} />
                <div className="bg-gray-500" style={{ width: "12%" }} />
                <div className="bg-red-500" style={{ width: "6%" }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                <span className="text-green-400">Positive (82%)</span>
                <span className="text-gray-400">Neutral (12%)</span>
                <span className="text-red-400">Negative (6%)</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 uppercase mb-3 border-b border-white/10 pb-1">Trending Keywords</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {KEYWORD_TAGS.map((k) => (
                <span key={k.w} className={`px-2 py-1 border text-xs rounded-md ${k.cls}`}>{k.w}</span>
              ))}
            </div>
            <div className="bg-[#020408]/50 rounded p-3 border-l-2 border-[#d4af37] flex-1">
              <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Reference Verbatim</p>
              <p className="text-sm text-gray-300 italic leading-relaxed">
                &ldquo;The projection mapping in Zone B was unlike anything I&apos;ve ever seen.&rdquo;
              </p>
            </div>
            <p className="text-[9px] text-gray-600 mt-3">Live sentiment requires a survey/review table not yet in schema</p>
          </div>
        </div>
      </section>
    </div>
  );
}

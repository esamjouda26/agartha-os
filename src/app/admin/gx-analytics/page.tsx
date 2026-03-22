"use client";

import { useState, useEffect, useTransition } from "react";
import { Users, MousePointerClick, Smile } from "lucide-react";
import {
  fetchGxAnalyticsAction,
  fetchSurveyStatsAction,
  type GxAnalytics,
  type SurveyStats,
} from "../admin-analytics-actions";
import { ChartContainer, TimeRangeSelector } from "@/components/shared";

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
import { Doughnut, Pie, Line, Bar } from "react-chartjs-2";

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

const FILTER_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d",    label: "7D" },
  { value: "mtd",   label: "MTD" },
  { value: "ytd",   label: "YTD" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded animate-pulse bg-white/5 ${className}`} style={{ minHeight: 12 }} />;
}

function LiveBadge() {
  return <span className="text-[10px] text-green-400 bg-green-400/10 border border-green-500/20 px-2 py-0.5 rounded">Live</span>;
}

function RefBadge() {
  return <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded">Reference</span>;
}

// ── Shared chart defaults ─────────────────────────────────────────────────────

const GOLD    = "#d4af37";
const BRONZE  = "#806b45";
const EMERALD = "#10b981";
const RED     = "#ef4444";

const chartFont = { family: "'Inter', 'Segoe UI', sans-serif", size: 11 };
const gridColor = "rgba(255,255,255,0.05)";

const doughnutBaseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "65%",
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: { color: "rgba(255,255,255,0.5)", font: chartFont, padding: 12, boxWidth: 10 },
    },
    tooltip: {
      backgroundColor: "rgba(2,4,8,0.95)",
      titleColor: "#fff",
      bodyColor: "rgba(255,255,255,0.7)",
      borderColor: "rgba(212,175,55,0.3)",
      borderWidth: 1,
    },
  },
};

// ── Reference data ────────────────────────────────────────────────────────────

const CSAT_TREND_STATIC = [8.5, 8.7, 8.6, 8.9, 9.2, 9.4, 9.1];
const CSAT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const KEYWORD_TAGS = [
  { w: '"Immersive"', cls: "bg-green-500/10 border-green-500/20 text-green-400" },
  { w: '"Visuals"',   cls: "bg-green-500/10 border-green-500/20 text-green-400" },
  { w: '"Staff"',     cls: "bg-[rgba(212,175,55,0.1)] border-[rgba(212,175,55,0.2)] text-[#d4af37]" },
  { w: '"Wait Time"', cls: "bg-red-500/10 border-red-500/20 text-red-400" },
  { w: '"App"',       cls: "bg-gray-500/10 border-gray-500/20 text-gray-300" },
];

const LEAD_DATA = [
  { label: "Walk-in", pct: 15 },
  { label: "1-3d",    pct: 30 },
  { label: "4-7d",    pct: 25 },
  { label: "8-14d",   pct: 20 },
  { label: "15d+",    pct: 10 },
];

const SENTIMENT = { positive: 82, neutral: 12, negative: 6 };

// ── Chart components ──────────────────────────────────────────────────────────

function TierDoughnut({ data }: { data: { label: string; pct: number; color: string }[] }) {
  return (
    <div className="h-52">
      <Doughnut
        data={{
          labels: data.map((d) => d.label),
          datasets: [{
            data: data.map((d) => d.pct),
            backgroundColor: data.map((d) => d.color),
            borderColor: "rgba(2,4,8,0.8)",
            borderWidth: 2,
            hoverOffset: 6,
          }],
        }}
        options={{
          ...doughnutBaseOpts,
          plugins: {
            ...doughnutBaseOpts.plugins,
            tooltip: {
              ...doughnutBaseOpts.plugins.tooltip,
              callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` },
            },
          },
        }}
      />
    </div>
  );
}

function DemoDoughnut({ data }: { data: { label: string; pct: number; color: string }[] }) {
  return (
    <div className="h-52">
      <Doughnut
        data={{
          labels: data.map((d) => d.label),
          datasets: [{
            data: data.map((d) => d.pct),
            backgroundColor: data.map((d) => d.color),
            borderColor: "rgba(2,4,8,0.8)",
            borderWidth: 2,
            hoverOffset: 6,
          }],
        }}
        options={{
          ...doughnutBaseOpts,
          plugins: {
            ...doughnutBaseOpts.plugins,
            tooltip: {
              ...doughnutBaseOpts.plugins.tooltip,
              callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` },
            },
          },
        }}
      />
    </div>
  );
}

function CommitmentPie({ data }: { data: { label: string; pct: number; color: string }[] }) {
  return (
    <div className="h-52">
      <Pie
        data={{
          labels: data.map((d) => d.label),
          datasets: [{
            data: data.map((d) => d.pct),
            backgroundColor: data.map((d) => d.color),
            borderColor: "rgba(2,4,8,0.8)",
            borderWidth: 2,
            hoverOffset: 6,
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom" as const,
              labels: { color: "rgba(255,255,255,0.5)", font: chartFont, padding: 12, boxWidth: 10 },
            },
            tooltip: {
              ...doughnutBaseOpts.plugins.tooltip,
              callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` },
            },
          },
        }}
      />
    </div>
  );
}

function CsatTrendLine({ labels, scores }: { labels?: string[]; scores?: number[] }) {
  const chartLabels = labels ?? CSAT_DAYS;
  const chartData = scores ?? CSAT_TREND_STATIC;
  return (
    <div className="h-48">
      <Line
        data={{
          labels: chartLabels,
          datasets: [
            {
              label: "CSAT Score",
              data: chartData,
              borderColor: GOLD,
              backgroundColor: "rgba(212,175,55,0.08)",
              pointBackgroundColor: "#020408",
              pointBorderColor: GOLD,
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.3,
              fill: true,
            },
            {
              label: "Target (9.0)",
              data: Array(chartLabels.length).fill(9.0),
              borderColor: "rgba(255,255,255,0.2)",
              borderDash: [6, 4],
              pointRadius: 0,
              borderWidth: 1,
              fill: false,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: "rgba(255,255,255,0.4)", font: chartFont },
            },
            y: {
              min: 7,
              max: 10,
              grid: { color: gridColor },
              ticks: { color: "rgba(255,255,255,0.4)", font: chartFont, stepSize: 0.5 },
            },
          },
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "rgba(255,255,255,0.5)", font: chartFont, padding: 12, boxWidth: 16 },
            },
            tooltip: {
              backgroundColor: "rgba(2,4,8,0.95)",
              titleColor: "#fff",
              bodyColor: "rgba(255,255,255,0.7)",
              borderColor: "rgba(212,175,55,0.3)",
              borderWidth: 1,
            },
          },
        }}
      />
    </div>
  );
}

function LeadTimeBar() {
  return (
    <div className="h-48">
      <Bar
        data={{
          labels: LEAD_DATA.map((d) => d.label),
          datasets: [{
            label: "Distribution %",
            data: LEAD_DATA.map((d) => d.pct),
            backgroundColor: LEAD_DATA.map((_, i) =>
              i === 1 ? GOLD : BRONZE // highlight dominant bucket
            ),
            borderColor: "rgba(2,4,8,0.8)",
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.7,
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: "y",
          scales: {
            x: {
              max: 40,
              grid: { color: gridColor },
              ticks: {
                color: "rgba(255,255,255,0.4)",
                font: chartFont,
                callback: (v) => `${v}%`,
              },
            },
            y: {
              grid: { display: false },
              ticks: { color: "rgba(255,255,255,0.5)", font: chartFont },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(2,4,8,0.95)",
              titleColor: "#fff",
              bodyColor: "rgba(255,255,255,0.7)",
              borderColor: "rgba(212,175,55,0.3)",
              borderWidth: 1,
              callbacks: { label: (ctx) => `${ctx.parsed.x}%` },
            },
          },
        }}
      />
    </div>
  );
}

function AncillaryGauge() {
  const rate = 42.5;
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="h-32 w-52 relative">
        <Doughnut
          data={{
            labels: ["Attach Rate", "Remaining"],
            datasets: [{
              data: [rate, 100 - rate],
              backgroundColor: [GOLD, "rgba(255,255,255,0.05)"],
              borderWidth: 0,
              hoverOffset: 0,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            rotation: -90,
            circumference: 180,
            cutout: "75%",
            plugins: {
              legend: { display: false },
              tooltip: {
                ...doughnutBaseOpts.plugins.tooltip,
                filter: (item) => item.dataIndex === 0,
                callbacks: { label: (ctx) => `${ctx.parsed}%` },
              },
            },
          }}
        />
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center">
          <span className="font-orbitron text-2xl font-bold text-white">{rate}%</span>
          <br />
          <span className="text-[10px] text-[#d4af37] uppercase tracking-widest">Attach Rate</span>
        </div>
      </div>
      <p className="text-[9px] text-gray-600 mt-2">Requires F&B / merch order linkage</p>
    </div>
  );
}

function SentimentStackedBar({ sentiment }: { sentiment?: { positive: number; neutral: number; negative: number } }) {
  const s = sentiment ?? SENTIMENT;
  // Compute percentages if we have counts from live data
  const total = s.positive + s.neutral + s.negative;
  const pPct = total > 0 ? Math.round((s.positive / total) * 100) : s.positive;
  const nPct = total > 0 ? Math.round((s.neutral / total) * 100) : s.neutral;
  const negPct = total > 0 ? Math.round((s.negative / total) * 100) : s.negative;
  return (
    <div className="mb-4">
      <div className="h-20">
        <Bar
          data={{
            labels: ["Post-Visit"],
            datasets: [
              {
                label: "Positive",
                data: [pPct],
                backgroundColor: EMERALD,
                borderRadius: 2,
                barPercentage: 0.5,
              },
              {
                label: "Neutral",
                data: [nPct],
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 2,
                barPercentage: 0.5,
              },
              {
                label: "Negative",
                data: [negPct],
                backgroundColor: RED,
                borderRadius: 2,
                barPercentage: 0.5,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            scales: {
              x: {
                stacked: true,
                max: 100,
                grid: { color: gridColor },
                ticks: {
                  color: "rgba(255,255,255,0.4)",
                  font: chartFont,
                  callback: (v) => `${v}%`,
                },
              },
              y: {
                stacked: true,
                display: false,
              },
            },
            plugins: {
              legend: {
                position: "bottom",
                labels: { color: "rgba(255,255,255,0.5)", font: chartFont, padding: 12, boxWidth: 10 },
              },
              tooltip: {
                backgroundColor: "rgba(2,4,8,0.95)",
                titleColor: "#fff",
                bodyColor: "rgba(255,255,255,0.7)",
                borderColor: "rgba(212,175,55,0.3)",
                borderWidth: 1,
                callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.x}%` },
              },
            },
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
        <span className="text-green-400">Positive ({pPct}%)</span>
        <span className="text-gray-400">Neutral ({nPct}%)</span>
        <span className="text-red-400">Negative ({negPct}%)</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GxAnalyticsPage() {
  const [filter, setFilter] = useState("today");
  const [analytics, setAnalytics] = useState<GxAnalytics | null>(null);
  const [surveyStats, setSurveyStats] = useState<SurveyStats | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const [data, survey] = await Promise.all([
        fetchGxAnalyticsAction(filter),
        fetchSurveyStatsAction(filter),
      ]);
      setAnalytics(data);
      setSurveyStats(survey);
    });
  }, [filter]);

  const loading = isPending || analytics === null;
  const noData = !loading && analytics !== null && analytics.totalBookings === 0;

  return (
    <div className="space-y-10 pb-10">

      {/* ── Data status banner ──────────────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-[rgba(212,175,55,0.06)] border border-[rgba(212,175,55,0.2)] rounded-lg px-5 py-3">
        <span className="text-[#d4af37] text-sm flex-shrink-0 mt-0.5">&#x2139;</span>
        <p className="text-xs text-gray-400">
          <span className="text-[#d4af37] font-semibold">Live booking telemetry.</span>{" "}
          Tier mix, demographics, and commitment rates are sourced from the live{" "}
          <span className="font-mono text-gray-300">bookings</span> table.
          {surveyStats
            ? <> CSAT and sentiment are sourced from the live <span className="font-mono text-gray-300">survey_responses</span> table ({surveyStats.totalResponses} responses).</>
            : <> CSAT and sentiment scores will appear when data is available in the <span className="font-mono text-gray-300">survey_responses</span> table.</>
          }
        </p>
      </div>

      {/* Time filter bar — using shared TimeRangeSelector */}
      <div className="flex justify-end">
        <TimeRangeSelector
          value={filter}
          onChange={setFilter}
          options={FILTER_OPTIONS}
        />
      </div>

      {/* ── Core Experience & Demographics ──────────────────────────────── */}
      <section>
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider">
          <Users className="w-5 h-5 mr-2" /> Core Experience & Demographic Mix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Tier Performance — Chart.js Doughnut */}
          <ChartContainer title="Tier Performance" subtitle="Skimmer / Swimmer / Diver">
            <div className="flex items-center justify-end -mt-8 mb-2"><LiveBadge /></div>
            {loading ? (
              <div className="space-y-2 mt-4"><Skeleton className="h-40" /></div>
            ) : noData ? (
              <p className="text-xs text-gray-600 mt-4">No bookings in this period</p>
            ) : (
              <TierDoughnut data={analytics?.tierData ?? []} />
            )}
          </ChartContainer>

          {/* Demographics — Chart.js Doughnut */}
          <ChartContainer title="Demographics" subtitle="Adult / Child split">
            <div className="flex items-center justify-end -mt-8 mb-2"><LiveBadge /></div>
            {loading ? (
              <div className="space-y-2 mt-4"><Skeleton className="h-40" /></div>
            ) : noData ? (
              <p className="text-xs text-gray-600 mt-4">No bookings in this period</p>
            ) : (
              <DemoDoughnut data={analytics?.demoData ?? []} />
            )}
          </ChartContainer>

          {/* Commitment Rate — Chart.js Pie */}
          <ChartContainer title="Commitment Rate" subtitle="Kept / Cancelled / Pending">
            <div className="flex items-center justify-end -mt-8 mb-2"><LiveBadge /></div>
            {loading ? (
              <div className="space-y-2 mt-4"><Skeleton className="h-40" /></div>
            ) : noData ? (
              <p className="text-xs text-gray-600 mt-4">No bookings in this period</p>
            ) : (
              <CommitmentPie data={analytics?.commitmentData ?? []} />
            )}
          </ChartContainer>
        </div>
      </section>

      {/* ── Booking Behavior ─────────────────────────────────────────────── */}
      <section>
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider">
          <MousePointerClick className="w-5 h-5 mr-2" /> Booking Behavior
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

          {/* Acquisition Channel — static */}
          <ChartContainer title="Acquisition Channel">
            <div className="flex items-center justify-end -mt-8 mb-2"><RefBadge /></div>
            <div className="h-52">
              <Doughnut
                data={{
                  labels: ["Web", "Kiosk"],
                  datasets: [{
                    data: [78, 22],
                    backgroundColor: [GOLD, BRONZE],
                    borderColor: "rgba(2,4,8,0.8)",
                    borderWidth: 2,
                    hoverOffset: 6,
                  }],
                }}
                options={{
                  ...doughnutBaseOpts,
                  plugins: {
                    ...doughnutBaseOpts.plugins,
                    tooltip: {
                      ...doughnutBaseOpts.plugins.tooltip,
                      callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` },
                    },
                  },
                }}
              />
            </div>
            <p className="text-[9px] text-gray-600 mt-1">Kiosk tracking requires a separate acquisition source field</p>
          </ChartContainer>

          {/* Ancillary Conversion — half-doughnut gauge */}
          <ChartContainer title="Ancillary Conversion">
            <div className="flex items-center justify-end -mt-8 mb-2"><RefBadge /></div>
            <AncillaryGauge />
          </ChartContainer>

          {/* Commitment Rate (live) is in top section — Lead Time here */}
          <ChartContainer title="Lead Time Distribution" subtitle="Days before visit">
            <div className="flex items-center justify-end -mt-8 mb-2"><RefBadge /></div>
            <LeadTimeBar />
            <p className="text-[9px] text-gray-600 mt-2">Real lead time requires joining bookings with slot dates</p>
          </ChartContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CES — static */}
          <ChartContainer title="Customer Effort Score" className="flex flex-col justify-center items-center text-center">
            <h4 className="font-orbitron text-5xl font-bold text-white mb-2 mt-2">1.8</h4>
            <span className="text-xs text-green-400 bg-green-400/10 px-3 py-1.5 rounded border border-green-500/20 mb-4">Low Effort Verified</span>
            <p className="text-xs text-gray-500 uppercase tracking-widest border-t border-white/10 pt-4 w-full">Scale: 1 (Very Easy) to 7 (Very Difficult) &mdash; Reference benchmark</p>
          </ChartContainer>

          {/* Group Composition — static */}
          <ChartContainer title="Group Composition">
            <div className="flex items-center justify-end -mt-8 mb-2"><RefBadge /></div>
            <div className="h-52">
              <Doughnut
                data={{
                  labels: ["Solo", "Couples", "Groups (3+)"],
                  datasets: [{
                    data: [15, 35, 50],
                    backgroundColor: ["rgba(255,255,255,0.15)", BRONZE, GOLD],
                    borderColor: "rgba(2,4,8,0.8)",
                    borderWidth: 2,
                    hoverOffset: 6,
                  }],
                }}
                options={{
                  ...doughnutBaseOpts,
                  plugins: {
                    ...doughnutBaseOpts.plugins,
                    tooltip: {
                      ...doughnutBaseOpts.plugins.tooltip,
                      callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` },
                    },
                  },
                }}
              />
            </div>
            <p className="text-[9px] text-gray-600 mt-1">Party-size data requires booking group field &mdash; not in current schema</p>
          </ChartContainer>
        </div>
      </section>

      {/* ── Satisfaction & Sentiment ──────────────────────────────────────── */}
      <section>
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider">
          <Smile className="w-5 h-5 mr-2" /> Satisfaction & Sentiment
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* CSAT Trend — Chart.js Line */}
          <ChartContainer
            title="CSAT Trend Line"
            subtitle={surveyStats ? `${surveyStats.totalResponses} survey responses` : "Reference benchmark - requires survey integration"}
            timeToggle
            className="lg:col-span-2"
          >
            <div className="flex items-center justify-end -mt-8 mb-2">
              {surveyStats ? <LiveBadge /> : <RefBadge />}
            </div>
            <CsatTrendLine
              labels={surveyStats?.csatTrend?.length ? surveyStats.csatTrend.map(t => t.month) : undefined}
              scores={surveyStats?.csatTrend?.length ? surveyStats.csatTrend.map(t => t.score) : undefined}
            />
          </ChartContainer>

          {/* Post-Visit Sentiment — Stacked Bar + Keywords */}
          <ChartContainer title="Post-Visit Sentiment">
            <div className="flex items-center justify-end -mt-8 mb-2">
              {surveyStats ? <LiveBadge /> : <RefBadge />}
            </div>
            <SentimentStackedBar sentiment={surveyStats?.sentimentBreakdown ?? undefined} />
            <p className="text-xs text-gray-400 uppercase mb-3 border-b border-white/10 pb-1">Trending Keywords</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {surveyStats?.topKeywords && surveyStats.topKeywords.length > 0
                ? surveyStats.topKeywords.map((kw) => (
                    <span key={kw} className="px-2 py-1 border text-xs rounded-md bg-green-500/10 border-green-500/20 text-green-400">{kw}</span>
                  ))
                : KEYWORD_TAGS.map((k) => (
                    <span key={k.w} className={`px-2 py-1 border text-xs rounded-md ${k.cls}`}>{k.w}</span>
                  ))
              }
            </div>
            <div className="bg-[#020408]/50 rounded p-3 border-l-2 border-[#d4af37] flex-1">
              <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Reference Verbatim</p>
              <p className="text-sm text-gray-300 italic leading-relaxed">
                &ldquo;The projection mapping in Zone B was unlike anything I&apos;ve ever seen.&rdquo;
              </p>
            </div>
            <p className="text-[9px] text-gray-600 mt-3">Live sentiment requires a survey/review table not yet in schema</p>
          </ChartContainer>
        </div>
      </section>
    </div>
  );
}

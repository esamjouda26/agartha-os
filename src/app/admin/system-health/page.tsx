"use client";

// TODO: All data on this page is mock/reference — awaits live APM integration
// (e.g. Datadog, Prometheus, or custom telemetry endpoint).

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { Server, Activity, HardDrive, Database, Radio, Wifi, RefreshCw } from "lucide-react";
import { KpiCard, ChartContainer, FilterChips } from "@/components/shared";
import { fetchSystemMetricsAction, type SystemHealthStats } from "../admin-analytics-actions";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler);

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/** Generate a random-ish time-series of `count` points between lo and hi */
function genSeries(count: number, lo: number, hi: number, trend: "flat" | "up" | "down" = "flat"): number[] {
  const pts: number[] = [];
  let v = lo + (hi - lo) * 0.5;
  for (let i = 0; i < count; i++) {
    const drift = trend === "up" ? 0.15 : trend === "down" ? -0.15 : 0;
    v += (Math.random() - 0.5 + drift) * (hi - lo) * 0.12;
    v = Math.max(lo, Math.min(hi, v));
    pts.push(Math.round(v * 100) / 100);
  }
  return pts;
}

const SPARK_COUNT = 24;

/** Shared sparkline options — no axes, no legends, tiny footprint */
const sparkOpts = (borderColor: string, fillColor: string) =>
  ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: {
      point: { radius: 0 },
      line: { borderWidth: 2, tension: 0.4, borderColor, fill: true, backgroundColor: fillColor },
    },
  }) as const;

const sparkLabels = Array.from({ length: SPARK_COUNT }, (_, i) => String(i));

function makeSparkData(data: number[], borderColor: string, fillColor: string) {
  return {
    labels: sparkLabels,
    datasets: [{ data, borderColor, backgroundColor: fillColor, fill: true, tension: 0.4, pointRadius: 0 }],
  };
}

/* ─── Mock error-log entries ─────────────────────────────────────────────── */

const ERROR_LOG = [
  { ts: "12:08:15", level: "ERROR", service: "TicketingAPI", msg: "Connection timeout to external payment gateway. Retrying (1/3)..." },
  { ts: "12:07:42", level: "WARN",  service: "Auth0_Gateway", msg: "Rate limit approaching (85%) for ServiceAccount_Kiosk_Z1." },
  { ts: "12:05:00", level: "INFO",  service: "DB_Cluster", msg: "Automated incremental snapshot completed successfully (2.4GB)." },
  { ts: "11:59:12", level: "ERROR", service: "Spatial_Engine", msg: "Bad Gateway. Dropped telemetry packets from Zone C. Failover initiated." },
  { ts: "11:55:30", level: "INFO",  service: "IAM_Service", msg: "User 'Admin' successfully authenticated via Admin Portal." },
  { ts: "11:52:10", level: "WARN",  service: "CacheLayer", msg: "Redis eviction rate above threshold (320 keys/s)." },
  { ts: "11:48:45", level: "INFO",  service: "Scheduler", msg: "Cron job 'nightly-reindex' completed in 4m 12s." },
  { ts: "11:44:02", level: "ERROR", service: "StorageIO", msg: "Disk write latency spike on /dev/sdb (>50ms p99)." },
  { ts: "11:40:18", level: "INFO",  service: "LoadBalancer", msg: "Health check passed for all 6 upstream nodes." },
  { ts: "11:37:55", level: "WARN",  service: "TicketingAPI", msg: "Request queue depth > 200. Auto-scaling triggered." },
];

const LEVEL_COLORS: Record<string, string> = {
  INFO: "text-green-400",
  WARN: "text-yellow-400",
  ERROR: "text-red-400",
};

/* ─── VLAN mock data ─────────────────────────────────────────────────────── */

const VLAN_NAMES  = ["Spatial/AV", "Guest WiFi", "Core DB", "POS/Ticketing", "Security/CCTV"];
const VLAN_DOWN   = [8.5, 4.2, 1.8, 0.5, 3.2];
const VLAN_UP     = [2.1, 1.1, 1.5, 0.2, 5.8];

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SystemHealthPage() {
  /* ── State ───────────────────────────────────────────────────────────── */
  const [isLive, setIsLive] = useState(true);
  const [timeRange, setTimeRange] = useState("24H");
  const [logFilters, setLogFilters] = useState({ INFO: true, WARN: true, ERROR: true });
  const [liveMetrics, setLiveMetrics] = useState<SystemHealthStats | null>(null);

  /* ── Fetch live system metrics from Supabase ────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const stats = await fetchSystemMetricsAction();
        if (stats.metrics.length > 0) {
          setLiveMetrics(stats);
        }
      } catch {
        // keep static reference data on error
      }
    })();
  }, []);

  /* ── Live metric lookup helper ───────────────────────────────────────── */
  const getLiveMetric = (name: string) =>
    liveMetrics?.metrics.find(m => m.name === name) ?? null;

  /* ── Sparkline data (randomised on mount via useMemo) ────────────────── */
  const cpuSpark       = useMemo(() => genSeries(SPARK_COUNT, 25, 65, "flat"), []);
  const dbSpark        = useMemo(() => genSeries(SPARK_COUNT, 1100, 1500, "up"), []);
  const errorSpark     = useMemo(() => genSeries(SPARK_COUNT, 0.02, 0.6, "up"), []);
  const ramSpark       = useMemo(() => genSeries(SPARK_COUNT, 55, 85, "up"), []);
  const diskReadSpark  = useMemo(() => genSeries(SPARK_COUNT, 380, 620, "flat"), []);
  const diskWriteSpark = useMemo(() => genSeries(SPARK_COUNT, 120, 240, "flat"), []);

  /* ── API latency chart data ──────────────────────────────────────────── */
  const apiLabels = useMemo(() => Array.from({ length: 30 }, (_, i) => `${i}m`), []);
  const apiLatencyData = useMemo(() => ({
    labels: apiLabels,
    datasets: [
      {
        label: "Ticketing / POS API",
        data: genSeries(30, 60, 180, "flat"),
        borderColor: "#d4af37",
        backgroundColor: "rgba(212,175,55,0.08)",
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: "Spatial Tracking Stream",
        data: genSeries(30, 5, 40, "flat"),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.08)",
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  }), [apiLabels]);

  /* ── VLAN bandwidth chart data ──────────────────────────────────────── */
  const vlanData = useMemo(() => ({
    labels: VLAN_NAMES,
    datasets: [
      {
        label: "Downlink (Gbps)",
        data: VLAN_DOWN,
        backgroundColor: "rgba(212,175,55,0.6)",
        borderColor: "#d4af37",
        borderWidth: 1,
        borderRadius: 3,
      },
      {
        label: "Uplink (Gbps)",
        data: VLAN_UP,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderColor: "rgba(255,255,255,0.3)",
        borderWidth: 1,
        borderRadius: 3,
      },
    ],
  }), []);

  /* ── Filtered log ────────────────────────────────────────────────────── */
  const filteredLog = ERROR_LOG.filter((e) => logFilters[e.level as keyof typeof logFilters]);

  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-8 pb-8">

      {/* ── Live Controls Bar ─────────────────────────────────────────── */}
      <div className="glass-panel rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 border-[rgba(212,175,55,0.2)]">
        {/* Left: live indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-colors ${
              isLive
                ? "bg-green-500/10 text-green-400 border-green-500/30"
                : "bg-card/40 text-muted-foreground border-border"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
            {isLive ? "Live" : "Paused"}
          </button>

          {/* Time range toggles */}
          <FilterChips
            options={[
              { value: "1H", label: "1H" },
              { value: "24H", label: "24H" },
              { value: "7D", label: "7D" },
            ]}
            value={timeRange}
            onChange={setTimeRange}
          />
        </div>

        {/* Right: force sync */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors uppercase tracking-wider">
          <RefreshCw className="w-3.5 h-3.5" />
          Force Sync
        </button>
      </div>

      {/* ── Live Metrics Status ──────────────────────────────────────── */}
      {liveMetrics && liveMetrics.metrics.length > 0 && (
        <div className="flex items-start gap-3 bg-green-500/[0.06] border border-green-500/20 rounded-lg px-5 py-3">
          <span className="text-green-400 text-sm flex-shrink-0 mt-0.5">&#x2713;</span>
          <p className="text-xs text-gray-400">
            <span className="text-green-400 font-semibold">Live telemetry active.</span>{" "}
            Receiving {liveMetrics.metrics.length} metric(s) from the{" "}
            <span className="font-mono text-gray-300">system_metrics</span> table.
            Last updated: {new Date(liveMetrics.lastUpdated).toLocaleTimeString()}.
          </p>
        </div>
      )}

      {/* ── SLA Uptime Hero Card ──────────────────────────────────────── */}
      <div className="glass-panel rounded-lg p-6 flex flex-col md:flex-row items-center justify-between border-green-500/20 shadow-[0_0_25px_rgba(34,197,94,0.08)]">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.25)]">
            <Server className="w-7 h-7 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Global SLA Uptime</p>
            <h3 className="font-orbitron text-4xl font-bold text-green-400 tracking-wide">99.98%</h3>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Target SLA</p>
            <p className="font-orbitron text-lg text-white font-bold">99.95%</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Downtime MTD</p>
            <p className="font-orbitron text-lg text-white font-bold">8m 38s</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Status</p>
            <span className="text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded border border-green-500/20 font-bold">
              EXCEEDING
            </span>
          </div>
        </div>
      </div>

      {/* ── Core Infrastructure KPI Cards (6) ────────────────────────── */}
      <section>
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider">
          <Server className="w-5 h-5 mr-2" /> Core Infrastructure Telemetry
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* 1 — Cluster CPU Load */}
          {(() => {
            const live = getLiveMetric("cpu_load");
            const val = live ? `${live.value}${live.unit}` : "42%";
            const spark = live?.history?.length ? live.history : cpuSpark;
            return (
              <KpiCard title="Cluster CPU Load" value={val} icon={Server} variant="success" subtitle={live ? "Live from system_metrics" : "8-core / 16-thread cluster avg"}>
                <div className="h-10 mt-2">
                  <Line data={makeSparkData(spark, "#22c55e", "rgba(34,197,94,0.10)")} options={sparkOpts("#22c55e", "rgba(34,197,94,0.10)") as never} />
                </div>
              </KpiCard>
            );
          })()}

          {/* 2 — Active DB Connections */}
          {(() => {
            const live = getLiveMetric("db_connections");
            const val = live ? `${live.value} ${live.unit}` : "1,402 / 2,000";
            const spark = live?.history?.length ? live.history : dbSpark;
            return (
              <KpiCard title="Active DB Connections" value={val} icon={Database} variant="warning" subtitle={live ? "Live from system_metrics" : "Connection pool — high usage"}>
                <div className="h-10 mt-2">
                  <Line data={makeSparkData(spark, "#eab308", "rgba(234,179,8,0.10)")} options={sparkOpts("#eab308", "rgba(234,179,8,0.10)") as never} />
                </div>
              </KpiCard>
            );
          })()}

          {/* 3 — HTTP Error Rate */}
          {(() => {
            const live = getLiveMetric("http_error_rate");
            const val = live ? `${live.value}${live.unit}` : "0.45%";
            const spark = live?.history?.length ? live.history : errorSpark;
            return (
              <KpiCard title="HTTP Error Rate" value={val} icon={Radio} variant="danger" subtitle={live ? "Live from system_metrics" : "Spike detected — last 10 min"}>
                <div className="h-10 mt-2">
                  <Line data={makeSparkData(spark, "#ef4444", "rgba(239,68,68,0.10)")} options={sparkOpts("#ef4444", "rgba(239,68,68,0.10)") as never} />
                </div>
              </KpiCard>
            );
          })()}

          {/* 4 — RAM Memory */}
          {(() => {
            const live = getLiveMetric("ram_usage");
            const val = live ? `${live.value}${live.unit}` : "78%";
            const spark = live?.history?.length ? live.history : ramSpark;
            return (
              <KpiCard title="RAM Memory" value={val} icon={Activity} variant="warning" subtitle={live ? "Live from system_metrics" : "Spatial tracking active — leak risk"}>
                <div className="h-10 mt-2">
                  <Line data={makeSparkData(spark, "#eab308", "rgba(234,179,8,0.10)")} options={sparkOpts("#eab308", "rgba(234,179,8,0.10)") as never} />
                </div>
              </KpiCard>
            );
          })()}

          {/* 5 — Storage / Disk I/O (dual sparkline) */}
          <KpiCard
            title="Storage / Disk I/O"
            value="R 520 · W 185 MB/s"
            icon={HardDrive}
            variant="warning"
            subtitle="Write bottleneck detected"
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest">Read</p>
                <div className="h-10">
                  <Line data={makeSparkData(diskReadSpark, "#3b82f6", "rgba(59,130,246,0.10)")} options={sparkOpts("#3b82f6", "rgba(59,130,246,0.10)") as never} />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest">Write</p>
                <div className="h-10">
                  <Line data={makeSparkData(diskWriteSpark, "#d4af37", "rgba(212,175,55,0.10)")} options={sparkOpts("#d4af37", "rgba(212,175,55,0.10)") as never} />
                </div>
              </div>
            </div>
          </KpiCard>
        </div>
      </section>

      {/* ── API Gateways & VLAN Bandwidth ─────────────────────────────── */}
      <section>
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider mt-2">
          <Wifi className="w-5 h-5 mr-2" /> API Gateways & Network Traffic
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* API Latency Line Chart */}
          <ChartContainer title="Internal API Latency" subtitle="Milliseconds over last 30 min" timeToggle>
            <div className="h-56">
              <Line
                data={apiLatencyData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: "index" as const, intersect: false },
                  plugins: {
                    legend: {
                      display: true,
                      position: "bottom" as const,
                      labels: { color: "#9ca3af", boxWidth: 12, padding: 16, font: { size: 10 } },
                    },
                    tooltip: {
                      backgroundColor: "rgba(0,0,0,0.85)",
                      titleColor: "#d4af37",
                      bodyColor: "#e5e7eb",
                      borderColor: "rgba(212,175,55,0.3)",
                      borderWidth: 1,
                      padding: 10,
                    },
                  },
                  scales: {
                    x: {
                      ticks: { color: "#6b7280", font: { size: 9 } },
                      grid: { color: "rgba(255,255,255,0.04)" },
                    },
                    y: {
                      ticks: { color: "#6b7280", font: { size: 9 } },
                      grid: { color: "rgba(255,255,255,0.04)" },
                    },
                  },
                }}
              />
            </div>
          </ChartContainer>

          {/* VLAN Bandwidth Grouped Bar Chart */}
          <ChartContainer title="VLAN Bandwidth Distribution" subtitle="Gigabits per second" timeToggle>
            <div className="h-56">
              <Bar
                data={vlanData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: "bottom" as const,
                      labels: { color: "#9ca3af", boxWidth: 12, padding: 16, font: { size: 10 } },
                    },
                    tooltip: {
                      backgroundColor: "rgba(0,0,0,0.85)",
                      titleColor: "#d4af37",
                      bodyColor: "#e5e7eb",
                      borderColor: "rgba(212,175,55,0.3)",
                      borderWidth: 1,
                      padding: 10,
                    },
                  },
                  scales: {
                    x: {
                      ticks: { color: "#6b7280", font: { size: 9 } },
                      grid: { color: "rgba(255,255,255,0.04)" },
                    },
                    y: {
                      ticks: { color: "#6b7280", font: { size: 9 } },
                      grid: { color: "rgba(255,255,255,0.04)" },
                    },
                  },
                }}
              />
            </div>
          </ChartContainer>
        </div>
      </section>

      {/* ── Live Error Log (Terminal Style) ────────────────────────────── */}
      <section>
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider">
          <Activity className="w-5 h-5 mr-2" /> Live Error Logs & System Events
        </h3>

        <div className="glass-panel rounded-lg flex flex-col overflow-hidden border-red-500/10">
          {/* Terminal header */}
          <div className="bg-[#020408]/80 border-b border-white/10 p-3 flex justify-between items-center">
            <div className="flex space-x-4 text-xs font-semibold uppercase tracking-widest text-gray-500">
              <span className="w-24">Timestamp</span>
              <span className="w-20">Level</span>
              <span className="w-36">Service</span>
              <span>Message</span>
            </div>

            {/* Severity filter dots */}
            <div className="flex space-x-2 items-center">
              {(["INFO", "WARN", "ERROR"] as const).map((lvl) => {
                const dotColor = { INFO: "bg-green-500", WARN: "bg-yellow-500", ERROR: "bg-red-500" }[lvl];
                const isActive = logFilters[lvl];
                return (
                  <button
                    key={lvl}
                    onClick={() => setLogFilters((f) => ({ ...f, [lvl]: !f[lvl] }))}
                    title={`Toggle ${lvl}`}
                    className={`w-3 h-3 rounded-full transition-opacity ${dotColor} ${isActive ? "opacity-100" : "opacity-20"}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Terminal body */}
          <div className="bg-[#010204] p-4 h-72 overflow-y-auto font-mono text-xs space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {filteredLog.length === 0 && (
              <p className="text-gray-600 text-center py-8">No entries match current filters.</p>
            )}
            {filteredLog.map((e, i) => (
              <div key={i} className="flex space-x-4 text-gray-300 hover:bg-white/5 p-1.5 rounded transition-colors">
                <span className="w-24 text-gray-500 flex-shrink-0">{e.ts}</span>
                <span className={`w-20 font-bold flex-shrink-0 ${LEVEL_COLORS[e.level] ?? "text-gray-400"}`}>
                  [{e.level}]
                </span>
                <span className="w-36 text-[#806b45] flex-shrink-0 truncate">{e.service}</span>
                <span className="flex-1">{e.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

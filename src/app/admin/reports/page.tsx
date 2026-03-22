"use client";

import { useState, useEffect } from "react";
import {
  Library, Wrench, Send, TrendingUp, Users, PieChart,
  Zap, Plus, AlertTriangle, CheckCircle2, Download,
  Clock, Mail,
} from "lucide-react";
import {
  fetchReportDataAction,
  fetchReportRunsAction,
  saveReportRunAction,
  type ReportResult,
} from "../admin-analytics-actions";
import { ToggleSwitch, StatusBadge, DataTable } from "@/components/shared";

// ── Template Library ──────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    label: "Daily Revenue Snapshot",
    desc: "Gross revenue, ticket count, and tier mix for yesterday's financial close.",
    icon: TrendingUp,
    colorScheme: "blue" as const,
    prefill: { metric: "gross_revenue", timeframe: "today", granularity: "daily", format: "exec_pdf" },
  },
  {
    label: "Weekly GX Summary",
    desc: "Guest demographics, tier breakdown, and commitment rates for the last 7 days.",
    icon: Users,
    colorScheme: "purple" as const,
    prefill: { metric: "gx_demographics", timeframe: "last_7_days", granularity: "daily", format: "excel" },
  },
  {
    label: "End-of-Month Exec Deck",
    desc: "Ancillary conversion and full booking data for the month to date.",
    icon: PieChart,
    colorScheme: "gold" as const,
    prefill: { metric: "ancillary_conversion", timeframe: "mtd", granularity: "weekly", format: "exec_pdf" },
  },
];

const TEMPLATE_COLORS = {
  blue: {
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-400",
    border: "hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  purple: {
    iconBg: "bg-purple-500/10",
    iconText: "text-purple-400",
    border: "hover:border-purple-400/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  gold: {
    iconBg: "bg-[#d4af37]/10",
    iconText: "text-[#d4af37]",
    border: "hover:border-[rgba(212,175,55,0.5)] hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]",
    badge: "bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20",
  },
};

const SCHEDULES = [
  { label: "Weekly Finance & Yield",  type: "Exec PDF",       email: "finance@agarthaworld.com",    schedule: "Every Friday at 5:00 PM",  enabled: true  },
  { label: "Monthly Investor Deck",   type: "Exec PDF",       email: "stakeholders@kingspark.com",  schedule: "1st of Month at 8:00 AM",  enabled: true  },
  { label: "Weekly Guest Sentiment",  type: "Excel Workbook", email: "gx-team@agarthaworld.com",    schedule: "Every Monday at 9:00 AM",  enabled: false },
];

// ── Report History (loaded from Supabase report_runs table) ──────────────────

const REPORT_HISTORY_FALLBACK = [
  { id: "rr-001", name: "Daily Revenue Snapshot",  runTime: "2026-03-21 06:00 AM", status: "completed", format: "PDF" },
  { id: "rr-002", name: "Weekly GX Summary",       runTime: "2026-03-20 09:00 AM", status: "completed", format: "Excel" },
  { id: "rr-003", name: "Monthly Investor Deck",   runTime: "2026-03-19 08:00 AM", status: "failed",    format: "PDF" },
  { id: "rr-004", name: "Weekly Finance & Yield",   runTime: "2026-03-14 05:00 PM", status: "completed", format: "PDF" },
  { id: "rr-005", name: "Weekly Guest Sentiment",   runTime: "2026-03-13 09:00 AM", status: "completed", format: "Excel" },
];

const HISTORY_COLUMNS = [
  { key: "name",    label: "Report Name", sortable: true },
  { key: "runTime", label: "Run Time",    sortable: true },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (value: unknown) => (
      <StatusBadge status={value as "completed" | "failed"} />
    ),
  },
  { key: "format",  label: "Format",      sortable: false },
  {
    key: "id",
    label: "Action",
    render: (_value: unknown, row: Record<string, unknown>) => (
      <button
        disabled={row.status === "failed"}
        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#d4af37] border border-[#d4af37]/30 px-3 py-1 rounded hover:bg-[#d4af37]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Download className="w-3 h-3" /> Download
      </button>
    ),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [metric,      setMetric]      = useState("gross_revenue");
  const [timeframe,   setTimeframe]   = useState("last_7_days");
  const [granularity, setGranularity] = useState("daily");
  const [format,      setFormat]      = useState("exec_pdf");
  const [generating,  setGenerating]  = useState(false);
  const [result,      setResult]      = useState<ReportResult | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean[]>(SCHEDULES.map((s) => s.enabled));
  const [reportHistory, setReportHistory] = useState<Record<string, unknown>[]>(REPORT_HISTORY_FALLBACK);

  // Load report run history from Supabase on mount
  useEffect(() => {
    (async () => {
      try {
        const runs = await fetchReportRunsAction();
        if (runs && runs.length > 0) {
          setReportHistory(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            runs.map((r: any) => ({
              id: r.id,
              name: r.report_name ?? r.metric,
              runTime: r.completed_at
                ? new Date(r.completed_at).toLocaleString()
                : r.created_at
                  ? new Date(r.created_at).toLocaleString()
                  : "—",
              status: r.status ?? "completed",
              format: r.export_format ?? "CSV",
            }))
          );
        }
      } catch {
        // keep fallback data on error
      }
    })();
  }, []);

  function applyTemplate(prefill: typeof TEMPLATES[0]["prefill"]) {
    setMetric(prefill.metric);
    setTimeframe(prefill.timeframe);
    setGranularity(prefill.granularity);
    setFormat(prefill.format);
    setResult(null);
    setError(null);
    document.getElementById("report-builder")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleGenerate() {
    setGenerating(true);
    setResult(null);
    setError(null);
    try {
      const data = await fetchReportDataAction(metric, timeframe);
      setResult(data);

      // Persist the report run to Supabase
      const metricLabels: Record<string, string> = {
        gross_revenue: "Gross Revenue",
        gx_demographics: "GX Demographics",
        ancillary_conversion: "Ancillary Conversion",
        nps_summaries: "NPS Summaries",
      };
      await saveReportRunAction({
        report_name: metricLabels[metric] ?? metric,
        metric,
        timeframe,
        granularity,
        export_format: format,
        row_count: data.rows.length,
        status: "completed",
      });

      // Refresh history after saving
      const runs = await fetchReportRunsAction();
      if (runs && runs.length > 0) {
        setReportHistory(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          runs.map((r: any) => ({
            id: r.id,
            name: r.report_name ?? r.metric,
            runTime: r.completed_at
              ? new Date(r.completed_at).toLocaleString()
              : r.created_at
                ? new Date(r.created_at).toLocaleString()
                : "—",
            status: r.status ?? "completed",
            format: r.export_format ?? "CSV",
          }))
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report.");

      // Also persist the failed run
      try {
        const metricLabels: Record<string, string> = {
          gross_revenue: "Gross Revenue",
          gx_demographics: "GX Demographics",
          ancillary_conversion: "Ancillary Conversion",
          nps_summaries: "NPS Summaries",
        };
        await saveReportRunAction({
          report_name: metricLabels[metric] ?? metric,
          metric,
          timeframe,
          granularity,
          export_format: format,
          row_count: 0,
          status: "failed",
        });
      } catch {
        // ignore persistence errors for failed runs
      }
    } finally {
      setGenerating(false);
    }
  }

  function handleExport() {
    if (!result || result.rows.length === 0) return;
    const headers = Object.keys(result.rows[0]).join(",");
    const rows = result.rows.map((r) => Object.values(r).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.metric}_${timeframe}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-10 pb-10">

      {/* ── Template Library ──────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider">
            <Library className="w-5 h-5 mr-2" /> Report Template Library
          </h3>
          <button
            disabled
            title="Template creation requires backend integration"
            className="text-xs font-semibold uppercase tracking-widest text-gray-500 border border-white/10 px-4 py-2 rounded flex items-center cursor-not-allowed"
          >
            <Plus className="w-3 h-3 mr-1.5" /> Create New Template
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Click a template to pre-fill the custom report builder below.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            const colors = TEMPLATE_COLORS[t.colorScheme];
            return (
              <button
                key={t.label}
                onClick={() => applyTemplate(t.prefill)}
                className={`glass-panel rounded-lg p-5 flex flex-col items-start hover:bg-white/5 transition-all duration-300 text-left group hover:scale-[1.02] ${colors.border}`}
              >
                {/* Icon with colored background */}
                <div className={`w-12 h-12 rounded-xl ${colors.iconBg} border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${colors.iconText}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-white font-bold tracking-wide mb-1.5">{t.label}</h4>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{t.desc}</p>

                {/* Format badge */}
                <span className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${colors.badge}`}>
                  {t.prefill.format === "exec_pdf" ? "Exec PDF" : t.prefill.format === "excel" ? "Excel" : t.prefill.format}
                </span>

                <span className="mt-auto pt-3 text-[10px] text-[#d4af37] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Click to pre-fill builder &rarr;
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Custom Report Builder ─────────────────────────────────────── */}
      <section id="report-builder">
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider">
          <Wrench className="w-5 h-5 mr-2" /> Custom Report Builder (On-Demand)
        </h3>

        {/* Info banner */}
        <div className="mb-4 flex items-center gap-3 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300/80">
            Custom queries may take up to 30 seconds to process depending on data volume and selected timeframe.
          </p>
        </div>

        <div className="glass-panel rounded-lg p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                label: "Primary Metric", id: "metric", value: metric, setter: setMetric,
                opts: [
                  ["gross_revenue",       "Gross Revenue"],
                  ["gx_demographics",     "GX Demographics"],
                  ["ancillary_conversion","Ancillary Conversion"],
                  ["nps_summaries",       "NPS Summaries"],
                ],
              },
              {
                label: "Timeframe", id: "timeframe", value: timeframe, setter: setTimeframe,
                opts: [
                  ["today",        "Today"],
                  ["last_7_days",  "Last 7 Days"],
                  ["mtd",          "Month to Date"],
                  ["ytd",          "Year to Date"],
                ],
              },
              {
                label: "Data Granularity", id: "granularity", value: granularity, setter: setGranularity,
                opts: [["daily", "Daily"], ["weekly", "Weekly"], ["raw", "Raw"]],
              },
              {
                label: "Export Format", id: "format", value: format, setter: setFormat,
                opts: [["exec_pdf", "Exec PDF"], [".csv", ".CSV Data"], ["excel", "Excel Workbook"]],
              },
            ].map((field) => (
              <div key={field.id} className="space-y-2">
                <label htmlFor={field.id} className="text-xs text-gray-400 uppercase tracking-widest font-semibold block">
                  {field.label}
                </label>
                <select
                  id={field.id}
                  name={field.id}
                  value={field.value}
                  onChange={(e) => { field.setter(e.target.value); setResult(null); setError(null); }}
                  className="w-full bg-[#020408] border border-white/10 text-sm text-gray-200 rounded-md px-4 py-2.5 focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.3)] transition-all cursor-pointer"
                  style={{ colorScheme: "dark" }}
                >
                  {field.opts.map(([val, lab]) => (
                    <option key={val} value={val}>{lab}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Result display */}
          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-500/[0.06] border border-red-500/30 rounded-lg p-4">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {result && (
            <div className="mb-6 space-y-4">
              {/* Summary banner */}
              <div className="flex items-start gap-3 bg-[rgba(212,175,55,0.06)] border border-[rgba(212,175,55,0.2)] rounded-lg p-4">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-300 font-medium mb-1">Report Summary</p>
                  <p className="text-xs text-gray-400">{result.summary}</p>
                </div>
                {result.rows.length > 0 && (
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 text-xs text-[#d4af37] border border-[rgba(212,175,55,0.3)] px-3 py-1.5 rounded hover:bg-[rgba(212,175,55,0.1)] transition flex-shrink-0"
                  >
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                )}
              </div>

              {/* Data table preview */}
              {result.rows.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#010204] border-b border-white/10 text-gray-500 uppercase tracking-wider">
                      <tr>
                        {Object.keys(result.rows[0]).map((col) => (
                          <th key={col} className="px-4 py-3 font-semibold">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {result.rows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-4 py-2.5 text-gray-300 font-mono">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.rows.length > 10 && (
                    <p className="text-[10px] text-gray-600 text-center py-2">
                      Showing 10 of {result.rows.length} rows — use Export CSV for full data
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-white/10 pt-6">
            <p className="text-xs text-gray-500 italic flex items-center gap-1.5">
              <span className="text-[#d4af37]">&#8505;</span>
              Data sourced live from Supabase. NPS requires survey integration.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold px-6 py-2.5 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all flex items-center text-sm uppercase tracking-widest disabled:opacity-60"
            >
              <Zap className="w-4 h-4 mr-2" />
              {generating ? "Querying\u2026" : "Generate Report"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Automated Schedules ───────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider">
            <Send className="w-5 h-5 mr-2" /> Automated Delivery (Scheduled)
          </h3>
          <button
            disabled
            title="Schedule creation requires backend integration"
            className="text-xs font-semibold uppercase tracking-widest text-gray-500 border border-white/10 px-4 py-2 rounded flex items-center cursor-not-allowed"
          >
            <Plus className="w-3 h-3 mr-1.5" /> Create New Schedule
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-[#d4af37]" />
          Toggles are session-scoped only — schedule persistence requires a cron/delivery backend.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SCHEDULES.map((s, i) => (
            <div
              key={s.label}
              className={`glass-panel rounded-lg relative overflow-hidden group transition-all duration-300 hover:border-[rgba(212,175,55,0.3)] ${!scheduleEnabled[i] ? "opacity-60 hover:opacity-100" : ""}`}
            >
              {/* Status bar - green gradient along the top */}
              <div
                className={`h-1 w-full transition-all duration-500 ${
                  scheduleEnabled[i]
                    ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-300"
                    : "bg-gray-700"
                }`}
              />

              <div className="p-5 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-[#020408] border border-white/10 flex items-center justify-center text-[#d4af37]">
                      <PieChart className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white tracking-wide">{s.label}</h4>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{s.type}</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={scheduleEnabled[i]}
                    onChange={() =>
                      setScheduleEnabled((prev) =>
                        prev.map((v, j) => (j === i ? !v : v))
                      )
                    }
                  />
                </div>

                {/* Email recipient */}
                <div className="space-y-2.5 mt-auto">
                  <div className="flex items-center text-xs text-gray-400 bg-[#020408]/50 p-2.5 rounded-lg border border-white/5">
                    <Mail className="w-3.5 h-3.5 mr-2 text-[#806b45] flex-shrink-0" />
                    <span className="truncate">{s.email}</span>
                  </div>

                  {/* Schedule display */}
                  <div className="flex items-center text-xs text-gray-400 bg-[#020408]/50 p-2.5 rounded-lg border border-white/5">
                    <Clock className="w-3.5 h-3.5 mr-2 text-[#806b45] flex-shrink-0" />
                    <span>{s.schedule}</span>
                  </div>
                </div>

                {/* Status indicator at bottom */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <StatusBadge status={scheduleEnabled[i] ? "active" : "offline"} label={scheduleEnabled[i] ? "Active" : "Paused"} />
                  <span className="text-[10px] text-gray-600 uppercase tracking-widest">
                    {scheduleEnabled[i] ? "Next run scheduled" : "Delivery paused"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Report Run History ─────────────────────────────────────── */}
      <section className="border-t border-white/10 pt-8">
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider">
          <CheckCircle2 className="w-5 h-5 mr-2" /> Report Run History
        </h3>
        <DataTable
          columns={HISTORY_COLUMNS}
          data={reportHistory}
          searchable
          searchPlaceholder="Search report history..."
          pageSize={10}
        />
      </section>
    </div>
  );
}

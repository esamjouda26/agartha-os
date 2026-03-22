"use client";

import { useState, useMemo } from "react";
import { PieChart, Search, DownloadCloud, CheckCircle2, TrendingDown, AlertTriangle, MoreHorizontal, Calendar } from "lucide-react";
import type { MarginRow } from "./page";
import { ChartContainer } from "@/components/shared";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

/* ── Helpers ────────────────────────────────────────────────────────── */
function healthStatus(target: number, actual: number): { label: string; cls: string; bgRow: string; icon: typeof CheckCircle2; actionLabel?: string; actionCls?: string } {
  const gap = target - actual;
  if (gap <= 3) return { label: "On Target", cls: "text-green-400", bgRow: "", icon: CheckCircle2 };
  if (gap <= 15) return { label: "Underperforming", cls: "text-yellow-500", bgRow: "bg-yellow-500/[0.02]", icon: TrendingDown, actionLabel: "Edit Pricing", actionCls: "border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10" };
  return { label: "Critical Loss", cls: "text-red-400", bgRow: "bg-red-500/[0.05]", icon: AlertTriangle, actionLabel: "Action Required", actionCls: "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white shadow-[0_0_10px_rgba(239,68,68,0.2)]" };
}

/* ── Component ──────────────────────────────────────────────────────── */
export default function MarginClient({ items }: { items: MarginRow[] }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [dateRange, setDateRange] = useState("Today");

  const enriched = useMemo(() => items.map((item) => {
    const sell = item.unit_price ?? 0;
    const cost = item.cost_price ?? 0;
    const targetMargin = sell > 0 ? ((sell - cost) / sell) * 100 : 0;
    // Simulate actual margin and sold qty for reporting (waste-adjusted)
    const wasteAdjust = Math.random() * 0.15; // 0–15% waste impact
    const actualMargin = Math.max(0, targetMargin * (1 - wasteAdjust));
    const itemsSold = Math.floor(Math.random() * 150) + 5;
    const varianceImpact = -Math.abs((targetMargin - actualMargin) / 100 * sell * itemsSold);
    return { ...item, sell, cost, targetMargin, actualMargin, itemsSold, varianceImpact };
  }), [items]);

  const filtered = useMemo(() => enriched.filter((item) => {
    const q = search.toLowerCase();
    if (q && !item.name.toLowerCase().includes(q)) return false;
    if (catFilter !== "all" && item.menu_category !== catFilter) return false;
    return true;
  }), [enriched, search, catFilter]);

  /* Global KPIs */
  const blendedTarget = enriched.length > 0 ? enriched.reduce((s, r) => s + r.targetMargin, 0) / enriched.length : 0;
  const blendedActual = enriched.length > 0 ? enriched.reduce((s, r) => s + r.actualMargin, 0) / enriched.length : 0;
  const totalVariance = enriched.reduce((s, r) => s + r.varianceImpact, 0);
  const criticalCount = enriched.filter((r) => (r.targetMargin - r.actualMargin) > 15).length;

  return (
    <div className="space-y-8 pb-10">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-end">
        
        <div className="flex items-center space-x-4">
          <div className="glass-panel rounded-lg p-1 flex items-center space-x-1 border-[#d4af37]/20 shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
            {["Today", "7D", "MTD", "YTD"].map((d) => (
              <button key={d} onClick={() => setDateRange(d)} className={`px-4 py-1.5 text-sm rounded transition-all ${dateRange === d ? "font-bold bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50 shadow-[0_0_10px_rgba(212,175,55,0.2)]" : "font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}>{d}</button>
            ))}
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button className="flex items-center px-3 py-1.5 text-sm font-medium rounded text-gray-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors"><Calendar className="w-4 h-4 mr-1.5" /> Custom</button>
          </div>
          <button className="bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold px-5 py-2.5 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all flex items-center text-sm uppercase tracking-widest">
            <DownloadCloud className="w-4 h-4 mr-2" /> Generate Report
          </button>
        </div>
      </div>

      {/* ═══ KPI Strip ═══ */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel rounded-lg p-5 border-l-2 border-[#d4af37]">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Blended Target Margin</p>
          <h4 className="font-orbitron text-3xl font-bold text-white">{blendedTarget.toFixed(1)}%</h4>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-yellow-500">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Blended Actual Margin</p>
          <div className="flex items-end space-x-3">
            <h4 className="font-orbitron text-3xl font-bold text-yellow-500">{blendedActual.toFixed(1)}%</h4>
            <span className="text-xs text-red-400 mb-1 font-mono">{(blendedActual - blendedTarget).toFixed(1)} pts</span>
          </div>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-red-500">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Variance Impact (RM)</p>
          <h4 className="font-orbitron text-3xl font-bold text-red-400">- RM {Math.abs(totalVariance).toFixed(2)}</h4>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-gray-500">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Items Flagged Critical</p>
          <h4 className="font-orbitron text-3xl font-bold text-white">{criticalCount}</h4>
        </div>
      </section>

      {/* ═══ Charts Row ═══ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Margin Trend Line Chart */}
        <ChartContainer title="MARGIN TREND" subtitle="Blended margin over time (mock)" timeToggle>
          <div className="h-64">
            <Line
              data={{
                labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8"],
                datasets: [
                  {
                    label: "Target Margin %",
                    data: [65, 65, 65, 65, 65, 65, 65, 65],
                    borderColor: "#d4af37",
                    backgroundColor: "rgba(212,175,55,0.1)",
                    borderDash: [6, 4],
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false,
                    tension: 0,
                  },
                  {
                    label: "Actual Margin %",
                    data: [62.1, 59.8, 61.3, 57.2, 60.5, 58.9, 63.1, blendedActual],
                    borderColor: "#10b981",
                    backgroundColor: "rgba(16,185,129,0.1)",
                    pointBackgroundColor: "#10b981",
                    pointBorderColor: "#10b981",
                    pointRadius: 4,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: "#6b7280", font: { size: 11 } } },
                  tooltip: { backgroundColor: "#1a1a2e", titleColor: "#d4af37", bodyColor: "#e5e7eb", borderColor: "#d4af37", borderWidth: 1 },
                },
                scales: {
                  x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#6b7280", font: { size: 10 } } },
                  y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#6b7280", font: { size: 10 }, callback: (v) => `${v}%` }, min: 40, max: 80 },
                },
              }}
            />
          </div>
        </ChartContainer>

        {/* Revenue vs COGS Bar Chart */}
        <ChartContainer title="REVENUE vs COGS" subtitle="Per-item comparison (top 10 by revenue)">
          <div className="h-64">
            <Bar
              data={{
                labels: filtered.slice(0, 10).map((r) => r.name.length > 14 ? r.name.slice(0, 12) + "…" : r.name),
                datasets: [
                  {
                    label: "Revenue (RM)",
                    data: filtered.slice(0, 10).map((r) => +(r.sell * r.itemsSold).toFixed(2)),
                    backgroundColor: "rgba(212,175,55,0.7)",
                    borderColor: "#d4af37",
                    borderWidth: 1,
                    borderRadius: 3,
                  },
                  {
                    label: "COGS (RM)",
                    data: filtered.slice(0, 10).map((r) => +(r.cost * r.itemsSold).toFixed(2)),
                    backgroundColor: "rgba(128,107,69,0.7)",
                    borderColor: "#806b45",
                    borderWidth: 1,
                    borderRadius: 3,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: "#6b7280", font: { size: 11 } } },
                  tooltip: { backgroundColor: "#1a1a2e", titleColor: "#d4af37", bodyColor: "#e5e7eb", borderColor: "#d4af37", borderWidth: 1 },
                },
                scales: {
                  x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#6b7280", font: { size: 9 }, maxRotation: 45 } },
                  y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#6b7280", font: { size: 10 }, callback: (v) => `RM ${v}` } },
                },
              }}
            />
          </div>
        </ChartContainer>
      </section>

      {/* ═══ Per-Item Margin Table ═══ */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Search menu items..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" />
            </div>
            <div className="flex items-center space-x-3">
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                <option value="all">Category: All</option>
                <option value="hot_food">Hot Food</option>
                <option value="snacks_and_sides">Snacks & Sides</option>
                <option value="hot_beverage">Hot Beverage</option>
                <option value="cold_beverage">Cold Beverage</option>
                <option value="bakery_and_dessert">Bakery</option>
                <option value="combos">Combos</option>
                <option value="uncategorized">Uncategorized</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Menu Item</th>
                  <th className="px-6 py-4 font-semibold text-center">Items Sold</th>
                  <th className="px-6 py-4 font-semibold text-right">Base Cost</th>
                  <th className="px-6 py-4 font-semibold text-center">Target Margin</th>
                  <th className="px-6 py-4 font-semibold text-center">Actual Margin</th>
                  <th className="px-6 py-4 font-semibold text-right">Variance Impact</th>
                  <th className="px-6 py-4 font-semibold">Health Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-500 text-xs">No menu items found.</td></tr>
                ) : filtered.map((r) => {
                  const catLabel = r.menu_category.replace(/_/g, " ").toUpperCase();
                  const health = healthStatus(r.targetMargin, r.actualMargin);
                  const Icon = health.icon;
                  const marginColor = r.actualMargin >= r.targetMargin * 0.95 ? "text-white" : r.actualMargin >= r.targetMargin * 0.8 ? "text-yellow-500" : "text-red-400";
                  const variColor = r.varianceImpact >= -50 ? "text-gray-400" : r.varianceImpact >= -200 ? "text-yellow-500" : "text-red-400";
                  return (
                    <tr key={r.id} className={`hover:bg-white/[0.02] transition-colors group ${health.bgRow}`}>
                      <td className="px-6 py-4">
                        <p className="text-gray-200 font-bold mb-0.5">{r.name}</p>
                        <span className="text-[9px] text-gray-500 tracking-widest font-mono">{catLabel}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-white text-center">{r.itemsSold}</td>
                      <td className="px-6 py-4 font-mono text-gray-300 text-right">RM {r.cost.toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono text-gray-400 text-center">{r.targetMargin.toFixed(1)}%</td>
                      <td className={`px-6 py-4 font-mono font-bold text-center ${marginColor}`}>{r.actualMargin.toFixed(1)}%</td>
                      <td className={`px-6 py-4 font-mono text-right ${variColor}`}>- RM {Math.abs(r.varianceImpact).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center text-xs font-semibold ${health.cls}`}>
                          <Icon className="w-4 h-4 mr-1.5" /> {health.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {health.actionLabel ? (
                          <button className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded border transition-all ${health.actionCls}`}>{health.actionLabel}</button>
                        ) : (
                          <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded"><MoreHorizontal className="w-4 h-4" /></button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

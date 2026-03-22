"use client";

import { useState, useMemo } from "react";
import { Truck, Search, FileBarChart2, Calendar, CheckCircle2, AlertCircle, AlertTriangle, FileText } from "lucide-react";
import type { SupplierPerfRow } from "./page";
import { ChartContainer } from "@/components/shared";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/* ── Enriched type (synthetic yield data) ───────────────────────────── */
interface EnrichedSupplier {
  id: string;
  name: string;
  item: string;
  volumeReceived: string;
  rejectionWaste: string;
  yield: number;
  status: "optimal" | "warning" | "critical";
}

const STATUS_STYLE: Record<string, { cls: string; icon: typeof CheckCircle2; label: string }> = {
  optimal:  { cls: "text-green-400 bg-green-400/10 border-green-500/20", icon: CheckCircle2, label: "Optimal (>95%)" },
  warning:  { cls: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20", icon: AlertCircle, label: "Monitor (85-95%)" },
  critical: { cls: "text-red-400 bg-red-400/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]", icon: AlertTriangle, label: "Critical (<85%)" },
};

/* ── Synthetic item mapping ─────────────────────────────────────────── */
const ITEM_MAP: Record<string, { item: string; vol: string; unit: string }> = {
  food:        { item: "Fresh Produce", vol: "50 kg", unit: "kg" },
  beverage:    { item: "Beverage Supplies", vol: "200 units", unit: "units" },
  merchandise: { item: "Retail Items", vol: "500 units", unit: "units" },
  equipment:   { item: "Kitchen Equipment", vol: "10 units", unit: "units" },
  cleaning:    { item: "Cleaning Supplies", vol: "100 units", unit: "units" },
};

/* ── Component ──────────────────────────────────────────────────────── */
export default function SupplierPerfClient({ suppliers }: { suppliers: SupplierPerfRow[] }) {
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("Today");

  // Create synthetic yield data based on supplier ratings
  const enriched: EnrichedSupplier[] = useMemo(() => suppliers.map((s) => {
    const rating = s.rating ?? 4.0;
    // Higher-rated suppliers get better yield
    const baseYield = 80 + (rating / 5) * 18 + (Math.random() * 4 - 2);
    const yieldPct = Math.min(100, Math.max(50, baseYield));
    const mapping = ITEM_MAP[s.category] ?? ITEM_MAP.food;
    const vol = parseInt(mapping.vol) || 100;
    const rejected = Math.round(vol * (1 - yieldPct / 100) * 10) / 10;

    return {
      id: s.id,
      name: s.name,
      item: mapping.item,
      volumeReceived: mapping.vol,
      rejectionWaste: `${rejected} ${mapping.unit}`,
      yield: Math.round(yieldPct * 10) / 10,
      status: yieldPct >= 95 ? "optimal" as const : yieldPct >= 85 ? "warning" as const : "critical" as const,
    };
  }), [suppliers]);

  const filtered = useMemo(() => enriched.filter((s) => {
    const q = search.toLowerCase();
    if (q && !s.name.toLowerCase().includes(q) && !s.item.toLowerCase().includes(q)) return false;
    if (supplierFilter !== "all" && s.id !== supplierFilter) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  }), [enriched, search, supplierFilter, statusFilter]);

  /* KPIs */
  const globalYield = enriched.length > 0 ? enriched.reduce((s, r) => s + r.yield, 0) / enriched.length : 0;
  const optimalCount = enriched.filter((s) => s.status === "optimal").length;
  const criticalCount = enriched.filter((s) => s.status === "critical").length;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-end">
        
        <div className="flex items-center space-x-4">
          <div className="glass-panel rounded-lg p-1 flex items-center space-x-1 border-[#d4af37]/20 shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
            {["Today", "7D", "MTD", "YTD"].map((d) => (
              <button key={d} onClick={() => setDateRange(d)} className={`px-4 py-1.5 text-sm rounded transition-all ${dateRange === d ? "font-bold bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50" : "font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}>{d}</button>
            ))}
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button className="flex items-center px-3 py-1.5 text-sm font-medium rounded text-gray-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors"><Calendar className="w-4 h-4 mr-1.5" /> Custom</button>
          </div>
          <button className="bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold px-5 py-2.5 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all flex items-center text-sm uppercase tracking-widest">
            <FileBarChart2 className="w-4 h-4 mr-2" /> Generate Report
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-lg p-5 border-l-2 border-[#d4af37]">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Global Usable Yield</p>
          <h4 className="font-orbitron text-3xl font-bold text-white">{globalYield.toFixed(1)}%</h4>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-green-500">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Optimal Suppliers</p>
          <h4 className="font-orbitron text-3xl font-bold text-green-400">{optimalCount}</h4>
          <p className="text-[10px] text-gray-500 mt-1">&gt; 95% Yield Maintained</p>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-red-500">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Critical Vendors</p>
          <h4 className="font-orbitron text-3xl font-bold text-red-400">{criticalCount}</h4>
          <p className="text-[10px] text-gray-500 mt-1">&lt; 85% Yield Detected</p>
        </div>
      </section>

      {/* Supplier Yield Bar Chart */}
      <section>
        <ChartContainer title="SUPPLIER YIELD SCORES" subtitle="Usable yield % by supplier (color-coded by status)">
          <div style={{ height: Math.max(280, enriched.length * 36) }}>
            <Bar
              data={{
                labels: enriched.map((s) => s.name.length > 20 ? s.name.slice(0, 18) + "…" : s.name),
                datasets: [{
                  label: "Usable Yield %",
                  data: enriched.map((s) => s.yield),
                  backgroundColor: enriched.map((s) =>
                    s.status === "optimal" ? "rgba(16,185,129,0.75)" :
                    s.status === "warning" ? "rgba(212,175,55,0.75)" :
                    "rgba(239,68,68,0.75)"
                  ),
                  borderColor: enriched.map((s) =>
                    s.status === "optimal" ? "#10b981" :
                    s.status === "warning" ? "#d4af37" :
                    "#ef4444"
                  ),
                  borderWidth: 1,
                  borderRadius: 3,
                }],
              }}
              options={{
                indexAxis: "y" as const,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "#1a1a2e",
                    titleColor: "#d4af37",
                    bodyColor: "#e5e7eb",
                    borderColor: "#d4af37",
                    borderWidth: 1,
                    callbacks: { label: (ctx) => ` Yield: ${ctx.parsed.x}%` },
                  },
                },
                scales: {
                  x: {
                    grid: { color: "rgba(255,255,255,0.05)" },
                    ticks: { color: "#6b7280", font: { size: 10 }, callback: (v) => `${v}%` },
                    min: 50,
                    max: 100,
                  },
                  y: {
                    grid: { display: false },
                    ticks: { color: "#6b7280", font: { size: 10 } },
                  },
                },
              }}
            />
          </div>
        </ChartContainer>
      </section>

      {/* Data Table */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Search supplier or item..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" />
            </div>
            <div className="flex items-center space-x-3">
              <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer w-48">
                <option value="all">Supplier: All</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer w-48">
                <option value="all">Status: Show All</option>
                <option value="optimal">Optimal (&gt;95%)</option>
                <option value="warning">Warning (85-95%)</option>
                <option value="critical">Critical Only (&lt;85%)</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Supplier Name</th>
                  <th className="px-6 py-4 font-semibold">Item Supplied</th>
                  <th className="px-6 py-4 font-semibold">Volume Received</th>
                  <th className="px-6 py-4 font-semibold">Rejection / Waste</th>
                  <th className="px-6 py-4 font-semibold text-center">Usable Yield %</th>
                  <th className="px-6 py-4 font-semibold">Quality Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500 text-xs">No supplier data found.</td></tr>
                ) : filtered.map((r) => {
                  const style = STATUS_STYLE[r.status];
                  const Icon = style.icon;
                  const yieldColor = r.status === "optimal" ? "text-white" : r.status === "warning" ? "text-yellow-500" : "text-red-400";
                  const rejColor = r.status === "critical" ? "text-red-400 font-bold" : "text-gray-400";
                  return (
                    <tr key={r.id} className={`hover:bg-white/[0.02] transition-colors group ${r.status === "warning" ? "bg-yellow-500/[0.02]" : r.status === "critical" ? "bg-red-500/[0.05]" : ""}`}>
                      <td className="px-6 py-4">
                        <p className="text-gray-200 font-bold mb-0.5">{r.name}</p>
                        <span className="text-[9px] text-gray-500 font-mono">ID: {r.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{r.item}</td>
                      <td className="px-6 py-4 font-mono text-gray-400">{r.volumeReceived}</td>
                      <td className={`px-6 py-4 font-mono ${rejColor}`}>{r.rejectionWaste}</td>
                      <td className={`px-6 py-4 font-mono font-bold text-center ${yieldColor}`}>{r.yield}%</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center text-xs px-2 py-1 rounded border w-fit ${style.cls}`}>
                          <Icon className="w-3.5 h-3.5 mr-1.5" /> {style.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {r.status === "critical" ? (
                          <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded bg-[#020408] border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">Review Vendor</button>
                        ) : (
                          <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded" title="View PO History"><FileText className="w-4 h-4" /></button>
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

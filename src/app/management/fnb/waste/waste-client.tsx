"use client";

import { useState, useMemo } from "react";
import { Trash2, Search, DownloadCloud, Calendar, Clock, AlertTriangle, Droplet, MoreHorizontal } from "lucide-react";
import type { WasteRow } from "./page";

/* ── Reason styling ─────────────────────────────────────────────────── */
const REASON_MAP: Record<string, { icon: typeof Clock; cls: string; label: string }> = {
  expired:     { icon: Clock, cls: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20", label: "Expired / EOD" },
  supplier:    { icon: AlertTriangle, cls: "text-red-400 bg-red-400/10 border-red-500/20", label: "Poor Supplier Quality" },
  dropped:     { icon: Droplet, cls: "text-orange-400 bg-orange-400/10 border-orange-500/20", label: "Dropped / Spilled" },
  prep_error:  { icon: AlertTriangle, cls: "text-purple-400 bg-purple-400/10 border-purple-500/20", label: "Prep Error" },
};

function reasonBadge(reason: string) {
  const r = REASON_MAP[reason] ?? { icon: Clock, cls: "text-gray-400 bg-white/5 border-white/10", label: reason };
  const Icon = r.icon;
  return (
    <span className={`flex items-center px-2 py-1 rounded border w-fit text-xs ${r.cls}`}>
      <Icon className="w-3 h-3 mr-1.5" /> {r.label}
    </span>
  );
}

/* ── Synthetic fallback data ────────────────────────────────────────── */
const FALLBACK: WasteRow[] = [
  { id: "1", item_name: "Lays Classic Chips 50g", category: "Retail", location: "Vending: Zone B-2", supplier_name: "SnackCo Distributors", reason: "expired", quantity: 12, unit: "units", cost_impact: 18.00, logged_at: new Date().toISOString() },
  { id: "2", item_name: "Fresh Strawberries", category: "Raw Ingredient", location: "Café Kitchen", supplier_name: "FreshFarms Local", reason: "supplier", quantity: 2.5, unit: "kg", cost_impact: 45.00, logged_at: new Date().toISOString() },
  { id: "3", item_name: "Agartha Blue Lemonade", category: "Prepared Item", location: "Café POS 1", supplier_name: null, reason: "dropped", quantity: 1, unit: "unit", cost_impact: 2.45, logged_at: new Date(Date.now() - 86400000).toISOString() },
];

/* ── Component ──────────────────────────────────────────────────────── */
export default function WasteClient({ wasteLogs }: { wasteLogs: WasteRow[] }) {
  const logs = wasteLogs.length > 0 ? wasteLogs : FALLBACK;
  const [search, setSearch] = useState("");
  const [locFilter, setLocFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [dateRange, setDateRange] = useState("Today");

  const filtered = useMemo(() => logs.filter((w) => {
    const q = search.toLowerCase();
    if (q && !w.item_name.toLowerCase().includes(q) && !(w.supplier_name ?? "").toLowerCase().includes(q)) return false;
    if (locFilter !== "all" && !(w.location ?? "").toLowerCase().includes(locFilter)) return false;
    if (catFilter !== "all" && w.category !== catFilter) return false;
    if (reasonFilter !== "all" && w.reason !== reasonFilter) return false;
    return true;
  }), [logs, search, locFilter, catFilter, reasonFilter]);

  /* KPIs */
  const totalLoss = logs.reduce((s, w) => s + w.cost_impact, 0);
  const reasonCounts: Record<string, number> = {};
  logs.forEach((w) => { reasonCounts[w.reason] = (reasonCounts[w.reason] ?? 0) + w.cost_impact; });
  const topReason = Object.entries(reasonCounts).sort(([, a], [, b]) => b - a)[0];
  const topReasonPct = totalLoss > 0 && topReason ? Math.round((topReason[1] / totalLoss) * 100) : 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-cinzel text-xl text-[#d4af37] flex items-center tracking-wider">
            <Trash2 className="w-6 h-6 mr-3" /> Waste &amp; Prep Reports
          </h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Operational Loss &amp; Vendor Quality Tracking</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="glass-panel rounded-lg p-1 flex items-center space-x-1 border-[#d4af37]/20 shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
            {["Today", "7D", "MTD", "YTD"].map((d) => (
              <button key={d} onClick={() => setDateRange(d)} className={`px-4 py-1.5 text-sm rounded transition-all ${dateRange === d ? "font-bold bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50" : "font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}>{d}</button>
            ))}
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button className="flex items-center px-3 py-1.5 text-sm font-medium rounded text-gray-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors"><Calendar className="w-4 h-4 mr-1.5" /> Custom</button>
          </div>
          <button className="bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold px-5 py-2.5 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all flex items-center text-sm uppercase tracking-widest">
            <DownloadCloud className="w-4 h-4 mr-2" /> Generate Report
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-lg p-5 border-l-2 border-red-500">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Loss Impact</p>
          <h4 className="font-orbitron text-3xl font-bold text-red-400">RM {totalLoss.toFixed(2)}</h4>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-yellow-500">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Top Loss Reason</p>
          <h4 className="font-orbitron text-xl font-bold text-white mt-2">{REASON_MAP[topReason?.[0] ?? ""]?.label ?? topReason?.[0] ?? "—"}</h4>
          <p className="text-[10px] text-gray-500 mt-1">{topReasonPct}% of total logged waste</p>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-blue-500">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Items Logged</p>
          <h4 className="font-orbitron text-3xl font-bold text-white">{logs.length}</h4>
        </div>
      </section>

      {/* Data Table */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Search item or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" />
            </div>
            <div className="flex items-center space-x-3">
              <select value={locFilter} onChange={(e) => setLocFilter(e.target.value)} className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                <option value="all">Location: All</option>
                <option value="café">Café</option>
                <option value="vending">Vending Machines</option>
              </select>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                <option value="all">Category: All</option>
                <option value="Raw Ingredient">Raw Ingredients</option>
                <option value="Prepared Item">Prepared Items</option>
                <option value="Retail">Retail / Pre-packaged</option>
              </select>
              <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)} className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer w-40">
                <option value="all">Reason: All</option>
                <option value="expired">Expired / EOD</option>
                <option value="dropped">Dropped / Spilled</option>
                <option value="prep_error">Prep Error</option>
                <option value="supplier">Poor Supplier Quality</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date &amp; Time</th>
                  <th className="px-6 py-4 font-semibold">Item &amp; Category</th>
                  <th className="px-6 py-4 font-semibold">Location</th>
                  <th className="px-6 py-4 font-semibold">Supplier Name</th>
                  <th className="px-6 py-4 font-semibold">Reason Code</th>
                  <th className="px-6 py-4 font-semibold">Qty</th>
                  <th className="px-6 py-4 font-semibold text-red-400">Cost Impact (RM)</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-500 text-xs">No waste logs found.</td></tr>
                ) : filtered.map((w) => {
                  const dt = new Date(w.logged_at);
                  const isToday = dt.toDateString() === new Date().toDateString();
                  const dateStr = isToday ? `Today, ${dt.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}` : dt.toLocaleDateString("en-MY", { day: "2-digit", month: "short" }) + `, ${dt.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}`;
                  const isCritical = w.reason === "supplier";
                  return (
                    <tr key={w.id} className={`hover:bg-white/[0.02] transition-colors group ${isCritical ? "bg-red-500/[0.02]" : ""}`}>
                      <td className="px-6 py-4 text-gray-400 font-mono">{dateStr}</td>
                      <td className="px-6 py-4">
                        <p className="text-gray-200 font-bold mb-0.5">{w.item_name}</p>
                        <span className="bg-[#020408] px-2 py-0.5 rounded border border-white/10 text-[9px] text-gray-400 uppercase tracking-widest">{w.category ?? "—"}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{w.location ?? "—"}</td>
                      <td className={`px-6 py-4 ${w.supplier_name ? (isCritical ? "font-semibold text-gray-200" : "text-gray-400") : "text-gray-500 italic"}`}>{w.supplier_name ?? "N/A (Assembled)"}</td>
                      <td className="px-6 py-4">{reasonBadge(w.reason)}</td>
                      <td className="px-6 py-4 font-mono text-gray-300">{w.quantity} {w.unit ?? "units"}</td>
                      <td className="px-6 py-4 font-mono font-bold text-red-400">RM {w.cost_impact.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        {w.reason === "supplier" ? (
                          <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded bg-[#020408] border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">Flag Vendor</button>
                        ) : w.reason === "expired" ? (
                          <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded bg-[#020408] border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors">Adjust Par Level</button>
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

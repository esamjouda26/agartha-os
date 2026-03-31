"use client";

import { useState, useMemo } from "react";
import { Truck, Search, FileBarChart2, Calendar, CheckCircle2, AlertCircle, AlertTriangle, FileText } from "lucide-react";

export interface EnrichedSupplierData {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
  volumeReceived: number;
  rejectionWaste: number;
  yield: number;
  status: "optimal" | "warning" | "critical";
  unit: string;
}

const STATUS_STYLE: Record<string, { cls: string; icon: typeof CheckCircle2; label: string }> = {
  optimal:  { cls: "text-green-400 bg-green-400/10 border-green-500/20", icon: CheckCircle2, label: "Optimal (>95%)" },
  warning:  { cls: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20", icon: AlertCircle, label: "Monitor (85-95%)" },
  critical: { cls: "text-red-400 bg-red-400/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]", icon: AlertTriangle, label: "Critical (<85%)" },
};

export default function SupplierPerfClient({ suppliers }: { suppliers: EnrichedSupplierData[] }) {
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("Lifetime");

  const filtered = useMemo(() => suppliers.filter((s) => {
    const q = search.toLowerCase();
    if (q && !s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) return false;
    if (supplierFilter !== "all" && s.id !== supplierFilter) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  }), [suppliers, search, supplierFilter, statusFilter]);

  /* KPIs */
  const globalYield = suppliers.length > 0 ? suppliers.reduce((s, r) => s + r.yield, 0) / suppliers.length : 0;
  const optimalCount = suppliers.filter((s) => s.status === "optimal").length;
  const criticalCount = suppliers.filter((s) => s.status === "critical").length;

  return (
    <div className="space-y-8 pb-10 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-cinzel text-3xl text-[#d4af37] font-bold tracking-wider flex items-center">
            <Truck className="w-8 h-8 mr-3 text-[#d4af37]" /> 
            Supplier Performance Tracking
          </h1>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-semibold flex items-center">
            Verified PO Deliveries vs Tracked Incident Spoilage
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="glass-panel rounded-lg p-1 flex items-center space-x-1 border-[#d4af37]/20 shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
            {["Lifetime", "YTD"].map((d) => (
              <button key={d} onClick={() => setDateRange(d)} className={`px-4 py-1.5 text-sm rounded transition-all ${dateRange === d ? "font-bold bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50" : "font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}>{d}</button>
            ))}
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button className="flex items-center px-3 py-1.5 text-sm font-medium rounded text-gray-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors"><Calendar className="w-4 h-4 mr-1.5" /> Filter Range</button>
          </div>
          <button className="bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold px-5 py-2.5 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all flex items-center text-sm uppercase tracking-widest">
            <FileBarChart2 className="w-4 h-4 mr-2" /> Export Audit
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

      {/* Data Table */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[500px] border-[#d4af37]/20">
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Search supplier or category..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#010204] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all font-mono" />
            </div>
            <div className="flex items-center space-x-3 text-xs tracking-wide uppercase font-semibold">
              <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="bg-[#010204] border border-white/10 text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer w-48">
                <option value="all">Supplier: All</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#010204] border border-white/10 text-[#d4af37] rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer w-48">
                <option value="all">Health Status: All</option>
                <option value="optimal">Optimal (&gt;95%)</option>
                <option value="warning">Warning (85-95%)</option>
                <option value="critical">Critical Only (&lt;85%)</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-[#010204] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Supplier Details</th>
                  <th className="px-6 py-4 font-semibold">Category Segment</th>
                  <th className="px-6 py-4 font-semibold text-right">Aggregate Received</th>
                  <th className="px-6 py-4 font-semibold text-right">Tracked Waste / Rejection</th>
                  <th className="px-6 py-4 font-semibold text-center">Usable Yield %</th>
                  <th className="px-6 py-4 font-semibold text-center">Vendor Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500 font-mono tracking-widest uppercase">No verified supply metrics found.</td></tr>
                ) : filtered.map((r) => {
                  const style = STATUS_STYLE[r.status];
                  const Icon = style.icon;
                  const yieldColor = r.status === "optimal" ? "text-white" : r.status === "warning" ? "text-yellow-500" : "text-red-400";
                  const rejColor = r.status === "critical" ? "text-red-400 font-bold" : "text-gray-400";
                  
                  return (
                    <tr key={r.id} className={`hover:bg-white/[0.02] transition-colors group ${r.status === "warning" ? "bg-yellow-500/[0.02]" : r.status === "critical" ? "bg-red-500/[0.05]" : ""}`}>
                      <td className="px-6 py-4">
                        <p className="text-gray-200 font-bold mb-0.5 tracking-wide font-sans text-sm">{r.name}</p>
                        <div className="flex items-center">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider border ${r.is_active ? "text-green-500 border-green-500/30 bg-green-500/10" : "text-gray-500 border-gray-500/30 bg-gray-500/10"}`}>
                            {r.is_active ? "Active Partner" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 uppercase tracking-widest text-[10px]">{r.category.replace(/_/g, " ")}</td>
                      
                      <td className="px-6 py-4 text-gray-300 text-right">
                        {r.volumeReceived.toLocaleString()} <span className="text-gray-500 uppercase">{r.unit}</span>
                      </td>
                      
                      <td className={`px-6 py-4 text-right ${rejColor}`}>
                        {r.rejectionWaste.toLocaleString()} <span className="opacity-50 uppercase">{r.unit}</span>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <span className={`text-base font-bold ${yieldColor}`}>
                          {r.yield.toFixed(1)}%
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={`flex items-center text-[10px] w-[130px] justify-center tracking-widest px-2 py-1 rounded border uppercase font-bold ${style.cls}`}>
                            <Icon className="w-3.5 h-3.5 mr-1.5" /> {style.label.split('(')[0].trim()}
                          </span>
                        </div>
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

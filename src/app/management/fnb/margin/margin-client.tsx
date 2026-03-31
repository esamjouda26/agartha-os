"use client";

import { useState, useMemo } from "react";
import { 
  PieChart, Search, Filter, ArrowUpRight, ArrowDownRight, 
  Minus, AlertTriangle, ShieldCheck, Zap
} from "lucide-react";
import type { MarginRow } from "./page";

export default function MarginClient({ data }: { data: MarginRow[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");

  const filtered = useMemo(() => {
    return data.filter(row => {
      const s = search.toLowerCase();
      if (s && !row.name.toLowerCase().includes(s)) return false;
      if (typeFilter !== "all" && row.type !== typeFilter) return false;
      if (healthFilter !== "all" && row.health.toLowerCase() !== healthFilter) return false;
      return true;
    }).sort((a,b) => b.items_sold - a.items_sold); // Sort by highest vol first
  }, [data, search, typeFilter, healthFilter]);

  const metrics = useMemo(() => {
    let ttlItems = 0;
    let sellingP = 0;
    let baseC = 0;
    let crits = 0;

    data.forEach(row => {
      ttlItems += row.items_sold;
      if (row.items_sold > 0) {
        sellingP += (row.selling_price * row.items_sold);
        baseC += (row.base_cost * row.items_sold);
      }
      if (row.health === "Critical") crits++;
    });

    const netMargin = sellingP > 0 ? ((sellingP - baseC) / sellingP) * 100 : 0;
    
    return {
      totalVolume: ttlItems,
      netMargin,
      criticalCount: crits
    };
  }, [data]);

  return (
    <div className="space-y-8 pb-10 max-w-screen-2xl mx-auto">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-cinzel text-3xl text-[#d4af37] font-bold tracking-wider flex items-center">
            <PieChart className="w-8 h-8 mr-3 text-[#d4af37]" /> 
            Margin & Yield Reporting
          </h1>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-semibold flex items-center">
            F&B And Giftshop Operations Profitability Analysis
          </p>
        </div>
      </div>

      {/* ═══ KPI Strip ═══ */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-lg p-5 border-l-2 border-green-500/50">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Blended Net Margin</p>
          <h4 className="font-orbitron text-3xl font-bold text-green-400">
            {metrics.netMargin.toFixed(1)}%
          </h4>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-[#d4af37]/50">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Items Moved</p>
          <h4 className="font-orbitron text-3xl font-bold text-[#d4af37]">
            {metrics.totalVolume.toLocaleString()}
          </h4>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-red-500/50">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Critical Warnings</p>
          <h4 className="font-orbitron text-3xl font-bold text-red-500">
            {metrics.criticalCount}
          </h4>
        </div>
      </section>

      {/* ═══ Main Table Panel ═══ */}
      <section className="glass-panel rounded-lg overflow-hidden flex flex-col border-[#d4af37]/30 min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search Items..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-[#010204] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all font-mono" 
            />
          </div>
          <div className="flex items-center space-x-3 text-xs font-semibold tracking-wide uppercase">
            <Filter className="w-4 h-4 text-gray-500" />
            
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)} 
              className="bg-[#010204] border border-white/10 text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer"
            >
              <option value="all">Module: All</option>
              <option value="fnb">F&B Menu</option>
              <option value="retail">Giftshop Merch</option>
            </select>

            <select 
              value={healthFilter} 
              onChange={(e) => setHealthFilter(e.target.value)} 
              className="bg-[#010204] border border-white/10 text-[#d4af37] rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer"
            >
              <option value="all">Health: All</option>
              <option value="excellent">Excellent (&gt; 60%)</option>
              <option value="good">Good (35-60%)</option>
              <option value="warning">Warning (0-35%)</option>
              <option value="critical">Critical (&lt; 0%)</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-[#010204] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold">Item Name</th>
                <th className="px-6 py-4 font-semibold text-right">Items Sold</th>
                <th className="px-6 py-4 font-semibold text-right">Base Cost</th>
                <th className="px-6 py-4 font-semibold text-right">Selling Price</th>
                <th className="px-6 py-4 font-semibold text-right">Target Margin</th>
                <th className="px-6 py-4 font-semibold text-right text-[#d4af37]">Actual Margin</th>
                <th className="px-6 py-4 font-semibold text-center">Variance Impact</th>
                <th className="px-6 py-4 font-semibold text-center">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500 text-xs font-mono uppercase">
                    No matching margin records found.
                  </td>
                </tr>
              ) : filtered.map(row => {
                
                const FormatMoney = (v: number) => `$${v.toFixed(2)}`;
                const FormatPct = (v: number) => `${v.toFixed(1)}%`;

                const vColor = row.variance > 0.1 ? "text-green-400" : row.variance < -0.1 ? "text-red-400" : "text-gray-400";
                
                return (
                  <tr key={row.id + row.type} className="hover:bg-white/[0.02] transition-colors group">
                    
                    {/* Item Details */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-200 font-sans tracking-wide text-sm">{row.name}</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest border border-white/10 text-gray-500 bg-[#010204]">
                            {row.type === 'fnb' ? 'F&B Menu' : 'Retail Catalog'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right font-medium text-gray-300">
                      {row.items_sold.toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-right text-gray-400">
                      {FormatMoney(row.base_cost)}
                    </td>

                    <td className="px-6 py-4 text-right text-gray-300">
                      {FormatMoney(row.selling_price)}
                    </td>

                    <td className="px-6 py-4 text-right text-gray-400 border-l border-white/5">
                      {FormatPct(row.target_margin)}
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-[#d4af37] bg-[#d4af37]/5">
                      {FormatPct(row.actual_margin)}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className={`flex items-center justify-center space-x-1 ${vColor}`}>
                        {row.variance > 0.1 ? <ArrowUpRight className="w-3 h-3" /> 
                         : row.variance < -0.1 ? <ArrowDownRight className="w-3 h-3" />
                         : <Minus className="w-3 h-3" />}
                        <span>{Math.abs(row.variance).toFixed(1)}%</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <HealthBadge status={row.health} />
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function HealthBadge({ status }: { status: string }) {
  if (status === "Excellent") {
    return (
      <span className="inline-flex items-center px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-[10px] uppercase font-bold tracking-widest w-[100px] justify-center">
        <ShieldCheck className="w-3 h-3 mr-1" /> EXCELLENT
      </span>
    );
  } else if (status === "Good") {
    return (
      <span className="inline-flex items-center px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] uppercase font-bold tracking-widest w-[100px] justify-center">
        <Zap className="w-3 h-3 mr-1" /> GOOD
      </span>
    );
  } else if (status === "Warning") {
    return (
      <span className="inline-flex items-center px-2 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 rounded text-[10px] uppercase font-bold tracking-widest w-[100px] justify-center">
        <AlertTriangle className="w-3 h-3 mr-1" /> WARNING
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/30 rounded text-[10px] uppercase font-bold tracking-widest w-[100px] justify-center">
        <AlertTriangle className="w-3 h-3 mr-1 animate-pulse" /> CRITICAL
      </span>
    );
  }
}

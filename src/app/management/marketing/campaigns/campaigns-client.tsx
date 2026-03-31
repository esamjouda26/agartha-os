"use client";

import { useState, useMemo, useTransition } from "react";
import { TrendingUp, DollarSign, CreditCard, RefreshCw, Target, Activity, Radio, Link2, Users, ArrowUpDown } from "lucide-react";
import { toggleCampaignStatusAction } from "../actions";
import type { CampaignData } from "./page";

/* ── Helpers ────────────────────────────────────────────────────────── */
const fmtCur = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(n);

export default function CampaignsClient({ campaigns }: { campaigns: CampaignData[] }) {
  const [dateRange, setDateRange] = useState("Today");
  const [isPending, startTransition] = useTransition();
  const [audienceView, setAudienceView] = useState("demographics");

  /* KPI aggregations */
  const totalSpend   = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalBudget  = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalClicks  = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConv    = campaigns.reduce((s, c) => s + c.conversions, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  
  // Real dynamic aggregated revenue from all systems combined
  const totalAttributedRevenue = campaigns.reduce((s, c) => s + c.attributed_revenue, 0);

  // Blended CAC = global spend / global conversions
  const cac = totalConv > 0 ? totalSpend / totalConv : 0;
  
  // Global ROAS (Return On Ad Spend) 
  const roas = totalSpend > 0 ? (totalAttributedRevenue / totalSpend) : 0;

  /* Channel styles */
  const channelBadge = (ch: string) => {
    const lower = ch.toLowerCase();
    if (lower.includes("meta") || lower.includes("facebook")) return "bg-blue-600/20 text-blue-400 border-blue-500/20";
    if (lower.includes("google")) return "bg-green-500/20 text-green-400 border-green-500/20";
    if (lower.includes("tiktok")) return "bg-pink-500/20 text-pink-400 border-pink-500/20";
    if (lower.includes("referral")) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/20";
    return "bg-gray-500/20 text-gray-400 border-gray-500/20";
  };

  /* Channel performance matrix for Visuals */
  const channelMatrix = useMemo(() => {
    const map: Record<string, { clicks: number; conversions: number; spend: number; revenue: number }> = {};
    campaigns.forEach(c => {
      const key = c.channel || "direct";
      if (!map[key]) map[key] = { clicks: 0, conversions: 0, spend: 0, revenue: 0 };
      map[key].clicks += c.clicks;
      map[key].conversions += c.conversions;
      map[key].spend += c.spend;
      map[key].revenue += c.attributed_revenue;
    });
    return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [campaigns]);

  const maxSpend = activeCampaigns.length ? Math.max(...activeCampaigns.map(c => c.spend)) : 0;
  const maxCac = activeCampaigns.length ? Math.max(...activeCampaigns.map(c => c.conversions > 0 ? c.spend / c.conversions : 0)) : 0;

  // Simple deterministic hash for mock demographics
  const getHash = (str: string) => str.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0);

  return (
    <div className="space-y-8 pb-10 max-w-screen-2xl mx-auto">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-3xl text-[#d4af37] font-bold tracking-wider flex items-center">
            <Target className="w-8 h-8 mr-3 text-[#d4af37]" /> 
            Marketing & Growth Analytics
          </h1>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-semibold flex items-center">
            Cross-Origin Omnichannel Conversion Mapping
          </p>
        </div>
        <div className="glass-panel rounded-lg p-1.5 flex items-center justify-between w-fit border-[#d4af37]/20 shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center space-x-1">
            {["Today", "7D", "MTD", "YTD"].map((label) => (
              <button
                key={label}
                onClick={() => setDateRange(label)}
                className={`px-4 py-1.5 text-xs font-semibold rounded uppercase tracking-wider transition-colors ${
                  label === dateRange
                    ? "font-bold bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50 shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-white/10 mx-2" />
          <button className="flex items-center px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded text-gray-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors group">
            Custom Range
          </button>
        </div>
      </div>

      {/* ═══ KPI Summary Row ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-lg border-l-4 border-l-red-500/50 flex flex-col justify-between transition-all group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-all"></div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-semibold flex items-center">
            <DollarSign className="w-3 h-3 mr-1 text-red-500" /> Total Ad Spend
          </p>
          <p className="text-3xl font-orbitron font-bold text-white tracking-widest mt-2">{fmtCur(totalSpend)}</p>
        </div>
        
        <div className="glass-panel p-5 rounded-lg border-l-4 border-l-green-500/50 flex flex-col justify-between transition-all group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-all"></div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-semibold flex items-center">
            <CreditCard className="w-3 h-3 mr-1 text-green-500" /> Attributed Revenue
          </p>
          <p className="text-3xl font-orbitron font-bold text-green-400 tracking-widest mt-2">{fmtCur(totalAttributedRevenue)}</p>
        </div>
        
        <div className="glass-panel p-5 rounded-lg border-l-4 border-l-[#d4af37]/50 flex flex-col justify-between transition-all group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#d4af37]/10 rounded-full blur-xl group-hover:bg-[#d4af37]/20 transition-all"></div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-semibold flex items-center">
            <RefreshCw className="w-3 h-3 mr-1 text-[#d4af37]" /> Blended ROAS
          </p>
          <p className="text-3xl font-orbitron font-bold text-[#d4af37] tracking-widest mt-2">
             {roas === 0 ? "—" : `${roas.toFixed(2)}x`}
          </p>
        </div>
        
        <div className="glass-panel p-5 rounded-lg border-l-4 border-l-blue-500/50 flex flex-col justify-between transition-all group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 font-semibold flex items-center">
            <Target className="w-3 h-3 mr-1 text-blue-500" /> Blended CAC
          </p>
          <p className="text-3xl font-orbitron font-bold text-blue-400 tracking-widest mt-2">
            {totalConv > 0 ? `$${cac.toFixed(2)}` : "—"}
          </p>
        </div>
      </div>

      {/* ═══ CSS Visuals Section ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Efficiency Curve CSS Graphic */}
        <div className="xl:col-span-2 glass-panel p-6 rounded-lg flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8 flex-shrink-0">
            <div>
               <h4 className="text-xs text-gray-400 uppercase tracking-widest font-bold flex items-center">
                 <Activity className="w-4 h-4 mr-2 text-[#d4af37]" /> Efficiency Curve (Spend vs CAC)
               </h4>
               <p className="text-[9px] text-gray-500 mt-1">Normalized multi-axis variance tracking active spend yields.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase font-mono tracking-widest"><div className="w-2 h-2 bg-[#d4af37]"></div>Spend</div>
              <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase font-mono tracking-widest"><div className="w-2 h-2 bg-blue-500"></div>CAC</div>
            </div>
          </div>
          <div className="flex-1 relative flex mt-2 pl-14 pr-14 pb-8 pt-2">
             {/* Left Y-Axis (Spend) */}
             <div className="absolute left-0 top-2 bottom-8 w-12 flex flex-col justify-between items-end border-r border-[#d4af37]/30 pr-2">
                <span className="text-[8px] text-gray-400 font-mono tracking-tighter">{maxSpend >= 1000 ? `$${(maxSpend/1000).toFixed(1)}k` : `$${maxSpend}`}</span>
                <span className="text-[8px] text-gray-500 font-mono tracking-tighter">{maxSpend >= 1000 ? `$${(maxSpend*0.75/1000).toFixed(1)}k` : `$${maxSpend*0.75}`}</span>
                <span className="text-[8px] text-gray-500 font-mono tracking-tighter">{maxSpend >= 1000 ? `$${(maxSpend*0.5/1000).toFixed(1)}k` : `$${maxSpend*0.5}`}</span>
                <span className="text-[8px] text-gray-500 font-mono tracking-tighter">{maxSpend >= 1000 ? `$${(maxSpend*0.25/1000).toFixed(1)}k` : `$${maxSpend*0.25}`}</span>
                <span className="text-[8px] text-gray-400 font-mono tracking-tighter">$0</span>
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-[#d4af37] tracking-widest uppercase font-bold whitespace-nowrap">Gross Spend</div>
             </div>

             {/* Right Y-Axis (CAC) */}
             <div className="absolute right-0 top-2 bottom-8 w-12 flex flex-col justify-between items-start border-l border-blue-500/30 pl-2">
                <span className="text-[8px] text-gray-400 font-mono tracking-tighter">${maxCac.toFixed(0)}</span>
                <span className="text-[8px] text-gray-500 font-mono tracking-tighter">${(maxCac * 0.75).toFixed(0)}</span>
                <span className="text-[8px] text-gray-500 font-mono tracking-tighter">${(maxCac * 0.5).toFixed(0)}</span>
                <span className="text-[8px] text-gray-500 font-mono tracking-tighter">${(maxCac * 0.25).toFixed(0)}</span>
                <span className="text-[8px] text-gray-400 font-mono tracking-tighter">$0</span>
                <div className="absolute -right-8 top-1/2 -translate-y-1/2 rotate-90 text-[9px] text-blue-500 tracking-widest uppercase font-bold whitespace-nowrap">CAC Impact</div>
             </div>
             
             {/* Chart Body */}
             <div className="flex-1 flex flex-col relative">
                <div className="flex-1 flex items-end justify-between border-b border-white/20 pb-0 gap-2 relative h-full">
                   <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.03]">
                      <div className="border-t border-white w-full"></div>
                      <div className="border-t border-white w-full"></div>
                      <div className="border-t border-white w-full"></div>
                      <div className="border-t border-white w-full"></div>
                   </div>
                   {activeCampaigns.length === 0 ? (
                     <div className="absolute inset-0 flex items-center justify-center text-xs text-center italic text-gray-500 font-mono">No active campaign data flows</div>
                   ) : activeCampaigns.slice(0, 10).map((c) => {
                     const cac = c.conversions > 0 ? c.spend / c.conversions : 0;
                     const sPx = maxSpend > 0 ? (c.spend / maxSpend) * 100 : 0;
                     const cPx = maxCac > 0 ? (cac / maxCac) * 100 : 0;
                     return (
                        <div key={c.id} className="flex flex-col items-center flex-1 h-full justify-end group z-10 hover:bg-white/[0.02] transition-colors rounded-t">
                           <div className="flex items-end justify-center w-full gap-0.5 sm:gap-1.5 h-full opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer">
                              <div style={{height: `${sPx}%`}} className="w-2 sm:w-4 bg-gradient-to-t from-[#806b45] to-[#d4af37] rounded-t relative shadow-[0_0_10px_rgba(212,175,55,0.2)]" title={`Spend: ${fmtCur(c.spend)}`}></div>
                              <div style={{height: `${cPx}%`}} className="w-2 sm:w-4 bg-gradient-to-t from-blue-700 to-blue-400 rounded-t relative shadow-[0_0_10px_rgba(59,130,246,0.2)]" title={`CAC: $${cac.toFixed(2)}`}></div>
                           </div>
                        </div>
                     );
                   })}
                </div>
                {/* X-Axis labels */}
                <div className="flex justify-between mt-3 px-2 gap-2 h-4 items-center">
                  {activeCampaigns.slice(0, 10).map(c => (
                    <p key={c.id} className="text-[8px] font-mono text-gray-400 truncate flex-1 text-center" title={c.name}>{c.name.substring(0, 7)}..</p>
                  ))}
                </div>
             </div>
          </div>
        </div>

        {/* Active Campaigns Grid */}
        <div className="xl:col-span-1 glass-panel p-5 rounded-lg flex flex-col overflow-hidden h-[400px]">
          <div className="flex items-center justify-between mb-4 shrink-0 border-b border-white/10 pb-4">
            <h4 className="text-xs text-gray-400 uppercase tracking-widest font-bold flex items-center">
              <Radio className="w-4 h-4 mr-2 text-[#d4af37] animate-pulse" /> Active Deployments
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[9px] bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40 font-bold">{activeCampaigns.length} running</span>
          </div>
          <div className="overflow-y-auto flex-1 pr-2 space-y-3 custom-scrollbar">
            {activeCampaigns.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-8 font-mono">No active campaigns</p>
            ) : (
              activeCampaigns.map((c) => {
                const cpc = c.clicks && c.clicks > 0 ? (c.spend ?? 0) / c.clicks : 0;
                return (
                  <div key={c.id} className="bg-[#010204] border border-[#d4af37]/20 rounded-lg p-3 flex flex-col space-y-3 shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className={`text-[9px] uppercase tracking-widest border border-transparent flex items-center font-bold px-1.5 py-0.5 rounded w-fit ${channelBadge(c.channel)}`}>
                          {c.channel}
                        </span>
                        <span className="text-xs font-bold text-gray-200 mt-2 truncate w-full" title={c.name}>
                          {c.name}
                        </span>
                      </div>
                      <button 
                        disabled={isPending}
                        onClick={() => startTransition(async () => { await toggleCampaignStatusAction(c.id, c.status); })}
                        title="Toggle Campaign" 
                        className="text-[8px] bg-[#020408] border border-green-500/30 text-green-400 font-bold uppercase hover:bg-green-500/20 px-2 py-1 rounded shadow-sm transition-all tracking-widest disabled:opacity-50"
                      >
                        {c.status}
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 border-t border-white/5 pt-2">
                       <div className="col-span-2">
                        <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Pacing Output</p>
                        <span className="text-xs font-mono text-gray-300 font-semibold">{fmtCur(c.spend)} </span><span className="text-[8px] text-gray-500">/ {fmtCur(c.budget)}</span>
                      </div>
                      <div className="col-span-1 text-center border-l border-white/5 flex flex-col justify-center">
                        <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Clicks</p>
                        <span className="text-[10px] font-mono font-bold text-blue-400">
                          {c.clicks >= 1000 ? `${(c.clicks / 1000).toFixed(1)}k` : c.clicks}
                        </span>
                      </div>
                      <div className="col-span-1 text-center border-l border-white/5 flex flex-col justify-center">
                        <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Rev</p>
                        <span className="text-[10px] font-mono font-bold text-green-400">{c.attributed_revenue >= 1000 ? `$${(c.attributed_revenue / 1000).toFixed(1)}k` : `$${c.attributed_revenue}`}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ═══ Sales by Traffic Source ═══ */}
      <section className="mt-10">
        <h4 className="font-cinzel text-lg text-[#d4af37] tracking-wider mb-6 pb-2 border-b border-white/10 flex items-center">
           <Link2 className="w-5 h-5 mr-3" /> Omnichannel Channel Heatmap
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Source Ledger Table */}
          <div className="glass-panel rounded-lg flex flex-col overflow-hidden max-h-[350px]">
            <div className="overflow-x-auto h-full custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-[#010204] sticky top-0 z-10 border-b border-white/10">
                  <tr>
                    <th className="px-5 py-4 cursor-pointer hover:text-[#d4af37]">Traffic Origin</th>
                    <th className="px-5 py-4 text-right cursor-pointer hover:text-[#d4af37]">Ad Spend</th>
                    <th className="px-5 py-4 text-right cursor-pointer hover:text-[#d4af37]">Traced Net Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs">
                  {channelMatrix.length === 0 ? (
                    <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-500 font-sans tracking-widest uppercase text-xs">No traces mapped.</td></tr>
                  ) : channelMatrix.map(([source, row]) => (
                        <tr key={source} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 text-white uppercase font-sans tracking-widest font-bold text-[10px]">{source}</td>
                          <td className="px-5 py-3 text-red-400/80 text-right">{fmtCur(row.spend)}</td>
                          <td className="px-5 py-3 text-green-400 text-right font-bold tracking-wide bg-green-500/5">{fmtCur(row.revenue)}</td>
                        </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audience Breakdown by Campaign (Dynamic CSS) */}
          <div className="glass-panel p-6 rounded-lg flex flex-col justify-center min-h-[350px]">
             <div className="flex items-center justify-between mb-4 flex-shrink-0">
               <h4 className="text-xs text-gray-400 uppercase tracking-widest font-bold flex items-center">
                 <Users className="w-4 h-4 mr-2 text-[#d4af37]" /> Audience Breakdown
               </h4>
               <select 
                 className="bg-[#020408] border border-white/10 text-[9px] font-bold text-gray-300 rounded px-2 py-1 uppercase tracking-widest outline-none"
                 value={audienceView}
                 onChange={(e) => setAudienceView(e.target.value)}
               >
                 <option value="demographics">Demographics</option>
                 <option value="group">Group Composition</option>
                 <option value="tier">Tier Performance</option>
               </select>
             </div>
             
             {activeCampaigns.length === 0 ? (
                <div className="text-center italic text-gray-600 text-[10px] py-10 font-mono uppercase tracking-widest border border-dashed border-white/10 rounded-lg">Awaiting Valid Attributions</div>
             ) : (
                <div className="flex-1 flex relative mt-2 pl-12 pr-4 pb-8 pt-2">
                   {/* Left Y-Axis (Conversions) */}
                   <div className="absolute left-0 top-2 bottom-8 w-10 flex flex-col justify-between items-end border-r border-white/20 pr-2">
                      <span className="text-[8px] text-gray-400 font-mono tracking-tighter">{Math.max(...activeCampaigns.map(c => c.conversions))}</span>
                      <span className="text-[8px] text-gray-500 font-mono tracking-tighter">{Math.round(Math.max(...activeCampaigns.map(c => c.conversions)) * 0.75)}</span>
                      <span className="text-[8px] text-gray-500 font-mono tracking-tighter">{Math.round(Math.max(...activeCampaigns.map(c => c.conversions)) * 0.5)}</span>
                      <span className="text-[8px] text-gray-500 font-mono tracking-tighter">{Math.round(Math.max(...activeCampaigns.map(c => c.conversions)) * 0.25)}</span>
                      <span className="text-[8px] text-gray-400 font-mono tracking-tighter">0</span>
                      <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-gray-400 tracking-widest uppercase font-bold whitespace-nowrap">Conversions</div>
                   </div>

                   {/* Chart Body */}
                   <div className="flex-1 flex flex-col relative h-full">
                      <div className="flex-1 flex gap-2 sm:gap-4 items-end justify-between border-b border-white/20 pb-0 relative">
                         {/* Grid lines */}
                         <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.03]">
                            <div className="border-t border-white w-full"></div>
                            <div className="border-t border-white w-full"></div>
                            <div className="border-t border-white w-full"></div>
                            <div className="border-t border-white w-full"></div>
                         </div>
                         {activeCampaigns.slice(0, 8).map(c => {
                      const maxConvs = Math.max(...activeCampaigns.map(ac => ac.conversions));
                      const totalScale = maxConvs > 0 ? (c.conversions / maxConvs) * 100 : 0;
                      
                      const hash = getHash(c.id);
                      let segments: {label: string, pct: number, color: string}[] = [];
                      
                      if(audienceView === "demographics") {
                        const s1 = 30 + (Math.abs(hash) % 50); // Adults
                        const s2 = 100 - s1; // Children
                        segments = [
                           { label: "Children", pct: s2, color: "bg-blue-500" },
                           { label: "Adults", pct: s1, color: "bg-[#d4af37]" }
                        ];
                      } else if (audienceView === "group") {
                        const s1 = 20 + (Math.abs(hash) % 40); // Solo
                        const s2 = 20 + (Math.abs(hash+1) % 40); // Couples
                        const s3 = 100 - s1 - s2; // Groups
                        segments = [
                           { label: "Groups (3+)", pct: s3, color: "bg-green-500" },
                           { label: "Couples", pct: s2, color: "bg-blue-500" },
                           { label: "Solo", pct: s1, color: "bg-[#d4af37]" }
                        ];
                      } else {
                        // tier
                        const s1 = 40 + (Math.abs(hash) % 40); // Skimmer
                        const s2 = 10 + (Math.abs(hash+2) % 30); // Swimmer
                        const s3 = 100 - s1 - s2; // Diver
                        segments = [
                           { label: "Diver", pct: s3, color: "bg-green-500" },
                           { label: "Swimmer", pct: s2, color: "bg-blue-500" },
                           { label: "Skimmer", pct: s1, color: "bg-[#d4af37]" }
                        ];
                      }

                      return (
                         <div key={"aud_"+c.id} className="flex flex-col items-center flex-1 h-full justify-end z-10 group cursor-pointer">
                            <div className="w-full sm:w-10 flex flex-col justify-end group-hover:bg-white/[0.05] rounded-t transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]" style={{height: `${totalScale}%`}}>
                               {segments.map((seg, i) => (
                                 <div key={i} style={{height: `${seg.pct}%`}} className={`w-full ${seg.color} opacity-90 group-hover:opacity-100 transition-opacity ${i === 0 ? 'rounded-t' : ''} ${i !== segments.length - 1 ? 'border-b border-black/40' : ''}`} title={`${seg.label}: ${Math.round(c.conversions * (seg.pct/100))}`}></div>
                               ))}
                            </div>
                         </div>
                      );
                   })}
                      </div>
                      <div className="flex justify-between mt-3 px-1 gap-1 h-4 items-center">
                         {activeCampaigns.slice(0, 8).map(c => (
                            <p key={"aud_lbl_"+c.id} className="text-[8px] font-mono text-gray-400 truncate flex-1 text-center" title={c.name}>{c.name.substring(0,6)}</p>
                         ))}
                      </div>
                   </div>
                </div>
             )}
             <div className="flex gap-4 mt-6 justify-center">
                 {audienceView === "demographics" && (
                    <>
                       <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase font-mono tracking-widest"><div className="w-2 h-2 bg-[#d4af37]"></div>Adults</div>
                       <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase font-mono tracking-widest"><div className="w-2 h-2 bg-blue-500"></div>Children</div>
                    </>
                 )}
                 {audienceView === "group" && (
                    <>
                       <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase font-mono tracking-widest"><div className="w-2 h-2 bg-[#d4af37]"></div>Solo</div>
                       <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase font-mono tracking-widest"><div className="w-2 h-2 bg-blue-500"></div>Couples</div>
                       <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase font-mono tracking-widest"><div className="w-2 h-2 bg-green-500"></div>Groups (3+)</div>
                    </>
                 )}
                 {audienceView === "tier" && (
                    <>
                       <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase font-mono tracking-widest"><div className="w-2 h-2 bg-[#d4af37]"></div>Skimmer</div>
                       <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase font-mono tracking-widest"><div className="w-2 h-2 bg-blue-500"></div>Swimmer</div>
                       <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase font-mono tracking-widest"><div className="w-2 h-2 bg-green-500"></div>Diver</div>
                    </>
                 )}
             </div>
          </div>
        </div>
      </section>

      {/* ═══ Full Campaign Performance Table ═══ */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden border border-[#d4af37]/20 shadow-2xl mt-12 bg-[#010204]/80">
          <div className="p-4 border-b border-white/10 bg-[#020408] flex items-center justify-between">
            <h4 className="text-xs text-white uppercase tracking-widest font-bold flex items-center">
               Master Campaign Ledger
            </h4>
            <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase border border-white/10 px-2 py-1 rounded bg-black">Database Synchronized</span>
          </div>
          <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-[#020408] text-[9px] font-bold text-[#d4af37] uppercase tracking-widest border-b border-white/10 sticky top-0 z-10 shadow-md shadow-black/50">
                <tr>
                  {["Identifier", "Origin", "Status", "Allocated", "Spent", "Clicks", "Conversions", "CAC", "Net ROAS", "Lifespan"].map((h) => (
                    <th key={h} className="px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campaigns.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-500 font-sans tracking-widest uppercase text-xs">No active pipelines found.</td></tr>
                ) : campaigns.map((c) => {
                  const spendPct = c.budget && c.budget > 0 ? Math.round(((c.spend ?? 0) / c.budget) * 100) : 0;
                  const c_roas = c.spend > 0 ? (c.attributed_revenue / c.spend) : 0;
                  
                  const statusStyle = c.status === "active"
                    ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                    : c.status === "paused"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : c.status === "completed"
                    ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20";
                  return (
                    <tr key={c.id} className="hover:bg-white/[0.04] transition-colors group cursor-pointer">
                      <td className="px-5 py-4 font-sans text-sm font-bold text-gray-200">{c.name}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[9px] border px-2 py-0.5 rounded font-bold uppercase tracking-wider ${channelBadge(c.channel)}`}>{c.channel}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[8px] border px-2 py-1 rounded font-bold uppercase tracking-widest ${statusStyle}`}>{c.status}</span>
                      </td>
                      <td className="px-5 py-4 font-mono text-gray-400 font-semibold">{fmtCur(c.budget ?? 0)}</td>
                      <td className="px-5 py-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-red-400/80">{fmtCur(c.spend ?? 0)}</span>
                          <span className="text-[9px] text-gray-600 bg-[#010204] px-1 py-0.5 rounded">{spendPct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-gray-400">{fmtNum(c.clicks ?? 0)}</td>
                      <td className="px-5 py-4 font-mono text-[#d4af37] font-bold">{c.conversions ?? 0}</td>
                      <td className="px-5 py-4 font-mono text-blue-400 font-semibold">{c.spend > 0 && c.conversions > 0 ? `$${(c.spend / c.conversions).toFixed(2)}` : `—`}</td>
                      <td className="px-5 py-4 font-orbitron font-bold text-green-400">{c_roas > 0 ? `${c_roas.toFixed(2)}x` : `—`}</td>
                      <td className="px-5 py-4 text-gray-600 text-[10px] font-mono tracking-tighter">
                        {c.start_date ? c.start_date.slice(0, 10).replace(/-/g, "/") : "—"} → {c.end_date ? c.end_date.slice(0, 10).replace(/-/g, "/") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {campaigns.length > 0 && (
            <div className="px-5 py-3 border-t border-[#d4af37]/30 bg-[#020408] text-[10px] font-mono text-gray-500 uppercase flex items-center gap-3">
               <Activity className="w-3 h-3 text-[#d4af37]" />
              <span className="text-[#d4af37]">System Allocation: {fmtCur(totalBudget)}</span>
              <span className="text-white/20">|</span>
              <span className="text-red-400/80">Velocity Spend: {fmtCur(totalSpend)}</span>
              <span className="text-white/20">|</span>
              <span className="text-green-400">Yield Baseline: {totalBudget > 0 ? Math.round((totalSpend / totalBudget) * 100) : 0}%</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

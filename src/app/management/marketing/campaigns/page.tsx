import { TrendingUp, DollarSign, CreditCard, RefreshCw, Target, Activity, Radio, Link2, Users, ArrowUpDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { toggleCampaignStatusAction } from "../actions";
import { EfficiencyChart, AudienceBreakdownChart, CampaignPerformanceChart } from "./campaign-charts-client";

/* ── Types ─────────────────────────────────────────────────────────── */
interface CampaignRow {
  id: string;
  name: string;
  channel: string;
  status: string;
  budget: number | null;
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
  start_date: string | null;
  end_date: string | null;
}

/* ── Helpers ────────────────────────────────────────────────────────── */
const fmtCur = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(n);

/* ── Page ───────────────────────────────────────────────────────────── */
export default async function MarketingCampaignPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("id, name, channel, status, budget, spend, impressions, clicks, conversions, start_date, end_date")
    .order("start_date", { ascending: false }) as { data: CampaignRow[] | null };

  const campaigns = data ?? [];

  /* KPI aggregations */
  const totalSpend   = campaigns.reduce((s, c) => s + (c.spend ?? 0), 0);
  const totalBudget  = campaigns.reduce((s, c) => s + (c.budget ?? 0), 0);
  const totalClicks  = campaigns.reduce((s, c) => s + (c.clicks ?? 0), 0);
  const totalConv    = campaigns.reduce((s, c) => s + (c.conversions ?? 0), 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  // CAC = spend / conversions (if available)
  const cac = totalConv > 0 ? totalSpend / totalConv : 0;

  /* Channel icon helper */
  const channelBadge = (ch: string) => {
    const lower = ch.toLowerCase();
    if (lower.includes("meta") || lower.includes("facebook")) return "bg-blue-600/20 text-blue-400 border-blue-500/20";
    if (lower.includes("google")) return "bg-green-500/20 text-green-400 border-green-500/20";
    if (lower.includes("tiktok")) return "bg-pink-500/20 text-pink-400 border-pink-500/20";
    return "bg-gray-500/20 text-gray-400 border-gray-500/20";
  };

  return (
    <div className="space-y-8 pb-10">
      {/* ═══ Header & Date Filters ═══ */}
      <div className="flex flex-col md:flex-row md:items-start justify-end gap-4">
        
        {/* Date filter pill bar */}
        <div className="glass-panel rounded-lg p-2 flex items-center justify-between w-fit md:ml-auto border-[#d4af37]/20 shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center space-x-1">
            {["Today", "7D", "MTD", "YTD"].map((label) => (
              <button
                key={label}
                className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                  label === "MTD"
                    ? "font-bold bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50 shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-white/10 mx-2" />
          <button className="flex items-center px-4 py-1.5 text-sm font-medium rounded text-gray-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors group">
            Custom Range
          </button>
        </div>
      </div>

      {/* ═══ KPI Summary Row ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Ad Spend */}
        <div className="glass-panel p-5 rounded-lg border-l-4 border-l-red-500/50 flex flex-col justify-between cursor-pointer hover:border-l-red-500 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-semibold flex items-center">
            <DollarSign className="w-3 h-3 mr-1" /> Total Ad Spend
          </p>
          <p className="text-2xl font-orbitron font-bold text-white">{fmtCur(totalSpend)}</p>
        </div>
        {/* Attributed Revenue */}
        <div className="glass-panel p-5 rounded-lg border-l-4 border-l-green-500/50 flex flex-col justify-between cursor-pointer hover:border-l-green-500 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-semibold flex items-center">
            <CreditCard className="w-3 h-3 mr-1" /> Attributed Revenue
          </p>
          {/* // TODO: Bind to revenue attribution Server Action / RPC */}
          <p className="text-2xl font-orbitron font-bold text-green-400">—</p>
        </div>
        {/* Blended ROAS */}
        <div className="glass-panel p-5 rounded-lg border-l-4 border-l-[#d4af37]/50 flex flex-col justify-between cursor-pointer hover:border-l-[#d4af37] hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-semibold flex items-center">
            <RefreshCw className="w-3 h-3 mr-1" /> Blended ROAS
          </p>
          {/* // TODO: Bind to ROAS calculation (revenue / spend) */}
          <p className="text-2xl font-orbitron font-bold text-[#d4af37]">—</p>
        </div>
        {/* Blended CAC */}
        <div className="glass-panel p-5 rounded-lg border-l-4 border-l-blue-500/50 flex flex-col justify-between cursor-pointer hover:border-l-blue-500 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-semibold flex items-center">
            <Target className="w-3 h-3 mr-1" /> Blended CAC
          </p>
          <p className="text-2xl font-orbitron font-bold text-blue-400">
            {totalConv > 0 ? `$${cac.toFixed(2)}` : "—"}
          </p>
        </div>
      </div>

      {/* ═══ Efficiency Chart + Active Campaigns Grid ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Efficiency Curve (2/3 width) */}
        <div className="xl:col-span-2">
          <EfficiencyChart />
        </div>

        {/* Active Campaigns Grid (1/3 width) */}
        <div className="xl:col-span-1 glass-panel p-5 rounded-lg flex flex-col overflow-hidden max-h-[500px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h4 className="text-xs text-gray-400 uppercase tracking-widest font-semibold flex items-center">
              <Radio className="w-4 h-4 mr-2 text-[#d4af37]" /> Active Campaigns
            </h4>
          </div>
          <div className="overflow-y-auto flex-1 pr-2 space-y-3">
            {activeCampaigns.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-8">No active campaigns</p>
            ) : (
              activeCampaigns.map((c) => {
                const cpc = c.clicks && c.clicks > 0 ? (c.spend ?? 0) / c.clicks : 0;
                return (
                  <div key={c.id} className="bg-[#020408] border border-white/5 rounded-md p-3 flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className={`text-[10px] uppercase tracking-widest flex items-center font-semibold ${channelBadge(c.channel).split(" ").find(cls => cls.startsWith("text-")) ?? "text-gray-400"}`}>
                          {c.channel}
                        </span>
                        <span className="text-sm font-bold text-gray-200 mt-1 truncate max-w-[150px]" title={c.name}>
                          {c.name}
                        </span>
                      </div>
                      <form action={async () => {
                        "use server";
                        await toggleCampaignStatusAction(c.id, c.status);
                      }}>
                        <button type="submit" className="text-[10px] text-green-400 font-bold uppercase hover:bg-green-400/10 px-2 py-1 rounded transition-colors">{c.status}</button>
                      </form>
                    </div>
                    <div className="grid grid-cols-4 gap-2 border-t border-white/5 pt-2">
                      <div className="col-span-2">
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Daily Budget</p>
                        <span className="text-xs font-mono text-[#d4af37]">{fmtCur(c.budget ?? 0)}</span>
                      </div>
                      <div className="col-span-1 text-center border-l border-white/5 flex flex-col justify-center">
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Impr</p>
                        <span className="text-xs font-mono text-gray-300">
                          {(c.impressions ?? 0) >= 1000 ? `${((c.impressions ?? 0) / 1000).toFixed(1)}k` : (c.impressions ?? 0)}
                        </span>
                      </div>
                      <div className="col-span-1 text-center border-l border-white/5 flex flex-col justify-center">
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">CPC</p>
                        <span className="text-xs font-mono text-gray-300">${cpc.toFixed(2)}</span>
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
        <h4 className="font-cinzel text-sm text-gray-300 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">
          Sales by Traffic Source
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Source Ledger Table */}
          <div className="glass-panel rounded-lg flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-[#020408]/40 flex justify-between items-center">
              <h4 className="text-xs text-gray-400 uppercase tracking-widest font-semibold flex items-center">
                <Link2 className="w-4 h-4 mr-2 text-[#d4af37]" /> Traffic Source Ledger
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204]">
                  <tr>
                    <th className="px-5 py-3 font-semibold cursor-pointer hover:text-[#d4af37]">
                      Traffic Source <ArrowUpDown className="inline-block w-3 h-3 ml-1" />
                    </th>
                    <th className="px-5 py-3 font-semibold text-right cursor-pointer hover:text-[#d4af37]">
                      Clicks <ArrowUpDown className="inline-block w-3 h-3 ml-1" />
                    </th>
                    <th className="px-5 py-3 font-semibold text-right cursor-pointer hover:text-[#d4af37]">
                      Conversions <ArrowUpDown className="inline-block w-3 h-3 ml-1" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs">
                  {campaigns.length === 0 ? (
                    <tr><td colSpan={3} className="px-5 py-10 text-center text-gray-500 text-xs">No campaigns found.</td></tr>
                  ) : (
                    /* Group campaigns by channel as "traffic sources" */
                    Object.entries(
                      campaigns.reduce<Record<string, { clicks: number; conversions: number }>>((acc, c) => {
                        const key = c.channel ?? "direct";
                        if (!acc[key]) acc[key] = { clicks: 0, conversions: 0 };
                        acc[key].clicks += c.clicks ?? 0;
                        acc[key].conversions += c.conversions ?? 0;
                        return acc;
                      }, {})
                    )
                      .sort((a, b) => b[1].clicks - a[1].clicks)
                      .map(([source, row]) => (
                        <tr key={source} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 text-[#d4af37] font-semibold">{source}</td>
                          <td className="px-5 py-3 text-gray-300 text-right">{fmtNum(row.clicks)}</td>
                          <td className="px-5 py-3 text-green-400 text-right font-bold">{fmtNum(row.conversions)}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audience Breakdown Chart */}
          <AudienceBreakdownChart />
        </div>
      </section>

      {/* ═══ Campaign Performance Line Chart ═══ */}
      {campaigns.length > 0 && (
        <CampaignPerformanceChart campaigns={campaigns.map(c => ({ name: c.name, impressions: c.impressions, clicks: c.clicks }))} />
      )}

      {/* ═══ Full Campaign Performance Table ═══ */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-[#020408]/40">
            <h4 className="text-xs text-gray-400 uppercase tracking-widest font-semibold flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-[#d4af37]" /> Campaign Performance Ledger
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-[#010204] border-b border-white/10 text-[10px] text-gray-500 uppercase tracking-wider">
                <tr>
                  {["Campaign", "Channel", "Status", "Budget", "Spend", "Impressions", "Clicks", "Conversions", "Dates"].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campaigns.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-500 text-xs">No campaigns found.</td></tr>
                ) : campaigns.map((c) => {
                  const spendPct = c.budget && c.budget > 0 ? Math.round(((c.spend ?? 0) / c.budget) * 100) : 0;
                  const statusStyle = c.status === "active"
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : c.status === "paused"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : c.status === "completed"
                    ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20";
                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 font-medium text-white">{c.name}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] border px-2 py-0.5 rounded font-semibold ${channelBadge(c.channel)}`}>{c.channel}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] border px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${statusStyle}`}>{c.status}</span>
                      </td>
                      <td className="px-5 py-3 font-mono text-gray-300">{fmtCur(c.budget ?? 0)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-red-400">{fmtCur(c.spend ?? 0)}</span>
                          <span className="text-[10px] text-gray-600">({spendPct}%)</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-gray-400">{fmtNum(c.impressions ?? 0)}</td>
                      <td className="px-5 py-3 font-mono text-gray-400">{fmtNum(c.clicks ?? 0)}</td>
                      <td className="px-5 py-3 font-orbitron font-bold text-[#d4af37]">{c.conversions ?? 0}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs font-mono">
                        {c.start_date ? c.start_date.slice(0, 10) : "—"} → {c.end_date ? c.end_date.slice(0, 10) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {campaigns.length > 0 && (
            <div className="px-5 py-3 border-t border-white/10 bg-[#010204] text-xs text-gray-600 flex items-center gap-2">
              <span>Total budget: {fmtCur(totalBudget)}</span>
              <span className="text-white/10">|</span>
              <span>Total spend: {fmtCur(totalSpend)}</span>
              <span className="text-white/10">|</span>
              <span>Budget utilization: {totalBudget > 0 ? Math.round((totalSpend / totalBudget) * 100) : 0}%</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Tag, Activity, Archive, PowerOff, Pencil, Copy, Calendar, Repeat, X } from "lucide-react";
import type { PromoCodeRow } from "./page";

/* ── Helpers ────────────────────────────────────────────────────────── */
const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(n);

const REASON_STYLE: Record<string, string> = {
  expired:   "bg-red-500/20 text-red-400 border-red-500/40",
  exhausted: "bg-yellow-500/20 text-yellow-500 border-yellow-500/40",
  paused:    "bg-gray-500/20 text-gray-400 border-gray-500/40",
};

/* ── Component ──────────────────────────────────────────────────────── */
export default function PromoCodesClient({ promoCodes }: { promoCodes: PromoCodeRow[] }) {
  const [view, setView] = useState<"active" | "inactive">("active");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"onetime" | "recurring">("onetime");

  const activePromos  = promoCodes.filter((p) => p.status === "active");
  const inactivePromos = promoCodes.filter((p) => p.status !== "active");

  function openModal(type: "onetime" | "recurring") {
    setModalType(type);
    setModalOpen(true);
  }

  return (
    <div className="space-y-8 pb-10">
      {/* ═══ Header & Controls ═══ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-cinzel text-xl text-[#d4af37] flex items-center tracking-wider">
            <Tag className="w-6 h-6 mr-3" /> Promo Codes Management
          </h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Promotion Ledger &amp; Controls</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Date filter pill */}
          <div className="glass-panel rounded-lg p-2 flex items-center justify-between w-fit border-[#d4af37]/20 shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
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
            <button className="flex items-center px-4 py-1.5 text-sm font-medium rounded text-gray-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 transition-colors">
              Custom Range
            </button>
          </div>

          {/* Create buttons */}
          <button
            onClick={() => openModal("onetime")}
            className="flex items-center space-x-2 bg-[#020408] border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 font-bold py-2.5 px-4 rounded-lg transition-all whitespace-nowrap"
          >
            <Calendar className="w-4 h-4" />
            <span>+ One-Time Event</span>
          </button>
          <button
            onClick={() => openModal("recurring")}
            className="flex items-center space-x-2 bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold py-2.5 px-4 rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all whitespace-nowrap"
          >
            <Repeat className="w-4 h-4 text-[#020408]" />
            <span>+ Recurring Promo</span>
          </button>
        </div>
      </div>

      {/* ═══ Ledger View Switcher ═══ */}
      <div className="flex justify-center">
        <div className="flex bg-[#020408] rounded-lg border border-white/10 p-1 shadow-lg">
          <button
            onClick={() => setView("active")}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-all flex items-center ${
              view === "active"
                ? "bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/50 shadow-[0_0_10px_rgba(212,175,55,0.2)] font-bold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Activity className="w-4 h-4 mr-2" /> Active Promos
          </button>
          <button
            onClick={() => setView("inactive")}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-all flex items-center ${
              view === "inactive"
                ? "bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/50 shadow-[0_0_10px_rgba(212,175,55,0.2)] font-bold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Archive className="w-4 h-4 mr-2" /> Inactive / Historical
          </button>
        </div>
      </div>

      {/* ═══ DATA GRID ═══ */}
      <div className="glass-panel rounded-lg flex flex-col overflow-hidden min-h-[600px]">
        {/* Active View */}
        {view === "active" && (
          <div className="overflow-x-auto overflow-y-auto flex-1 h-full">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] sticky top-0 z-10 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold w-1/4">Promo Code Name</th>
                  <th className="px-6 py-4 font-semibold w-2/5">Redemptions</th>
                  <th className="px-6 py-4 font-semibold text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activePromos.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-500 text-xs italic">No active promo codes.</td></tr>
                ) : activePromos.map((p) => {
                  const limit = p.max_uses ?? 0;
                  const used = p.current_uses ?? 0;
                  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                  const barColor = percent > 90
                    ? "from-red-500 to-red-400"
                    : percent > 75
                    ? "from-orange-500 to-orange-400"
                    : "from-[#d4af37] to-yellow-300";

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors border-l-2 border-transparent hover:border-l-[#d4af37]">
                      <td className="px-6 py-4">
                        <span className="text-[#d4af37] font-bold tracking-wider font-mono bg-[#d4af37]/10 px-2 py-1 rounded border border-[#d4af37]/20">
                          {p.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full">
                          <div className="flex justify-between text-xs mb-1 font-mono">
                            <span className="text-gray-300">{fmtNum(used)}</span>
                            <span className="text-gray-500">/ {limit > 0 ? fmtNum(limit) : "∞"} Max</span>
                          </div>
                          <div className="w-full bg-[#020408] rounded-full h-2 overflow-hidden border border-white/5">
                            <div
                              className={`bg-gradient-to-r ${barColor} h-full rounded-full transition-all duration-500`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end space-x-2">
                        {/* // TODO: Bind to Server Action — toggle promo status */}
                        <button className="text-gray-400 hover:text-red-400 transition-colors p-1.5 hover:bg-red-400/10 rounded" title="Disable Promo">
                          <PowerOff className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-[#d4af37] transition-colors p-1.5 hover:bg-[#d4af37]/10 rounded" title="Edit Restrictions">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Inactive View */}
        {view === "inactive" && (
          <div className="overflow-x-auto overflow-y-auto flex-1 h-full">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] sticky top-0 z-10 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold w-1/4">Promo Code Name</th>
                  <th className="px-6 py-4 font-semibold w-48">End Reason</th>
                  <th className="px-6 py-4 font-semibold text-right w-32">Total Redemptions</th>
                  <th className="px-6 py-4 font-semibold text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono">
                {inactivePromos.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500 text-xs italic">No historical promo codes.</td></tr>
                ) : inactivePromos.map((p) => {
                  const reasonCls = REASON_STYLE[p.status] ?? REASON_STYLE.paused;
                  const reasonLabel = p.status === "expired" ? "Expired"
                    : p.status === "exhausted" ? "Maxed Out"
                    : "Disabled";
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors border-l-2 border-transparent">
                      <td className="px-6 py-4">
                        <span className="text-gray-400 font-bold tracking-wider bg-white/5 px-2 py-1 rounded border border-white/10">
                          {p.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold tracking-widest uppercase border px-2 py-1 rounded-full ${reasonCls}`}>
                          {reasonLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-gray-300 font-mono">{fmtNum(p.current_uses)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* // TODO: Bind to Server Action — clone promo */}
                        <button className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded" title="Clone Promotion">
                          <Copy className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ Promotion Builder Modal ═══ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
          <div className="glass-panel rounded-lg w-full max-w-xl border-[#d4af37]/30 shadow-[0_10px_40px_rgba(212,175,55,0.15)] flex flex-col my-auto relative">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider">
                {modalType === "onetime" ? (
                  <><Calendar className="w-5 h-5 mr-2" /> Create One-Time Event</>
                ) : (
                  <><Repeat className="w-5 h-5 mr-2" /> Create Recurring Promo</>
                )}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setModalOpen(false); /* TODO: Bind to Server Action */ }}>
                {/* Code Name */}
                <div className="space-y-3">
                  <label className="block text-xs text-gray-400 uppercase tracking-widest font-semibold">Code Name</label>
                  <input
                    type="text"
                    className="w-full bg-[#020408] border border-white/10 rounded text-sm text-white px-3 py-2 focus:outline-none focus:border-[#d4af37]/50 font-mono tracking-wider uppercase transition-colors placeholder-gray-600"
                    placeholder="e.g. FLASH20"
                    required
                  />
                </div>

                {/* Discount Type + Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="block text-xs text-gray-400 uppercase tracking-widest font-semibold">Discount Type</label>
                    <select className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded px-3 py-2 cursor-pointer focus:outline-none focus:border-[#d4af37]/50 transition-colors">
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Value ($)</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs text-gray-400 uppercase tracking-widest font-semibold">Amount</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-[#d4af37] text-sm font-mono">%</span>
                      <input type="number" className="w-full bg-[#020408] border border-white/10 rounded text-sm text-white pl-7 pr-3 py-2 focus:outline-none focus:border-[#d4af37]/50 font-mono transition-colors" min={1} required />
                    </div>
                  </div>
                </div>

                {/* Max Redemptions */}
                <div className="space-y-3">
                  <label className="block text-xs text-gray-400 uppercase tracking-widest font-semibold">Maximum Redemptions</label>
                  <input type="number" className="w-full bg-[#020408] border border-white/10 rounded text-sm text-white px-3 py-2 focus:outline-none focus:border-[#d4af37]/50 font-mono transition-colors" placeholder="e.g. 500" required />
                </div>

                <div className="border-t border-white/10 my-2" />

                {/* Valid Tiers */}
                <div className="space-y-3">
                  <label className="block text-xs text-gray-400 uppercase tracking-widest font-semibold">Valid Tiers</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Skimmer", "Swimmer", "Diver"].map((tier) => (
                      <label key={tier} className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer hover:text-white transition-colors">
                        <input type="checkbox" className="accent-[#d4af37]" defaultChecked={tier !== "Diver"} />
                        <span>{tier}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Min Group Size */}
                <div className="space-y-3">
                  <label className="block text-xs text-gray-400 uppercase tracking-widest font-semibold">Minimum Group Size</label>
                  <input type="number" className="w-full bg-[#020408] border border-white/10 rounded text-sm text-white px-3 py-2 focus:outline-none focus:border-[#d4af37]/50 font-mono transition-colors" placeholder="e.g. 1" min={1} defaultValue={1} required />
                </div>

                <div className="border-t border-white/10 my-2" />

                {/* Time Fencing — One-Time */}
                {modalType === "onetime" && (
                  <div className="bg-[#020408]/50 border border-white/10 rounded-lg p-4 space-y-4">
                    <h4 className="text-sm text-[#d4af37] uppercase tracking-widest font-semibold">One-Time Event</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Start Date</label>
                        <input type="date" className="w-full bg-[#020408] border border-white/10 rounded text-sm text-gray-300 px-3 py-2 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">End Date</label>
                        <input type="date" className="w-full bg-[#020408] border border-white/10 rounded text-sm text-gray-300 px-3 py-2 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Start Time</label>
                        <input type="time" className="w-full bg-[#020408] border border-white/10 rounded text-sm text-gray-300 px-3 py-2 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">End Time</label>
                        <input type="time" className="w-full bg-[#020408] border border-white/10 rounded text-sm text-gray-300 px-3 py-2 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Time Fencing — Recurring */}
                {modalType === "recurring" && (
                  <div className="bg-[#020408]/50 border border-white/10 rounded-lg p-4 space-y-4">
                    <label className="block text-xs text-gray-400 uppercase tracking-widest font-semibold">Recurring Schedule</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Start Date</label>
                        <input type="date" className="w-full bg-[#020408] border border-white/10 rounded text-sm text-gray-300 px-3 py-2 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">End Date</label>
                        <input type="date" className="w-full bg-[#020408] border border-white/10 rounded text-sm text-gray-300 px-3 py-2 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Start Time</label>
                        <input type="time" className="w-full bg-[#020408] border border-white/10 rounded text-sm text-gray-300 px-3 py-2 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">End Time</label>
                        <input type="time" className="w-full bg-[#020408] border border-white/10 rounded text-sm text-gray-300 px-3 py-2 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-2">Valid Visit Days</label>
                      <div className="flex flex-wrap gap-3">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
                          <label key={day} className="flex items-center space-x-1.5 text-sm text-gray-300 cursor-pointer hover:text-white transition-colors">
                            <input type="checkbox" className="accent-[#d4af37]" defaultChecked={idx < 5} />
                            <span>{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-medium rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-sm font-bold rounded bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] transition-all flex items-center"
                  >
                    {/* // TODO: Bind to create_promo_code Server Action */}
                    Generate Promo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Users, Search, MessageSquare, Coffee, Clock, FileText, DownloadCloud } from "lucide-react";
import type { StaffShiftRow } from "./page";

/* ── Helpers ────────────────────────────────────────────────────────── */
interface EnrichedStaff {
  id: string;
  name: string;
  initials: string;
  station: string;
  shiftWindow: string;
  status: "active" | "break" | "clocked_out" | "late";
  shiftEnded: boolean;
}

const STATUS_STYLE: Record<string, { cls: string; borderCls: string }> = {
  active:     { cls: "text-green-400 bg-green-400/10 border-green-500/20", borderCls: "border-gold/30" },
  break:      { cls: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30", borderCls: "border-yellow-500/30" },
  clocked_out:{ cls: "text-gray-400 bg-white/5 border-white/10", borderCls: "border-white/10" },
  late:       { cls: "text-red-400 bg-red-400/10 border-red-500/20", borderCls: "border-red-500/30" },
};

const STATIONS = ["POS Register", "Kitchen Prep", "Beverage Station", "Floater / Runner"];

/* ── Component ──────────────────────────────────────────────────────── */
export default function StaffingClient({ staff, today }: { staff: StaffShiftRow[]; today: string }) {
  const enriched: EnrichedStaff[] = useMemo(() => staff.map((sr) => {
    const todayShift = sr.shift_schedules?.find((sh) => sh.shift_date === today);
    const name = sr.legal_name;
    const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    if (!todayShift) {
      return { id: sr.id, name, initials, station: "Unscheduled", shiftWindow: "—", status: "clocked_out" as const, shiftEnded: true };
    }
    const status = todayShift.status === "break" ? "break" as const
      : todayShift.status === "completed" ? "clocked_out" as const
      : todayShift.status === "late" ? "late" as const
      : "active" as const;
    return {
      id: sr.id,
      name,
      initials,
      station: todayShift.zones?.name ?? "Unassigned",
      shiftWindow: `${todayShift.start_time} → ${todayShift.end_time}`,
      status,
      shiftEnded: status === "clocked_out",
    };
  }), [staff, today]);

  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => enriched.filter((s) => {
    const q = search.toLowerCase();
    if (q && !s.name.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) return false;
    if (stationFilter !== "all" && !s.station.toLowerCase().includes(stationFilter)) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  }), [enriched, search, stationFilter, statusFilter]);

  /* KPIs */
  const totalOnShift = enriched.filter((s) => s.status !== "clocked_out").length;
  const activeOnFloor = enriched.filter((s) => s.status === "active").length;
  const onBreak = enriched.filter((s) => s.status === "break").length;
  const lateNoShow = enriched.filter((s) => s.status === "late").length;

  return (
    <div className="space-y-8 pb-10">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-cinzel text-xl text-[#d4af37] flex items-center tracking-wider">
            <Users className="w-6 h-6 mr-3" /> Café Staffing Roster
          </h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Real-time floor tracking &amp; shift management</p>
        </div>
        <div className="flex items-center space-x-2 bg-[#020408]/50 p-2 rounded border border-white/10">
          <span className="w-2 h-2 rounded-full bg-green-400 ml-2 animate-pulse" />
          <span className="text-xs font-mono text-green-400 px-2 tracking-wide">Live Sync Active</span>
        </div>
      </div>

      {/* ═══ KPI Strip ═══ */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel rounded-lg p-5 border-l-2 border-[#d4af37]">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total on Shift</p>
          <h4 className="font-orbitron text-3xl font-bold text-white">{totalOnShift}</h4>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-green-500">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Active on Floor</p>
          <h4 className="font-orbitron text-3xl font-bold text-white">{activeOnFloor}</h4>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-yellow-500">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Currently on Break</p>
          <h4 className="font-orbitron text-3xl font-bold text-white">{onBreak}</h4>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-gray-600">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Late / No Show</p>
          <h4 className="font-orbitron text-3xl font-bold text-gray-400">{lateNoShow}</h4>
        </div>
      </section>

      {/* ═══ Roster Table ═══ */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[500px]">
          {/* Toolbar */}
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Search Crew Name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" />
            </div>
            <div className="flex items-center space-x-3">
              <select value={stationFilter} onChange={(e) => setStationFilter(e.target.value)} className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                <option value="all">Station: All</option>
                <option value="pos">POS Register</option>
                <option value="kitchen">Kitchen Prep</option>
                <option value="beverage">Beverage Station</option>
                <option value="floater">Floater / Runner</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                <option value="all">Status: All</option>
                <option value="active">Active</option>
                <option value="break">On Break</option>
                <option value="clocked_out">Clocked Out</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Crew Name &amp; ID</th>
                  <th className="px-6 py-4 font-semibold">Current Station / Role</th>
                  <th className="px-6 py-4 font-semibold">Shift Window</th>
                  <th className="px-6 py-4 font-semibold">Real-time Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-xs">No F&amp;B crew found.</td></tr>
                ) : filtered.map((s) => {
                  const style = STATUS_STYLE[s.status] ?? STATUS_STYLE.clocked_out;
                  const avatarColor = s.status === "active" ? "border-[#d4af37]/30 text-[#d4af37]"
                    : s.status === "break" ? "border-yellow-500/30 text-yellow-500"
                    : "border-white/10 text-gray-500";
                  return (
                    <tr key={s.id} className={`hover:bg-white/[0.02] transition-colors group ${s.status === "break" ? "bg-yellow-500/[0.02]" : ""} ${s.shiftEnded ? "opacity-60" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full bg-[#020408] border flex items-center justify-center font-bold font-sans ${avatarColor}`}>{s.initials}</div>
                          <div>
                            <p className={`font-bold font-sans tracking-wide mb-0.5 ${s.shiftEnded ? "text-gray-400" : "text-gray-200"}`}>{s.name}</p>
                            <p className="text-[10px] text-gray-500 font-mono">ID: {s.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {s.status === "active" ? (
                          <select defaultValue={s.station} className="bg-[#020408] border border-white/10 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-[#d4af37] cursor-pointer font-sans">
                            {STATIONS.map((st) => <option key={st} value={st}>{st}</option>)}
                          </select>
                        ) : (
                          <span className={`font-sans text-xs px-2 py-1 ${s.shiftEnded ? "text-gray-500" : "text-gray-400"}`}>{s.shiftEnded ? "Shift Ended" : s.station}</span>
                        )}
                      </td>
                      <td className={`px-6 py-4 text-gray-400 ${s.shiftEnded ? "line-through text-gray-500" : ""}`}>{s.shiftWindow}</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center px-2 py-1 rounded border w-fit ${style.cls}`}>
                          {s.status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2" />}
                          {s.status === "break" && <Coffee className="w-3 h-3 mr-1.5" />}
                          {s.status === "clocked_out" && <Clock className="w-3 h-3 mr-1.5" />}
                          {s.status === "late" && <Clock className="w-3 h-3 mr-1.5" />}
                          {s.status === "active" ? "Active" : s.status === "break" ? "On Break" : s.status === "late" ? "Late / No Show" : "Clocked Out"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {s.shiftEnded ? (
                          <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded" title="View Timesheet"><FileText className="w-4 h-4" /></button>
                        ) : (
                          <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded" title="Send Message"><MessageSquare className="w-4 h-4" /></button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 mt-auto bg-[#020408]/40 flex justify-between items-center text-xs text-gray-400 font-sans">
            <p>Showing {filtered.length} of {enriched.length} scheduled crew members</p>
            <button className="flex items-center text-[#d4af37] hover:text-yellow-300 transition-colors">
              <DownloadCloud className="w-4 h-4 mr-1.5" /> Export Roster (CSV)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

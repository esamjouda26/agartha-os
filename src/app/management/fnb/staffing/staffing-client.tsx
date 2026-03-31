"use client";

import { useState, useMemo } from "react";
import { Users, Search, Clock, CheckCircle2 } from "lucide-react";

export interface FlatStaffShift {
  shift_id: string;
  employee_id: string;
  display_name: string;
  staff_role: string;
  employment_status: string;
  expected_start_time: string;
  expected_end_time: string;
  clock_in: string | null;
  clock_out: string | null;
}

export default function StaffingClient({ staff, today }: { staff: FlatStaffShift[]; today: string }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return "—";
    
    if (timeStr.includes("T")) {
      return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const [h, m] = timeStr.split(":");
    let hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const filtered = useMemo(() => staff.filter((s) => {
    const q = search.toLowerCase();
    if (q && !s.display_name.toLowerCase().includes(q) && !s.employee_id.toLowerCase().includes(q)) return false;
    
    if (roleFilter === "fnb" && s.staff_role !== "fnb_crew") return false;
    if (roleFilter === "giftshop" && s.staff_role !== "giftshop_crew") return false;

    return true;
  }), [staff, search, roleFilter]);

  const activeClockIns = staff.filter(s => s.clock_in && !s.clock_out).length;
  const completedShifts = staff.filter(s => s.clock_out).length;
  const pendingShifts = staff.filter(s => !s.clock_in).length;

  return (
    <div className="space-y-8 pb-10 max-w-screen-2xl mx-auto">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-cinzel text-3xl text-[#d4af37] font-bold tracking-wider flex items-center">
            <Users className="w-8 h-8 mr-3" /> 
            Active Crew Roster
          </h1>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-semibold flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Live Sync: {today}
          </p>
        </div>
      </div>

      {/* ═══ KPI Strip ═══ */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel rounded-lg p-5 border-l-2 border-white/20">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Scheduled Today</p>
          <h4 className="font-orbitron text-3xl font-bold text-white">{staff.length}</h4>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-green-500/50">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Currently Clocked In</p>
          <h4 className="font-orbitron text-3xl font-bold text-green-400">{activeClockIns}</h4>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-yellow-500/50">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Pending Arrival</p>
          <h4 className="font-orbitron text-3xl font-bold text-yellow-400">{pendingShifts}</h4>
        </div>
        <div className="glass-panel rounded-lg p-5 border-l-2 border-blue-500/50">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Completed / Out</p>
          <h4 className="font-orbitron text-3xl font-bold text-gray-400">{completedShifts}</h4>
        </div>
      </section>

      {/* ═══ Roster Table ═══ */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[500px] border-[#d4af37]/30">
          {/* Toolbar */}
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Search Crew Name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#010204] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" />
            </div>
            <div className="flex items-center space-x-3">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="bg-[#010204] border border-white/10 text-xs text-[#d4af37] font-semibold tracking-wide uppercase rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                <option value="all">Role: All Departments</option>
                <option value="fnb">Food & Beverage Crew</option>
                <option value="giftshop">Giftshop Crew</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-[#010204] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Crew Member</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold text-[#d4af37]">Shift Window</th>
                  <th className="px-6 py-4 font-semibold">Actual Clock-In</th>
                  <th className="px-6 py-4 font-semibold">Actual Clock-Out</th>
                  <th className="px-6 py-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500 text-xs text-sans">No active staff scheduled for today.</td></tr>
                ) : filtered.map((s) => {
                  const initials = s.display_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                  const roleName = s.staff_role === "fnb_crew" ? "F&B Crew" : s.staff_role === "giftshop_crew" ? "Giftshop Crew" : "Manager";
                  
                  const status = s.clock_out ? "Completed" : s.clock_in ? "Active" : "Pending";
                  const avatarColor = status === "Active" ? "border-green-500/30 text-green-400 bg-green-400/10" 
                    : status === "Completed" ? "border-white/10 text-gray-500 bg-white/5" 
                    : "border-yellow-500/30 text-yellow-500 bg-yellow-500/10";

                  return (
                    <tr key={s.shift_id} className={`hover:bg-white/[0.02] transition-colors group ${status === "Completed" ? "opacity-60" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-sans border ${avatarColor}`}>
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold font-sans tracking-wide mb-0.5 text-gray-200">{s.display_name}</p>
                            <p className="text-[10px] text-[#d4af37] font-mono tracking-widest">{s.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-[#020408] border border-white/10 px-2 py-1 rounded text-gray-300 font-sans text-[10px] uppercase tracking-widest font-bold">
                          {roleName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#d4af37] font-semibold text-sm">
                        {formatTime(s.expected_start_time)} <span className="text-gray-600 font-normal mx-1">→</span> {formatTime(s.expected_end_time)}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {s.clock_in ? (
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1.5 text-green-500" />
                            {formatTime(s.clock_in)}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {s.clock_out ? (
                          <span className="flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1.5 text-blue-500" />
                            {formatTime(s.clock_out)}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-widest border
                          ${status === "Active" ? "bg-green-500/10 text-green-400 border-green-500/20" 
                          : status === "Completed" ? "bg-white/5 text-gray-500 border-white/10" 
                          : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}
                        `}>
                          {status}
                        </span>
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

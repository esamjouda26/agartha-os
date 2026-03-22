"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { fetchCrewForDeploymentAction, assignCrewToZoneAction, createShiftOverrideAction } from "../actions";
import {
  Radar, Search, ChevronDown, ChevronLeft, ChevronRight, Lock, CheckCircle2,
  Users, UserCheck, UserX, Shield, AlertTriangle,
} from "lucide-react";
import { KpiCard } from "@/components/shared";

// ── Types & Constants ───────────────────────────────────────────────────────

const ROLES: Record<string, string> = {
  fnb_manager: "F&B Manager", merch_manager: "Merch Manager", maintenance_manager: "Maintenance Manager",
  inventory_manager: "Inventory Manager", marketing_manager: "Marketing Manager",
  human_resources_manager: "HR Manager", compliance_manager: "Compliance Manager", operations_manager: "Operations Manager",
  fnb_crew: "F&B Crew", service_crew: "Service Crew", giftshop_crew: "Giftshop Crew",
  runner_crew: "Runner Crew", security_crew: "Security Crew", health_crew: "Health Crew",
  cleaning_crew: "Cleaning Crew", experience_crew: "Experience Crew", internal_maintainence_crew: "Maintenance Crew",
};

const MANAGER_ROLES = ["fnb_manager", "merch_manager", "maintenance_manager", "inventory_manager", "marketing_manager", "human_resources_manager", "compliance_manager", "operations_manager"];
const CREW_ROLES_LIST = ["fnb_crew", "service_crew", "giftshop_crew", "runner_crew", "security_crew", "health_crew", "cleaning_crew", "experience_crew", "internal_maintainence_crew"];

const DISPLAY_GROUPS: Record<string, string[]> = {
  "F&B Crew": ["fnb_crew"], "Service Crew": ["service_crew"], "Security Crew": ["security_crew"],
  "Runner Crew": ["runner_crew"], "Cleaning Crew": ["cleaning_crew"], "Health Crew": ["health_crew"],
  "Experience Crew": ["experience_crew"], "Giftshop Crew": ["giftshop_crew"],
  "Maintenance Crew": ["internal_maintainence_crew"], "Management (View Only)": MANAGER_ROLES,
};

const SHIFTS = [
  { code: "MOR", start: "07:00:00", end: "15:00:00", color: "#38bdf8" },
  { code: "EVE", start: "15:00:00", end: "23:00:00", color: "#a78bfa" },
  { code: "NIG", start: "23:00:00", end: "07:00:00", color: "#f87171" },
];

function dateStr(d: Date) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function formatDate(d: string) { return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }

// ── Page ────────────────────────────────────────────────────────────────────

export default function CrewDeploymentPage() {
  const [opsDate, setOpsDate] = useState(dateStr(new Date()));
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [staffList, setStaffList] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [shiftsData, setShiftsData] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [zonesData, setZonesData] = useState<any[]>([]);
  
  const [shiftDropdown, setShiftDropdown] = useState<string | null>(null);
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    let active = true;
    fetchCrewForDeploymentAction(opsDate).then((res) => {
      if (active) {
        setStaffList(res.staff);
        setShiftsData(res.shifts);
        setZonesData(res.zones);
      }
    });
    return () => { active = false; };
  }, [opsDate]);

  function stepDate(dir: number) {
    const d = new Date(opsDate + "T00:00:00");
    d.setDate(d.getDate() + dir);
    setOpsDate(dateStr(d));
  }

  function toggleGroup(groupId: string) {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  function applyShiftOverride(staffId: string, shiftCode: string) {
    setShiftDropdown(null);
    if (shiftCode === "__OFF__") {
        return;
    }
    const foundShift = SHIFTS.find(s => s.code === shiftCode);
    if (!foundShift) return;

    startTransition(async () => {
      const res = await createShiftOverrideAction({
        staff_record_id: staffId,
        shift_date: opsDate,
        start_time: foundShift.start,
        end_time: foundShift.end,
      });
      if (res.success) {
        showToast(`✅ Shift override applied`);
        fetchCrewForDeploymentAction(opsDate).then(d => { setShiftsData(d.shifts); setStaffList(d.staff); setZonesData(d.zones); });
      } else {
        showToast(`Error: ${res.error}`);
      }
    });
  }

  // Helper
  const employeesMap = useMemo(() => {
    return staffList.map(emp => {
      const pShift = shiftsData.find(s => s.staff_record_id === emp.id);
      let defaultShift = null;
      let isOverride = false;
      if (pShift) {
        const match = SHIFTS.find(s => s.start === pShift.start_time);
        defaultShift = match ? match.code : "MOR";
        if (pShift.status === "override") isOverride = true;
      }
      return { ...emp, activeShift: pShift, defaultShift, isOverride, name: emp.legal_name };
    });
  }, [staffList, shiftsData]);

  const stats = useMemo(() => {
    let total = 0, onShift = 0, offDuty = 0, mgrCount = 0, overrideCount = 0;
    employeesMap.forEach((emp) => {
      const mgr = MANAGER_ROLES.includes(emp.role);
      const isShiftActive = !!emp.activeShift;
      if (emp.isOverride) overrideCount++;
      if (mgr) mgrCount++;
      else { total++; if (isShiftActive) onShift++; else offDuty++; }
    });
    return { total, onShift, offDuty, mgrCount, overrideCount };
  }, [employeesMap]);

  return (
    <div className="space-y-5 pb-10" onClick={() => { setShiftDropdown(null); setRoleDropdown(null); }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-orbitron text-[10px] text-emerald-400 tracking-widest uppercase">Live Roster</span>
          </div>
          <div className="flex items-center gap-1 bg-[#020408]/60 border border-white/10 rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <input type="text" placeholder="Search crew..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-gray-300 focus:outline-none w-28 placeholder-gray-600" />
          </div>
        </div>
      </div>

      {/* ── Date Control ────────────────────────────────────────── */}
      <div className="glass-panel rounded-lg p-4 flex flex-wrap items-end gap-4">
        <div className="flex-1 max-w-xs">
          <label className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mb-1">Operational Date</label>
          <input type="date" value={opsDate} onChange={(e) => setOpsDate(e.target.value)}
            className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] transition-all" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => stepDate(-1)} className="px-3 py-2 rounded border border-white/10 text-gray-400 hover:text-[#d4af37] hover:border-[rgba(212,175,55,0.3)] transition-all"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setOpsDate(dateStr(new Date()))} className="px-3 py-2 rounded border border-white/10 text-gray-400 hover:text-[#d4af37] hover:border-[rgba(212,175,55,0.3)] transition-all text-xs font-semibold uppercase tracking-wider">Today</button>
          <button onClick={() => stepDate(1)} className="px-3 py-2 rounded border border-white/10 text-gray-400 hover:text-[#d4af37] hover:border-[rgba(212,175,55,0.3)] transition-all"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-gray-400">{formatDate(opsDate)}</div>
          <div className="text-[10px] text-gray-600">{stats.overrideCount > 0 ? `${stats.overrideCount} active override(s)` : "No overrides"}</div>
        </div>
      </div>

      {/* ── Summary Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard title="Total Crew" value={stats.total} icon={Users}
          subtitle={`${stats.total + stats.mgrCount} total personnel`} />
        <KpiCard title="On Shift" value={stats.onShift} icon={UserCheck}
          variant="success"
          subtitle={stats.total > 0 ? `${Math.round((stats.onShift / stats.total) * 100)}% deployed` : "—"} />
        <KpiCard title="Off Duty" value={stats.offDuty} icon={UserX}
          subtitle="Available pool" />
        <KpiCard title="Managers On Site" value={stats.mgrCount} icon={Shield}
          subtitle="Supervisory staff" />
        <KpiCard title="Active Overrides" value={stats.overrideCount} icon={AlertTriangle}
          variant={stats.overrideCount > 3 ? "warning" : "default"}
          subtitle="Shift changes today" />
      </div>

      {/* ── Data Grid ───────────────────────────────────────────── */}
      <div className="glass-panel rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#010204]">
          <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
             daily_shift_overrides — resolved roster
          </h4>
          <span className="text-[10px] text-gray-600 font-mono">{stats.total + stats.mgrCount} personnel · {stats.overrideCount} overrides</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-gray-500 uppercase tracking-wider bg-[#010204] sticky top-0 z-10 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 font-semibold w-48 min-w-[180px]">Employee</th>
                <th className="px-3 py-3 font-semibold text-center w-24">Resolved Shift</th>
                <th className="px-3 py-3 font-semibold text-center w-36">Deployed Role</th>
                <th className="px-3 py-3 font-semibold text-center w-28">Source</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(DISPLAY_GROUPS).map(([groupName, roleKeys]) => {
                const groupEmps = employeesMap.filter((emp) => {
                  if (!roleKeys.includes(emp.role)) return false;
                  if (search && !emp.name.toLowerCase().includes(search.toLowerCase()) && !emp.employee_id.toLowerCase().includes(search.toLowerCase())) return false;
                  return true;
                });
                if (groupEmps.length === 0) return null;
                const groupId = "grp-" + groupName.replace(/[^a-zA-Z]/g, "");
                const isCollapsed = collapsedGroups[groupId] || false;
                const isMgrGroup = groupName.includes("Management");
                return (
                  <GroupRows key={groupId} groupId={groupId} groupName={groupName} isMgr={isMgrGroup} emps={groupEmps}
                    isCollapsed={isCollapsed} toggleGroup={toggleGroup} opsDate={opsDate} 
                    shiftDropdown={shiftDropdown} setShiftDropdown={setShiftDropdown} roleDropdown={roleDropdown} setRoleDropdown={setRoleDropdown}
                    applyShiftOverride={applyShiftOverride} />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 right-8 bg-green-500/20 border border-green-500/40 text-green-400 px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle2 className="w-5 h-5" /><span>{toast}</span>
        </div>
      )}
    </div>
  );
}

// ── Group Rows Component ────────────────────────────────────────────────────

function GroupRows({ groupId, groupName, isMgr, emps, isCollapsed, toggleGroup, opsDate, 
  shiftDropdown, setShiftDropdown, roleDropdown, setRoleDropdown,
  applyShiftOverride,
}: {
  groupId: string; groupName: string; isMgr: boolean; emps: any[]; isCollapsed: boolean;
  toggleGroup: (id: string) => void; opsDate: string;
  shiftDropdown: string | null; setShiftDropdown: (id: string | null) => void;
  roleDropdown: string | null; setRoleDropdown: (id: string | null) => void;
  applyShiftOverride: (empId: string, code: string) => void; 
}) {
  return (
    <>
      <tr>
        <td colSpan={5} className="bg-[#020408]/95 border-b border-[rgba(212,175,55,0.15)] px-4 py-2 cursor-pointer select-none hover:bg-[rgba(212,175,55,0.04)]"
          onClick={() => toggleGroup(groupId)}>
          <div className="flex items-center gap-2">
            <ChevronDown className={`w-3.5 h-3.5 text-[#d4af37]/60 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
            <span className="text-xs font-bold text-[#d4af37]/80 uppercase tracking-wider">{groupName}</span>
            <span className="text-[10px] text-gray-500 font-mono ml-1">{emps.length} staff</span>
            {isMgr && <Lock className="w-2.5 h-2.5 text-[#d4af37]/60 ml-1" />}
          </div>
        </td>
      </tr>
      {!isCollapsed && emps.map((emp) => {
        const mgr = MANAGER_ROLES.includes(emp.role);
        const resolvedCode = emp.defaultShift;
        const resShift = SHIFTS.find((s) => s.code === resolvedCode);
        const isOff = !resShift;

        return (
          <tr key={emp.id} className="border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors">
            <td className="px-4 py-2">
              <div className="flex items-center gap-2">
                {mgr && <Lock className="w-2.5 h-2.5 text-[#d4af37]/60" />}
                <div>
                  <div className="text-xs text-white font-medium">{emp.name}</div>
                  <div className="text-[10px] text-gray-500 font-mono">{emp.employee_id}</div>
                </div>
              </div>
            </td>
            <td className="px-3 py-2 text-center">
              <div className="inline-block relative">
                <div className={`inline-flex items-center justify-center min-w-[56px] h-[28px] rounded text-[10px] font-bold uppercase tracking-widest border ${mgr ? "opacity-50 cursor-default" : "cursor-pointer hover:scale-105 transition-transform"} ${emp.isOverride ? "border-dashed" : ""}`}
                  style={{
                    background: isOff ? "rgba(239,68,68,0.08)" : resShift && emp.isOverride ? "rgba(245,158,11,0.12)" : resShift ? resShift.color + "15" : "transparent",
                    color: isOff ? "#f87171" : resShift && emp.isOverride ? "#f59e0b" : resShift ? resShift.color : "#4b5563",
                    borderColor: isOff ? "rgba(239,68,68,0.3)" : resShift && emp.isOverride ? "rgba(245,158,11,0.4)" : resShift ? resShift.color + "30" : "rgba(255,255,255,0.05)",
                  }}
                  onClick={(e) => { if (mgr) return; e.stopPropagation(); setRoleDropdown(null); setShiftDropdown(shiftDropdown === emp.id ? null : emp.id); }}>
                  {isOff ? "OFF" : resShift ? resShift.code : "OFF"}
                </div>
                {shiftDropdown === emp.id && !mgr && (
                  <div className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 z-[45] bg-[rgba(10,20,30,0.97)] border border-white/12 rounded-md min-w-[140px] max-h-[220px] overflow-y-auto shadow-[0_8px_28px_rgba(0,0,0,0.7)]"
                    onClick={(e) => e.stopPropagation()}>
                    {SHIFTS.map((s) => (
                      <button key={s.code} onClick={() => applyShiftOverride(emp.id, s.code)}
                        className={`block w-full text-left px-2.5 py-[7px] text-[10px] text-gray-300 hover:bg-[rgba(212,175,55,0.08)] hover:text-[#d4af37] ${s.code === resolvedCode ? "!text-[#d4af37] font-bold" : ""}`}>
                        <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: s.color }} /> <span className="font-mono font-bold mr-1">{s.code}</span>
                      </button>
                    ))}
                    <div className="border-t border-white/5" />
                    <button onClick={() => applyShiftOverride(emp.id, "__OFF__")} className="block w-full text-left px-2.5 py-[7px] text-[10px] text-red-400 hover:bg-[rgba(248,113,113,0.08)]">
                      <span className="inline-block w-2 h-2 rounded-full mr-1.5 bg-gray-600" /> Mark OFF
                    </button>
                  </div>
                )}
              </div>
            </td>
            <td className="px-3 py-2 text-center">
              <div className="inline-block relative">
                <div className={`inline-flex items-center justify-center min-w-[70px] h-[24px] rounded text-[9px] font-semibold tracking-wider border px-2 ${mgr ? "opacity-50 cursor-default" : "cursor-pointer hover:scale-105 transition-transform"}`}
                  style={{ background: "rgba(255,255,255,0.03)", color: "#9ca3af", borderColor: "rgba(255,255,255,0.08)"}}>
                  {ROLES[emp.role] || emp.role}
                </div>
              </div>
            </td>
            <td className="px-3 py-2 text-center">
              {emp.isOverride ? (
                <span className="text-[9px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                  SHIFT OVERRIDE
                </span>
              ) : (
                <span className="text-[9px] text-gray-600">default</span>
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
}

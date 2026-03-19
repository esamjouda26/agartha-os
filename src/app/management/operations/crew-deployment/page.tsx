"use client";

import { useState, useMemo } from "react";
import {
  Radar, Search, ChevronDown, ChevronLeft, ChevronRight, Lock, CheckCircle2,
} from "lucide-react";

// ── Types & Constants ───────────────────────────────────────────────────────

const ZONES = [
  { id: "Z-01", name: "The Grand Atrium" }, { id: "Z-02", name: "Crystal Caverns" },
  { id: "Z-03", name: "Verdant Canopy" }, { id: "Z-04", name: "Obsidian Falls" },
  { id: "Z-05", name: "Ember Forge District" }, { id: "Z-06", name: "Azure Depths Aquarium" },
  { id: "Z-07", name: "Starlight Amphitheatre" }, { id: "Z-08", name: "Twilight Bazaar" },
  { id: "Z-09", name: "The Labyrinth" }, { id: "Z-10", name: "Solstice Gardens" },
  { id: "Z-11", name: "Ironheart Coliseum" }, { id: "Z-12", name: "Sanctum of Echoes" },
];

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
  { code: "MOR", start: "07:00", end: "15:00", color: "#38bdf8" },
  { code: "EVE", start: "15:00", end: "23:00", color: "#a78bfa" },
  { code: "NIG", start: "23:00", end: "07:00", color: "#f87171" },
];

interface Employee {
  id: string; name: string; role: string; zone: string | null; defaultShift: string | null;
}

// Simulated roster matching legacy
const EMPLOYEES: Employee[] = [
  { id: "EMP-3K4L5M6N", name: "Tan Siew Ling", role: "fnb_manager", zone: "Z-08", defaultShift: "MOR" },
  { id: "EMP-4E5F6G7H", name: "Vikram Singh", role: "operations_manager", zone: "Z-01", defaultShift: "MOR" },
  { id: "EMP-MN01OP23", name: "Lim Chen Yee", role: "maintenance_manager", zone: "Z-05", defaultShift: "MOR" },
  { id: "EMP-QR45ST67", name: "Norazlina binti Samad", role: "merch_manager", zone: "Z-08", defaultShift: "MOR" },
  { id: "EMP-UV89WX01", name: "Dato Harun Ibrahim", role: "compliance_manager", zone: "Z-01", defaultShift: "MOR" },
  { id: "EMP-YZ23AB45", name: "Deepa Narayanan", role: "human_resources_manager", zone: "Z-07", defaultShift: "MOR" },
  { id: "EMP-8F2A3B91", name: "Ahmad Razif", role: "fnb_crew", zone: "Z-08", defaultShift: "MOR" },
  { id: "EMP-1D4E6F78", name: "Chen Wei Lin", role: "security_crew", zone: "Z-01", defaultShift: "MOR" },
  { id: "EMP-9A2B3C4D", name: "Nur Aisyah", role: "giftshop_crew", zone: "Z-08", defaultShift: "EVE" },
  { id: "EMP-5E6F7A8B", name: "Rajesh Krishnan", role: "health_crew", zone: "Z-11", defaultShift: "MOR" },
  { id: "EMP-7G8H9I0J", name: "Irfan Yusof", role: "internal_maintainence_crew", zone: "Z-05", defaultShift: "EVE" },
  { id: "EMP-8O9P0Q1R", name: "Amirul Hakim", role: "security_crew", zone: "Z-01", defaultShift: "MOR" },
  { id: "EMP-0A1B2C3D", name: "Fatimah Abdullah", role: "cleaning_crew", zone: "Z-03", defaultShift: "MOR" },
  { id: "EMP-CD12EF34", name: "Hafiz Nazri", role: "runner_crew", zone: "Z-02", defaultShift: "EVE" },
  { id: "EMP-GH56IJ78", name: "Priya Devi", role: "service_crew", zone: "Z-07", defaultShift: "MOR" },
  { id: "EMP-KL90MN12", name: "Zul Faqar", role: "experience_crew", zone: "Z-09", defaultShift: "NIG" },
  { id: "EMP-OP34QR56", name: "Mei Ling Chong", role: "fnb_crew", zone: "Z-06", defaultShift: "MOR" },
  { id: "EMP-ST78UV90", name: "Arjun Suresh", role: "security_crew", zone: "Z-11", defaultShift: "EVE" },
  { id: "EMP-WX12YZ34", name: "Nadia Ismail", role: "cleaning_crew", zone: "Z-04", defaultShift: "MOR" },
  { id: "EMP-AB56CD78", name: "Khairul Anuar", role: "runner_crew", zone: "Z-10", defaultShift: "EVE" },
  { id: "EMP-EF90GH12", name: "Siti Zara", role: "service_crew", zone: "Z-12", defaultShift: "NIG" },
  { id: "EMP-IJ34KL56", name: "Daniel Tan", role: "experience_crew", zone: "Z-07", defaultShift: "MOR" },
  { id: "EMP-MN78OP90", name: "Norliza Karim", role: "fnb_crew", zone: "Z-03", defaultShift: "EVE" },
  { id: "EMP-QR12ST34", name: "Ravi Muthu", role: "security_crew", zone: null, defaultShift: null },
  { id: "EMP-UV56WX78", name: "Hana Yusof", role: "service_crew", zone: null, defaultShift: null },
  { id: "EMP-YZ90AB12", name: "Ahmad Faizal", role: "runner_crew", zone: null, defaultShift: null },
  { id: "EMP-CD34EF56", name: "Siew Peng Ong", role: "cleaning_crew", zone: null, defaultShift: null },
  { id: "EMP-GH78IJ90", name: "Kumaresh Pillay", role: "security_crew", zone: null, defaultShift: null },
];

function dateStr(d: Date) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function formatDate(d: string) { return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }

// ── Page ────────────────────────────────────────────────────────────────────

export default function CrewDeploymentPage() {
  const [opsDate, setOpsDate] = useState(dateStr(new Date()));
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [overrides, setOverrides] = useState<Record<string, Record<string, { shift?: string; role?: string }>>>({});
  const [shiftDropdown, setShiftDropdown] = useState<string | null>(null);
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  function stepDate(dir: number) {
    const d = new Date(opsDate + "T00:00:00");
    d.setDate(d.getDate() + dir);
    setOpsDate(dateStr(d));
  }

  function toggleGroup(groupId: string) {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  function applyShiftOverride(empId: string, shift: string) {
    setOverrides((prev) => ({ ...prev, [opsDate]: { ...(prev[opsDate] || {}), [empId]: { ...(prev[opsDate]?.[empId] || {}), shift } } }));
    setShiftDropdown(null);
    showToast(`✅ Shift override: ${shift === "__OFF__" ? "OFF" : shift}`);
  }

  function clearShiftOverride(empId: string) {
    setOverrides((prev) => {
      const day = { ...(prev[opsDate] || {}) };
      if (day[empId]) { const { shift: _, ...rest } = day[empId]; day[empId] = rest; if (Object.keys(day[empId]).length === 0) delete day[empId]; }
      return { ...prev, [opsDate]: day };
    });
    setShiftDropdown(null);
    showToast("Shift override cleared.");
  }

  function applyRoleOverride(empId: string, role: string) {
    const emp = EMPLOYEES.find((e) => e.id === empId);
    if (emp && role === emp.role) { clearRoleOverride(empId); return; }
    setOverrides((prev) => ({ ...prev, [opsDate]: { ...(prev[opsDate] || {}), [empId]: { ...(prev[opsDate]?.[empId] || {}), role } } }));
    setRoleDropdown(null);
    showToast(`✅ Role override: ${ROLES[role]}`);
  }

  function clearRoleOverride(empId: string) {
    setOverrides((prev) => {
      const day = { ...(prev[opsDate] || {}) };
      if (day[empId]) { const { role: _, ...rest } = day[empId]; day[empId] = rest; if (Object.keys(day[empId]).length === 0) delete day[empId]; }
      return { ...prev, [opsDate]: day };
    });
    setRoleDropdown(null);
    showToast("Role override cleared.");
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    let total = 0, onShift = 0, offDuty = 0, mgrCount = 0, overrideCount = 0;
    EMPLOYEES.forEach((emp) => {
      const mgr = MANAGER_ROLES.includes(emp.role);
      const ov = overrides[opsDate]?.[emp.id];
      const hasShiftOv = ov?.shift !== undefined;
      const hasRoleOv = ov?.role !== undefined;
      if (hasShiftOv || hasRoleOv) overrideCount++;
      const resolvedCode = hasShiftOv ? (ov!.shift === "__OFF__" ? null : ov!.shift) : emp.defaultShift;
      if (mgr) mgrCount++;
      else { total++; if (resolvedCode) onShift++; else offDuty++; }
    });
    return { total, onShift, offDuty, mgrCount, overrideCount };
  }, [opsDate, overrides]);

  return (
    <div className="space-y-5 pb-10" onClick={() => { setShiftDropdown(null); setRoleDropdown(null); }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider">
            <Radar className="w-5 h-5 mr-2" /> Tactical Crew Deployment
          </h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Resolved Daily Schedule — Operational Overrides Only</p>
        </div>
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
        {[
          { label: "Total Crew", value: stats.total, color: "text-white" },
          { label: "On Shift", value: stats.onShift, color: "text-emerald-400" },
          { label: "Off Duty", value: stats.offDuty, color: "text-gray-500" },
          { label: "Managers On Site", value: stats.mgrCount, color: "text-[#d4af37]" },
          { label: "Active Overrides", value: stats.overrideCount, color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[#020408]/40 border border-white/5 rounded-lg px-4 py-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">{s.label}</p>
            <p className={`font-orbitron text-xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Legend ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-1">
        <div className="flex items-center gap-3 text-[9px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500/50" /> Scheduled (Default)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500/50 border border-dashed border-amber-500/50" /> Override (Ops)</span>
          <span className="flex items-center gap-1"><Lock className="w-2.5 h-2.5 text-[#d4af37]/60" /> Manager (Locked)</span>
        </div>
      </div>

      {/* ── Data Grid ───────────────────────────────────────────── */}
      <div className="glass-panel rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#010204]">
          <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> daily_shift_overrides — resolved roster
          </h4>
          <span className="text-[10px] text-gray-600 font-mono">{stats.total + stats.mgrCount} personnel · {stats.overrideCount} overrides</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-gray-500 uppercase tracking-wider bg-[#010204] sticky top-0 z-10 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 font-semibold w-48 min-w-[180px]">Employee</th>
                <th className="px-3 py-3 font-semibold text-center w-24">Default Shift</th>
                <th className="px-3 py-3 font-semibold text-center w-24">Resolved Shift</th>
                <th className="px-3 py-3 font-semibold text-center w-36">Deployed Role</th>
                <th className="px-3 py-3 font-semibold text-center w-28">Source</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(DISPLAY_GROUPS).map(([groupName, roleKeys]) => {
                const groupEmps = EMPLOYEES.filter((emp) => {
                  if (!roleKeys.includes(emp.role)) return false;
                  if (search && !emp.name.toLowerCase().includes(search.toLowerCase()) && !emp.id.toLowerCase().includes(search.toLowerCase())) return false;
                  return true;
                });
                if (groupEmps.length === 0) return null;
                const groupId = "grp-" + groupName.replace(/[^a-zA-Z]/g, "");
                const isCollapsed = collapsedGroups[groupId] || false;
                const isMgrGroup = groupName.includes("Management");
                return (
                  <GroupRows key={groupId} groupId={groupId} groupName={groupName} isMgr={isMgrGroup} emps={groupEmps}
                    isCollapsed={isCollapsed} toggleGroup={toggleGroup} opsDate={opsDate} overrides={overrides}
                    shiftDropdown={shiftDropdown} setShiftDropdown={setShiftDropdown} roleDropdown={roleDropdown} setRoleDropdown={setRoleDropdown}
                    applyShiftOverride={applyShiftOverride} clearShiftOverride={clearShiftOverride}
                    applyRoleOverride={applyRoleOverride} clearRoleOverride={clearRoleOverride} />
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

function GroupRows({ groupId, groupName, isMgr, emps, isCollapsed, toggleGroup, opsDate, overrides,
  shiftDropdown, setShiftDropdown, roleDropdown, setRoleDropdown,
  applyShiftOverride, clearShiftOverride, applyRoleOverride, clearRoleOverride,
}: {
  groupId: string; groupName: string; isMgr: boolean; emps: Employee[]; isCollapsed: boolean;
  toggleGroup: (id: string) => void; opsDate: string;
  overrides: Record<string, Record<string, { shift?: string; role?: string }>>;
  shiftDropdown: string | null; setShiftDropdown: (id: string | null) => void;
  roleDropdown: string | null; setRoleDropdown: (id: string | null) => void;
  applyShiftOverride: (empId: string, code: string) => void; clearShiftOverride: (empId: string) => void;
  applyRoleOverride: (empId: string, role: string) => void; clearRoleOverride: (empId: string) => void;
}) {
  return (
    <>
      {/* Group Header */}
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
      {/* Employee Rows */}
      {!isCollapsed && emps.map((emp) => {
        const mgr = MANAGER_ROLES.includes(emp.role);
        const ov = overrides[opsDate]?.[emp.id];
        const hasShiftOv = ov?.shift !== undefined;
        const hasRoleOv = ov?.role !== undefined;
        const resolvedCode = hasShiftOv ? (ov!.shift === "__OFF__" ? null : ov!.shift) : emp.defaultShift;
        const resolvedRole = hasRoleOv ? ov!.role! : emp.role;
        const defShift = SHIFTS.find((s) => s.code === emp.defaultShift);
        const resShift = SHIFTS.find((s) => s.code === resolvedCode);
        const isOff = hasShiftOv && ov!.shift === "__OFF__";

        const sourceFlags: string[] = [];
        if (hasShiftOv) sourceFlags.push("SHIFT");
        if (hasRoleOv) sourceFlags.push("ROLE");

        return (
          <tr key={emp.id} className="border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors">
            <td className="px-4 py-2">
              <div className="flex items-center gap-2">
                {mgr && <Lock className="w-2.5 h-2.5 text-[#d4af37]/60" />}
                <div>
                  <div className="text-xs text-white font-medium">{emp.name}</div>
                  <div className="text-[10px] text-gray-500 font-mono">{emp.id.substring(0, 12)}…</div>
                </div>
              </div>
            </td>
            {/* Default Shift */}
            <td className="px-3 py-2 text-center">
              <span className="inline-flex items-center justify-center min-w-[48px] h-[24px] rounded text-[10px] font-bold"
                style={{ background: defShift ? defShift.color + "15" : "transparent", color: defShift ? defShift.color : "#4b5563" }}>
                {defShift ? defShift.code : "OFF"}
              </span>
            </td>
            {/* Resolved Shift */}
            <td className="px-3 py-2 text-center">
              <div className="inline-block relative">
                <div className={`inline-flex items-center justify-center min-w-[56px] h-[28px] rounded text-[10px] font-bold uppercase tracking-widest border ${mgr ? "opacity-50 cursor-default" : "cursor-pointer hover:scale-105 transition-transform"} ${hasShiftOv ? "border-dashed" : ""}`}
                  style={{
                    background: isOff ? "rgba(239,68,68,0.08)" : resShift && hasShiftOv ? "rgba(245,158,11,0.12)" : resShift ? resShift.color + "15" : "transparent",
                    color: isOff ? "#f87171" : resShift && hasShiftOv ? "#f59e0b" : resShift ? resShift.color : "#4b5563",
                    borderColor: isOff ? "rgba(239,68,68,0.3)" : resShift && hasShiftOv ? "rgba(245,158,11,0.4)" : resShift ? resShift.color + "30" : "rgba(255,255,255,0.05)",
                  }}
                  onClick={(e) => { if (mgr) return; e.stopPropagation(); setRoleDropdown(null); setShiftDropdown(shiftDropdown === emp.id ? null : emp.id); }}>
                  {isOff ? "OFF" : resShift ? resShift.code : "OFF"}
                </div>
                {/* Shift Dropdown */}
                {shiftDropdown === emp.id && !mgr && (
                  <div className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 z-[45] bg-[rgba(10,20,30,0.97)] border border-white/12 rounded-md min-w-[140px] max-h-[220px] overflow-y-auto shadow-[0_8px_28px_rgba(0,0,0,0.7)]"
                    onClick={(e) => e.stopPropagation()}>
                    {SHIFTS.map((s) => (
                      <button key={s.code} onClick={() => applyShiftOverride(emp.id, s.code)}
                        className={`block w-full text-left px-2.5 py-[7px] text-[10px] text-gray-300 hover:bg-[rgba(212,175,55,0.08)] hover:text-[#d4af37] ${s.code === resolvedCode ? "!text-[#d4af37] font-bold" : ""}`}>
                        <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: s.color }} /> <span className="font-mono font-bold mr-1">{s.code}</span> {s.start}–{s.end}
                      </button>
                    ))}
                    <div className="border-t border-white/5" />
                    <button onClick={() => applyShiftOverride(emp.id, "__OFF__")} className="block w-full text-left px-2.5 py-[7px] text-[10px] text-red-400 hover:bg-[rgba(248,113,113,0.08)]">
                      <span className="inline-block w-2 h-2 rounded-full mr-1.5 bg-gray-600" /> Mark OFF
                    </button>
                    {hasShiftOv && (
                      <>
                        <div className="border-t border-white/5" />
                        <button onClick={() => clearShiftOverride(emp.id)} className="block w-full text-left px-2.5 py-[7px] text-[10px] text-gray-400 hover:text-[#d4af37]">↺ Reset to Default</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </td>
            {/* Deployed Role */}
            <td className="px-3 py-2 text-center">
              <div className="inline-block relative">
                <div className={`inline-flex items-center justify-center min-w-[70px] h-[24px] rounded text-[9px] font-semibold tracking-wider border px-2 ${mgr ? "opacity-50 cursor-default" : "cursor-pointer hover:scale-105 transition-transform"} ${hasRoleOv ? "border-dashed" : ""}`}
                  style={{
                    background: hasRoleOv ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.03)",
                    color: hasRoleOv ? "#f59e0b" : "#9ca3af",
                    borderColor: hasRoleOv ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.08)",
                  }}
                  onClick={(e) => { if (mgr) return; e.stopPropagation(); setShiftDropdown(null); setRoleDropdown(roleDropdown === emp.id ? null : emp.id); }}>
                  {ROLES[resolvedRole] || resolvedRole}
                </div>
                {/* Role Dropdown */}
                {roleDropdown === emp.id && !mgr && (
                  <div className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 z-[45] bg-[rgba(10,20,30,0.97)] border border-white/12 rounded-md min-w-[180px] max-h-[220px] overflow-y-auto shadow-[0_8px_28px_rgba(0,0,0,0.7)]"
                    onClick={(e) => e.stopPropagation()}>
                    <div className="px-2.5 py-1 text-[9px] font-bold text-gray-500 uppercase tracking-wider bg-white/[0.02]">Crew Roles</div>
                    {CREW_ROLES_LIST.map((rk) => (
                      <button key={rk} onClick={() => applyRoleOverride(emp.id, rk)}
                        className={`block w-full text-left px-2.5 py-[7px] text-[10px] text-gray-300 hover:bg-[rgba(212,175,55,0.08)] hover:text-[#d4af37] ${rk === resolvedRole ? "!text-[#d4af37] font-bold" : ""}`}>
                        {ROLES[rk]}
                      </button>
                    ))}
                    {hasRoleOv && (
                      <>
                        <div className="border-t border-white/5" />
                        <button onClick={() => clearRoleOverride(emp.id)} className="block w-full text-left px-2.5 py-[7px] text-[10px] text-gray-400 hover:text-[#d4af37]">↺ Reset to Contract Role</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </td>
            {/* Source */}
            <td className="px-3 py-2 text-center">
              {sourceFlags.length > 0 ? (
                <span className="text-[9px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                  {sourceFlags.join(" + ")} OVERRIDE
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

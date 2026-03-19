"use client";

import { useState, useMemo } from "react";
import {
  CalendarClock, PlusCircle, Clock, X, ChevronLeft, ChevronRight,
  ChevronDown, Radio, Table2, CheckCircle2,
} from "lucide-react";

// ── Types & Data ────────────────────────────────────────────────────────────

const ROLES: Record<string, string> = {
  it_admin: "IT Admin", business_admin: "Business Admin",
  fnb_manager: "F&B Manager", merch_manager: "Merch Manager", maintenance_manager: "Maintenance Manager",
  inventory_manager: "Inventory Manager", marketing_manager: "Marketing Manager",
  human_resources_manager: "HR Manager", compliance_manager: "Compliance Manager", operations_manager: "Operations Manager",
  fnb_crew: "F&B Crew", service_crew: "Service Crew", giftshop_crew: "Giftshop Crew",
  runner_crew: "Runner Crew", security_crew: "Security Crew", health_crew: "Health Crew",
  cleaning_crew: "Cleaning Crew", experience_crew: "Experience Crew", internal_maintainence_crew: "Internal Maintenance Crew",
};

const EMPLOYEES = [
  { id: "EMP-8F2A3B91", name: "Ahmad Razif", role: "fnb_crew", status: "active" },
  { id: "EMP-1D4E6F78", name: "Chen Wei Lin", role: "security_crew", status: "active" },
  { id: "EMP-9A2B3C4D", name: "Nur Aisyah", role: "giftshop_crew", status: "active" },
  { id: "EMP-5E6F7A8B", name: "Rajesh Krishnan", role: "health_crew", status: "active" },
  { id: "EMP-7G8H9I0J", name: "Muhammad Irfan", role: "internal_maintainence_crew", status: "active" },
  { id: "EMP-3K4L5M6N", name: "Tan Siew Ling", role: "fnb_manager", status: "active" },
  { id: "EMP-8O9P0Q1R", name: "Amirul Hakim", role: "security_crew", status: "active" },
  { id: "EMP-6W7X8Y9Z", name: "Lee Jia Hao", role: "it_admin", status: "active" },
  { id: "EMP-0A1B2C3D", name: "Fatimah Abdullah", role: "cleaning_crew", status: "active" },
  { id: "EMP-4E5F6G7H", name: "Vikram Singh", role: "operations_manager", status: "active" },
  { id: "EMP-F1G2H3I4", name: "Zainab Kamil", role: "fnb_crew", status: "active" },
  { id: "EMP-J5K6L7M8", name: "Daniel Lim", role: "service_crew", status: "active" },
  { id: "EMP-N9O0P1Q2", name: "Priya Devi", role: "giftshop_crew", status: "active" },
  { id: "EMP-R3S4T5U6", name: "Hafiz bin Razak", role: "fnb_crew", status: "active" },
  { id: "EMP-V7W8X9Y0", name: "Mei Ling Tan", role: "service_crew", status: "active" },
];

interface ShiftDef { id: string; code: string; start: string; end: string; color: string; }

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateStr(d: Date) { return d.toISOString().split("T")[0]; }

// ── Page ────────────────────────────────────────────────────────────────────

export default function ShiftSchedulingPage() {
  const [shiftDict, setShiftDict] = useState<ShiftDef[]>([
    { id: "sd1", code: "MOR", start: "07:00", end: "15:00", color: "#38bdf8" },
    { id: "sd2", code: "EVE", start: "15:00", end: "23:00", color: "#a78bfa" },
    { id: "sd3", code: "NIG", start: "23:00", end: "07:00", color: "#f87171" },
  ]);

  // Patterns: empId -> day -> code|null
  const [patterns, setPatterns] = useState<Record<string, Record<string, string | null>>>(() => {
    const p: Record<string, Record<string, string | null>> = {};
    EMPLOYEES.forEach((emp, i) => {
      p[emp.id] = {};
      DAYS.forEach((d) => (p[emp.id][d] = null));
      if (i % 3 === 0) DAYS.slice(0, 5).forEach((d) => (p[emp.id][d] = "MOR"));
      else if (i % 3 === 1) DAYS.slice(0, 5).forEach((d) => (p[emp.id][d] = "EVE"));
      else { p[emp.id].mon = "MOR"; p[emp.id].wed = "EVE"; p[emp.id].fri = "MOR"; p[emp.id].sat = "MOR"; }
    });
    return p;
  });

  // Overrides: "YYYY-MM-DD" -> empId -> { shift, role }
  const [overrides, setOverrides] = useState<Record<string, Record<string, { shift?: string | null; role?: string | null }>>>({});

  const [activeView, setActiveView] = useState<"pattern" | "live">("pattern");
  const [liveDate, setLiveDate] = useState(dateStr(new Date()));
  const [dictModal, setDictModal] = useState<ShiftDef | "new" | null>(null);
  const [dictForm, setDictForm] = useState({ code: "", start: "", end: "", color: "#38bdf8" });
  const [activeCell, setActiveCell] = useState<{ empId: string; day: string } | null>(null);
  const [activeLiveCell, setActiveLiveCell] = useState<{ empId: string; type: "shift" | "role" } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  function getShift(code: string) { return shiftDict.find((s) => s.code === code); }

  // ─ Shift Dictionary ─
  function openDictModal(def: ShiftDef | null) {
    if (def) { setDictModal(def); setDictForm({ code: def.code, start: def.start, end: def.end, color: def.color }); }
    else { setDictModal("new"); setDictForm({ code: "", start: "", end: "", color: "#38bdf8" }); }
  }

  function saveDictEntry() {
    const code = dictForm.code.trim().toUpperCase();
    if (!code || !dictForm.start || !dictForm.end) { showToast("All fields required."); return; }
    if (dictModal === "new") {
      if (shiftDict.find((s) => s.code === code)) { showToast(`Code "${code}" already exists.`); return; }
      setShiftDict((prev) => [...prev, { id: `sd${Date.now()}`, code, start: dictForm.start, end: dictForm.end, color: dictForm.color }]);
    } else if (dictModal) {
      setShiftDict((prev) => prev.map((s) => s.id === (dictModal as ShiftDef).id ? { ...s, code, start: dictForm.start, end: dictForm.end, color: dictForm.color } : s));
    }
    setDictModal(null); showToast(`Shift "${code}" saved.`);
  }

  function deleteDictEntry(id: string) {
    const s = shiftDict.find((x) => x.id === id); if (!s) return;
    setPatterns((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((eid) => { DAYS.forEach((d) => { if (next[eid]?.[d] === s.code) next[eid] = { ...next[eid], [d]: null }; }); });
      return next;
    });
    setShiftDict((prev) => prev.filter((x) => x.id !== id));
    showToast(`Shift "${s.code}" deleted.`);
  }

  function setPattern(empId: string, day: string, code: string | null) {
    setPatterns((prev) => ({ ...prev, [empId]: { ...(prev[empId] || {}), [day]: code } }));
    setActiveCell(null);
  }

  // ─ Live View ─
  const liveDayKey = DAYS[(new Date(liveDate + "T00:00:00").getDay() + 6) % 7];
  const liveDateObj = new Date(liveDate + "T00:00:00");
  const liveDateLabel = liveDateObj.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  function stepLive(dir: number) {
    const d = new Date(liveDate + "T00:00:00");
    d.setDate(d.getDate() + dir);
    setLiveDate(dateStr(d));
  }

  function setLiveShiftOverride(empId: string, shift: string | null) {
    setOverrides((prev) => ({ ...prev, [liveDate]: { ...(prev[liveDate] || {}), [empId]: { ...(prev[liveDate]?.[empId] || {}), shift } } }));
    setActiveLiveCell(null); showToast("Shift override applied.");
  }

  function setLiveRoleOverride(empId: string, role: string | null) {
    setOverrides((prev) => ({ ...prev, [liveDate]: { ...(prev[liveDate] || {}), [empId]: { ...(prev[liveDate]?.[empId] || {}), role } } }));
    setActiveLiveCell(null); showToast("Role override applied.");
  }

  // ─ Group employees by role ─
  const groups = useMemo(() => {
    const g: Record<string, typeof EMPLOYEES> = {};
    EMPLOYEES.forEach((emp) => { if (!g[emp.role]) g[emp.role] = []; g[emp.role].push(emp); });
    return g;
  }, []);

  function toggleGroup(role: string) { setCollapsedGroups((prev) => { const n = new Set(prev); n.has(role) ? n.delete(role) : n.add(role); return n; }); }

  // Stats
  const totalCells = EMPLOYEES.length * 7;
  const assignedCells = EMPLOYEES.reduce((acc, emp) => acc + DAYS.filter((d) => patterns[emp.id]?.[d]).length, 0);

  const overrideCount = Object.values(overrides[liveDate] || {}).filter((o) => o.shift !== undefined || o.role !== undefined).length;

  return (
    <div className="space-y-5 pb-10">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        
      </div>

      {/* ── Global Shift Dictionary ──────────────────────────────── */}
      <div className="glass-panel rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Global Shift Dictionary</h4>
          <button onClick={() => openDictModal(null)} className="flex items-center gap-1 text-xs text-[#d4af37] hover:text-yellow-300 transition-colors font-semibold"><PlusCircle className="w-3.5 h-3.5" /> Add Shift</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {shiftDict.length === 0 ? <span className="text-xs text-gray-600 italic">No shifts defined. Add one to get started.</span> : shiftDict.map((s) => (
            <div key={s.id} onClick={() => openDictModal(s)} className="relative group cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-all hover:brightness-125"
              style={{ background: s.color + "18", color: s.color, borderColor: s.color + "40" }}>
              <span className="font-mono">{s.code}</span>
              <span className="text-[9px] opacity-60">{s.start}–{s.end}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteDictEntry(s.id); }}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] leading-[14px] text-center font-black hidden group-hover:block">×</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── View Tabs ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {([["pattern", "Default Weekly Pattern", <Table2 key="t" className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />], ["live", "Live Daily Command", <Radio key="r" className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />]] as const).map(([key, label, icon]) => (
          <button key={key} onClick={() => setActiveView(key)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-md border transition-all ${activeView === key ? "text-[#d4af37] bg-[rgba(212,175,55,0.1)] border-[rgba(212,175,55,0.3)]" : "text-gray-400 border-transparent hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.05)]"}`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ═══ VIEW 1: DEFAULT WEEKLY PATTERN ═══ */}
      {activeView === "pattern" && (
        <div className="glass-panel rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#010204]">
            <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> default_weekly_patterns
            </h4>
            <span className="text-[10px] text-gray-600">{assignedCells} / {totalCells} cells assigned</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] text-gray-500 uppercase tracking-wider bg-[#010204] sticky top-0 z-10 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 font-semibold w-52 min-w-[200px]">Employee</th>
                  {DAY_LABELS.map((d) => <th key={d} className="px-2 py-3 font-semibold text-center w-16">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {Object.keys(ROLES).map((role) => {
                  if (!groups[role]?.length) return null;
                  const isCollapsed = collapsedGroups.has(role);
                  return [
                    <tr key={`h-${role}`} className="cursor-pointer hover:bg-[rgba(212,175,55,0.04)]" onClick={() => toggleGroup(role)}>
                      <td colSpan={8} className="bg-[rgba(2,4,8,0.95)] border-b border-[rgba(212,175,55,0.15)] px-4 py-2">
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`w-3.5 h-3.5 text-[#d4af37]/60 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                          <span className="text-xs font-bold text-[#d4af37]/80 uppercase tracking-wider">{ROLES[role]}</span>
                          <span className="text-[10px] text-gray-500 font-mono ml-1">{groups[role].length} staff</span>
                        </div>
                      </td>
                    </tr>,
                    ...(!isCollapsed ? groups[role].map((emp) => (
                      <tr key={emp.id} className="border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors">
                        <td className="px-4 py-2">
                          <div className="text-xs text-white font-medium">{emp.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{emp.id.substring(0, 12)}…</div>
                        </td>
                        {DAYS.map((day) => {
                          const code = patterns[emp.id]?.[day] || null;
                          const sd = code ? getShift(code) : null;
                          const isActive = activeCell?.empId === emp.id && activeCell?.day === day;
                          return (
                            <td key={day} className="px-1 py-1.5 text-center relative">
                              <div onClick={() => setActiveCell(isActive ? null : { empId: emp.id, day })}
                                className={`min-w-[52px] h-[30px] rounded cursor-pointer flex items-center justify-center text-[10px] font-bold uppercase tracking-wide border transition-all hover:scale-105 hover:border-[rgba(212,175,55,0.4)] ${sd ? "" : "bg-white/[0.02] text-gray-600 border-white/5"}`}
                                style={sd ? { background: sd.color + "18", color: sd.color, borderColor: sd.color + "20" } : undefined}>
                                {sd ? sd.code : "OFF"}
                              </div>
                              {isActive && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 z-40 bg-[rgba(10,20,30,0.97)] border border-white/12 rounded-md min-w-[140px] max-h-[220px] overflow-y-auto shadow-lg mt-1" onClick={(e) => e.stopPropagation()}>
                                  {shiftDict.map((s) => (
                                    <button key={s.id} onClick={() => setPattern(emp.id, day, s.code)}
                                      className={`block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[rgba(212,175,55,0.08)] hover:text-[#d4af37] ${s.code === code ? "text-[#d4af37] font-bold" : ""}`}>
                                      <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: s.color }} />
                                      <span className="font-mono font-bold mr-1">{s.code}</span>{s.start}–{s.end}
                                    </button>
                                  ))}
                                  <div className="border-t border-white/5" />
                                  <button onClick={() => setPattern(emp.id, day, null)} className={`block w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/8 ${code === null ? "font-bold" : ""}`}>
                                    <span className="inline-block w-2 h-2 rounded-full bg-gray-600 mr-1.5" /> OFF (Day off)
                                  </button>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    )) : []),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ VIEW 2: LIVE DAILY COMMAND ═══ */}
      {activeView === "live" && (
        <>
          <div className="glass-panel rounded-lg p-4 flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Operational Date</label>
              <input type="date" value={liveDate} onChange={(e) => setLiveDate(e.target.value)} className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)]" style={{ colorScheme: "dark" }} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => stepLive(-1)} className="px-3 py-2 rounded border border-white/10 text-gray-400 hover:text-[#d4af37] hover:border-[rgba(212,175,55,0.3)] transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setLiveDate(dateStr(new Date()))} className="px-3 py-2 rounded border border-white/10 text-gray-400 hover:text-[#d4af37] hover:border-[rgba(212,175,55,0.3)] transition-all text-xs font-semibold uppercase tracking-wider">Today</button>
              <button onClick={() => stepLive(1)} className="px-3 py-2 rounded border border-white/10 text-gray-400 hover:text-[#d4af37] hover:border-[rgba(212,175,55,0.3)] transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-gray-400">{liveDateLabel}</div>
              <div className="text-[10px] text-gray-600">{overrideCount} override(s)</div>
            </div>
          </div>

          <div className="glass-panel rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#010204]">
              <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> daily_shift_overrides — resolved view
              </h4>
              <div className="flex items-center gap-3 text-[9px] text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500/50" /> Default</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500/50 border border-dashed border-amber-500/50" /> Override</span>
              </div>
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
                  {Object.keys(ROLES).map((role) => {
                    if (!groups[role]?.length) return null;
                    return [
                      <tr key={`lh-${role}`}>
                        <td colSpan={5} className="bg-[rgba(2,4,8,0.95)] border-b border-[rgba(212,175,55,0.15)] px-4 py-2">
                          <div className="flex items-center gap-2">
                            <ChevronDown className="w-3.5 h-3.5 text-[#d4af37]/60" />
                            <span className="text-xs font-bold text-[#d4af37]/80 uppercase tracking-wider">{ROLES[role]}</span>
                            <span className="text-[10px] text-gray-500 font-mono ml-1">{groups[role].length} staff</span>
                          </div>
                        </td>
                      </tr>,
                      ...groups[role].map((emp) => {
                        const ov = overrides[liveDate]?.[emp.id];
                        const hasShiftOv = ov?.shift !== undefined && ov?.shift !== null;
                        const hasRoleOv = ov?.role !== undefined && ov?.role !== null;
                        const defaultCode = patterns[emp.id]?.[liveDayKey] || null;
                        const resolvedCode = hasShiftOv ? (ov!.shift === "__OFF__" ? null : ov!.shift) : defaultCode;
                        const resolvedRole = hasRoleOv ? ov!.role! : emp.role;
                        const defShift = defaultCode ? getShift(defaultCode) : null;
                        const resShift = resolvedCode ? getShift(resolvedCode!) : null;
                        const isShiftActive = activeLiveCell?.empId === emp.id && activeLiveCell?.type === "shift";
                        const isRoleActive = activeLiveCell?.empId === emp.id && activeLiveCell?.type === "role";

                        return (
                          <tr key={emp.id} className="border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors">
                            <td className="px-4 py-2">
                              <div className="text-xs text-white font-medium">{emp.name}</div>
                              <div className="text-[10px] text-gray-500 font-mono">{emp.id.substring(0, 12)}…</div>
                            </td>
                            {/* Default Shift */}
                            <td className="px-3 py-2 text-center">
                              <div className="inline-flex items-center justify-center min-w-[56px] h-[28px] rounded text-[10px] font-bold uppercase tracking-wide border"
                                style={defShift ? { background: defShift.color + "15", color: defShift.color, borderColor: defShift.color + "30" } : { color: "#4b5563", borderColor: "transparent" }}>
                                {defShift ? defShift.code : "OFF"}
                              </div>
                            </td>
                            {/* Resolved Shift */}
                            <td className="px-3 py-2 text-center relative">
                              <div onClick={() => setActiveLiveCell(isShiftActive ? null : { empId: emp.id, type: "shift" })}
                                className={`inline-flex items-center justify-center min-w-[56px] h-[28px] rounded text-[10px] font-bold uppercase tracking-wide border cursor-pointer transition-all hover:scale-105 ${hasShiftOv ? "border-dashed animate-pulse" : ""}`}
                                style={resShift ? { background: resShift.color + "15", color: resShift.color, borderColor: hasShiftOv ? "#f59e0b80" : resShift.color + "30" } : { color: "#4b5563", borderColor: hasShiftOv ? "#f59e0b80" : "transparent" }}>
                                {resShift ? resShift.code : "OFF"}
                              </div>
                              {isShiftActive && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 z-40 bg-[rgba(10,20,30,0.97)] border border-white/12 rounded-md min-w-[140px] shadow-lg mt-1" onClick={(e) => e.stopPropagation()}>
                                  {shiftDict.map((s) => (
                                    <button key={s.id} onClick={() => setLiveShiftOverride(emp.id, s.code)} className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[rgba(212,175,55,0.08)] hover:text-[#d4af37]">
                                      <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: s.color }} /><span className="font-mono font-bold mr-1">{s.code}</span>{s.start}–{s.end}
                                    </button>
                                  ))}
                                  <div className="border-t border-white/5" />
                                  <button onClick={() => setLiveShiftOverride(emp.id, "__OFF__")} className="block w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/8">OFF (Force day off)</button>
                                  {hasShiftOv && (<><div className="border-t border-white/5" /><button onClick={() => { setOverrides((p) => { const n = { ...p, [liveDate]: { ...p[liveDate] } }; if (n[liveDate][emp.id]) { const { shift, ...rest } = n[liveDate][emp.id]; n[liveDate][emp.id] = rest; } return n; }); setActiveLiveCell(null); showToast("Override removed."); }} className="block w-full text-left px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/8">↩ Reset to Default</button></>)}
                                </div>
                              )}
                            </td>
                            {/* Deployed Role */}
                            <td className="px-3 py-2 text-center relative">
                              <div onClick={() => setActiveLiveCell(isRoleActive ? null : { empId: emp.id, type: "role" })}
                                className={`inline-flex items-center justify-center min-w-[70px] h-[24px] rounded text-[9px] font-semibold tracking-wide border cursor-pointer transition-all hover:scale-105 ${hasRoleOv ? "border-dashed border-amber-500/50 bg-amber-500/10 text-amber-400" : "border-sky-500/30 bg-sky-500/10 text-sky-400"}`}>
                                {ROLES[resolvedRole]?.replace(/ /g, " ") || resolvedRole}
                              </div>
                              {isRoleActive && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 z-40 bg-[rgba(10,20,30,0.97)] border border-white/12 rounded-md min-w-[160px] max-h-[220px] overflow-y-auto shadow-lg mt-1" onClick={(e) => e.stopPropagation()}>
                                  {Object.entries(ROLES).map(([k, v]) => (
                                    <button key={k} onClick={() => setLiveRoleOverride(emp.id, k)} className={`block w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-[rgba(212,175,55,0.08)] hover:text-[#d4af37] ${k === resolvedRole ? "text-[#d4af37] font-bold" : ""}`}>{v}</button>
                                  ))}
                                  {hasRoleOv && (<><div className="border-t border-white/5" /><button onClick={() => { setOverrides((p) => { const n = { ...p, [liveDate]: { ...p[liveDate] } }; if (n[liveDate][emp.id]) { const { role, ...rest } = n[liveDate][emp.id]; n[liveDate][emp.id] = rest; } return n; }); setActiveLiveCell(null); showToast("Role override removed."); }} className="block w-full text-left px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/8">↩ Reset to Default</button></>)}
                                </div>
                              )}
                            </td>
                            {/* Source */}
                            <td className="px-3 py-2 text-center">
                              <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${hasShiftOv || hasRoleOv ? "text-amber-400 bg-amber-500/10" : "text-gray-500"}`}>
                                {hasShiftOv || hasRoleOv ? "Override" : "Default"}
                              </span>
                            </td>
                          </tr>
                        );
                      }),
                    ];
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══ SHIFT DICT MODAL ═══ */}
      {dictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setDictModal(null)}>
          <div className="glass-panel rounded-lg w-full max-w-sm border-[rgba(212,175,55,0.3)] shadow-[0_10px_40px_rgba(212,175,55,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <h3 className="font-cinzel text-lg text-[#d4af37] tracking-wider flex items-center gap-2"><Clock className="w-5 h-5" /> {dictModal === "new" ? "Add Shift" : "Edit Shift"}</h3>
              <button onClick={() => setDictModal(null)} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Shift Code</label><input type="text" value={dictForm.code} onChange={(e) => setDictForm({ ...dictForm, code: e.target.value.toUpperCase() })} maxLength={4} placeholder="e.g. MOR" className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] uppercase" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Start Time</label><input type="time" value={dictForm.start} onChange={(e) => setDictForm({ ...dictForm, start: e.target.value })} className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)]" style={{ colorScheme: "dark" }} /></div>
                <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">End Time</label><input type="time" value={dictForm.end} onChange={(e) => setDictForm({ ...dictForm, end: e.target.value })} className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)]" style={{ colorScheme: "dark" }} /></div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={dictForm.color} onChange={(e) => setDictForm({ ...dictForm, color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent" />
                  <span className="text-xs text-gray-400 font-mono">{dictForm.color}</span>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={saveDictEntry} className="px-6 py-2.5 text-sm font-bold rounded bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all">Save Shift</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 right-8 bg-[#020408] border-l-4 border-l-[#d4af37] border border-white/10 text-white px-6 py-4 rounded-lg shadow-xl backdrop-blur-md text-sm font-semibold flex items-center gap-3 z-[60]">
          <CheckCircle2 className="w-5 h-5 text-[#d4af37]" /><span>{toast}</span>
        </div>
      )}
    </div>
  );
}

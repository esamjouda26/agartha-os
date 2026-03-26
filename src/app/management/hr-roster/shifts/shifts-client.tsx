"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useState, useMemo, useTransition } from "react";
import {
  CalendarClock, PlusCircle, Clock, X, ChevronDown, Radio, Table2, CheckCircle2, AlertTriangle, Zap
} from "lucide-react";
import { saveShiftDictionary, deleteShiftDictionary, saveWeeklyPatterns, setDailyOverride, unrollWeeklyPatterns, bulkSetDailyOverride } from "./actions";
import { ROLE_GROUPS, ROLES } from "@/components/ui/data-table/filters";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatRoleLabel(role: string) {
  return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getCategory(role: string) {
  const r = role.toLowerCase();
  if (r.includes('admin')) return "Admins";
  if (r.includes('manager')) return "Managers";
  return "Crews";
}

export default function ShiftsClient({ staff, dict, patterns, dailyShifts, currentDate }: any) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<"pattern" | "live">("pattern");
  
  const [dictModal, setDictModal] = useState<any | "new" | null>(null);
  const [dictForm, setDictForm] = useState({ code: "", start_time: "", end_time: "", color: "#38bdf8", is_day_off: false });
  
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<string | null>(null);
  
  const [unrollModal, setUnrollModal] = useState<{ start: string, end: string } | null>(null);
  
  const [activeCell, setActiveCell] = useState<{ empId: string; day: number } | null>(null);
  const [activeLiveCell, setActiveLiveCell] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [collapsedRoles, setCollapsedRoles] = useState<Set<string>>(new Set());
  
  const [selectedPatternStaff, setSelectedPatternStaff] = useState<Set<string>>(new Set());
  const [selectedLiveStaff, setSelectedLiveStaff] = useState<Set<string>>(new Set());

  const [macroWeeklyState, setMacroWeeklyState] = useState<{ shift: string | null, days: number[] } | null>(null);
  const [macroLiveState, setMacroLiveState] = useState<{ shift: string | null, roles?: string[] } | null>(null);
  
  const [isPending, startTransition] = useTransition();

  const offShiftId = useMemo(() => dict.find((d: any) => d.is_day_off)?.id || "", [dict]);
  const defaultOffLabel = useMemo(() => dict.find((d: any) => d.is_day_off)?.code || "OFF", [dict]);

  const toggleStaffSelection = (id: string, isLive: boolean) => {
    const setFn = isLive ? setSelectedLiveStaff : setSelectedPatternStaff;
    setFn(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  
  const toggleRoleSelection = (roleStaff: any[], isLive: boolean, checked: boolean) => {
    const setFn = isLive ? setSelectedLiveStaff : setSelectedPatternStaff;
    setFn(prev => { const n = new Set(prev); roleStaff.forEach(s => checked ? n.add(s.id) : n.delete(s.id)); return n; });
  };
  
  const toggleCategorySelection = (catStaffMap: Record<string, any[]>, isLive: boolean, checked: boolean) => {
    const setFn = isLive ? setSelectedLiveStaff : setSelectedPatternStaff;
    setFn(prev => { const n = new Set(prev); Object.values(catStaffMap).flat().forEach(s => checked ? n.add(s.id) : n.delete(s.id)); return n; });
  };
  
  const toggleAllSelection = (isLive: boolean, checked: boolean) => {
    const setFn = isLive ? setSelectedLiveStaff : setSelectedPatternStaff;
    setFn(prev => { const n = new Set(prev); if (checked) { staff.forEach((s: any) => n.add(s.id)); } else { n.clear(); } return n; });
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  function getShift(id: string) { return dict.find((d: any) => d.id === id); }

  function openDictModal(def: any) {
    if (def) { setDictModal(def); setDictForm({ code: def.code, start_time: def.start_time || "", end_time: def.end_time || "", color: def.color, is_day_off: def.is_day_off || false }); }
    else { setDictModal("new"); setDictForm({ code: "", start_time: "09:00", end_time: "17:00", color: "#38bdf8", is_day_off: false }); }
  }

  function saveDictEntry() {
    const code = dictForm.code.trim().toUpperCase();
    if (!code) { showToast("Shift Code required."); return; }
    if (!dictForm.is_day_off && (!dictForm.start_time || !dictForm.end_time)) { showToast("Start and End times required for standard shifts."); return; }
    startTransition(async () => {
      try {
        await saveShiftDictionary({ 
           id: dictModal === "new" ? "new" : dictModal.id, 
           code,
           color: dictForm.color,
           is_day_off: dictForm.is_day_off,
           start_time: dictForm.is_day_off ? null : dictForm.start_time,
           end_time: dictForm.is_day_off ? null : dictForm.end_time
        });
        setDictModal(null);
        showToast(`Shift "${code}" saved.`);
      } catch (e: any) { showToast(`Error: ${e.message}`); }
    });
  }

  function deleteDictEntry(id: string) {
    setDeleteConfirmModal(null);
    startTransition(async () => {
      try { await deleteShiftDictionary(id); showToast("Shift deleted."); }
      catch (e: any) { showToast(`Error: ${e.message}`); }
    });
  }

  function setPattern(empId: string, dayOfWeek: number, dictId: string | null) {
    setActiveCell(null);
    startTransition(async () => {
      await saveWeeklyPatterns([{ staff_record_id: empId, day_of_week: dayOfWeek, shift_dictionary_id: dictId }]);
    });
  }

  function setLiveShiftOverride(empId: string, dictId: string | null) {
    setActiveLiveCell(null);
    startTransition(async () => {
      await setDailyOverride(empId, currentDate, dictId);
      showToast("Daily command applied.");
    });
  }

  // 1-to-N Category mapped grouping
  const groupedStaff = useMemo(() => {
    const mainGroups: Record<string, Record<string, any[]>> = {};
    staff.forEach((emp: any) => {
      const cat = getCategory(emp.role);
      const sub = emp.role;
      if (!mainGroups[cat]) mainGroups[cat] = {};
      if (!mainGroups[cat][sub]) mainGroups[cat][sub] = [];
      mainGroups[cat][sub].push(emp);
    });
    return mainGroups;
  }, [staff]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    staff.forEach((s: any) => roles.add(s.role));
    return Array.from(roles).sort();
  }, [staff]);

  function toggleCategory(cat: string) { setCollapsedCategories((prev) => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; }); }
  function toggleRole(role: string) { setCollapsedRoles((prev) => { const n = new Set(prev); n.has(role) ? n.delete(role) : n.add(role); return n; }); }

  const liveDateObj = new Date(currentDate + "T00:00:00");
  let liveJsDay = liveDateObj.getDay();
  let liveDbDay = liveJsDay === 0 ? 7 : liveJsDay;

  return (
    <div className={`space-y-5 pb-10 ${isPending ? 'opacity-70 pointer-events-none' : ''} transition-opacity`}>
      {/* ── Global Shift Dictionary ── */}
      <div className="glass-panel rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
             Global Shift Dictionary {isPending && <span className="text-[#d4af37] animate-pulse">Syncing...</span>}
          </h4>
          <button onClick={() => openDictModal(null)} className="flex items-center gap-1 text-xs text-[#d4af37] hover:text-yellow-300 transition-colors font-semibold"><PlusCircle className="w-3.5 h-3.5" /> Add Shift</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {dict.length === 0 ? <span className="text-xs text-gray-600 italic">No shifts defined. Add one to get started.</span> : dict.map((s: any) => (
            <div key={s.id} onClick={() => openDictModal(s)} className={`relative group cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-all hover:brightness-125 ${s.is_day_off ? "border-dashed opacity-80" : ""}`}
              style={{ background: s.color + "18", color: s.color, borderColor: s.color + "40" }}>
              <span className="font-mono">{s.code}</span>
              {!s.is_day_off && <span className="text-[9px] opacity-60">{s.start_time?.substring(0,5)}–{s.end_time?.substring(0,5)}</span>}
              {!s.is_day_off && (
                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmModal(s.id); }}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] leading-[14px] text-center font-black hidden group-hover:block">×</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── View Tabs ── */}
      <div className="flex items-center gap-2">
        <button onClick={() => setActiveView("pattern")} className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-md border transition-all ${activeView === "pattern" ? "text-[#d4af37] bg-[rgba(212,175,55,0.1)] border-[rgba(212,175,55,0.3)]" : "text-gray-400 border-transparent hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.05)]"}`}>
          <Table2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> Default Weekly Pattern
        </button>
        <button onClick={() => setActiveView("live")} className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-md border transition-all ${activeView === "live" ? "text-[#d4af37] bg-[rgba(212,175,55,0.1)] border-[rgba(212,175,55,0.3)]" : "text-gray-400 border-transparent hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.05)]"}`}>
          <Radio className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> Live Daily Command
        </button>
      </div>

      {/* ═══ VIEW 1: PATTERN ═══ */}
      {activeView === "pattern" && (
        <div className="glass-panel rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#010204]">
            <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> core_weekly_patterns
            </h4>
            <div className="flex gap-2">
              <button disabled={selectedPatternStaff.size === 0} onClick={() => setMacroWeeklyState({ shift: null, days: [1,2,3,4,5] })} className="px-3 py-1 text-[10px] tracking-widest uppercase font-bold text-fuchsia-400 border border-fuchsia-500/30 hover:bg-fuchsia-500/10 flex items-center gap-1.5 rounded transition-colors whitespace-nowrap disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed">
                <Zap className="w-3 h-3" /> Assign Selected
              </button>
              <button onClick={() => {
                  const year = new Date().getFullYear();
                  const month = String(new Date().getMonth() + 1).padStart(2, '0');
                  const date = String(new Date().getDate()).padStart(2, '0');
                  
                  const ed = new Date();
                  ed.setDate(ed.getDate() + 30);
                  const eY = ed.getFullYear();
                  const eM = String(ed.getMonth() + 1).padStart(2, '0');
                  const eD = String(ed.getDate()).padStart(2, '0');
                  
                  setUnrollModal({ start: `${year}-${month}-${date}`, end: `${eY}-${eM}-${eD}` });
              }} className="px-3 py-1 text-[10px] tracking-widest uppercase font-bold text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/10 flex items-center gap-1.5 rounded transition-colors whitespace-nowrap">
                <CalendarClock className="w-3 h-3" /> Unroll to Ledger
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] text-gray-500 uppercase tracking-wider bg-[#010204] sticky top-0 z-10 border-b border-white/10">
                <tr>
                  <th className="px-2 py-3 font-semibold w-10 text-center">
                    <input type="checkbox" checked={staff.length > 0 && selectedPatternStaff.size === staff.length} onChange={e => toggleAllSelection(false, e.target.checked)} className="accent-[#d4af37] w-3.5 h-3.5 cursor-pointer" />
                  </th>
                  <th className="px-4 py-3 font-semibold w-52 min-w-[200px]">Employee</th>
                  {DAY_LABELS.map((d) => <th key={d} className="px-2 py-3 font-semibold text-center w-16">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedStaff).sort().map((category) => {
                  const isCatCollapsed = collapsedCategories.has(category);
                  const subRoles = groupedStaff[category];
                  
                  return (
                    <React.Fragment key={`cat-${category}`}>
                      {/* Main Category Header */}
                      <tr className="cursor-pointer bg-[rgba(212,175,55,0.08)] hover:bg-[rgba(212,175,55,0.12)] transition-colors" onClick={() => toggleCategory(category)}>
                        <td className="border-b border-[rgba(212,175,55,0.2)] px-2 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={Object.values(subRoles).flat().every((s: any) => selectedPatternStaff.has(s.id))} onChange={e => toggleCategorySelection(subRoles, false, e.target.checked)} className="accent-[#d4af37] w-3.5 h-3.5 cursor-pointer" />
                        </td>
                        <td colSpan={8} className="border-b border-[rgba(212,175,55,0.2)] px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <ChevronDown className={`w-4 h-4 text-[#d4af37] transition-transform ${isCatCollapsed ? "-rotate-90" : ""}`} />
                            <span className="text-sm font-bold text-[#d4af37] uppercase tracking-widest">{category}</span>
                          </div>
                        </td>
                      </tr>

                      {/* Sub-Roles */}
                      {!isCatCollapsed && Object.keys(subRoles).sort().map((role) => {
                        const isRoleCollapsed = collapsedRoles.has(role);
                        const roleLabel = formatRoleLabel(role);
                        const staffList = subRoles[role];
                        
                        return (
                          <React.Fragment key={`role-${role}`}>
                            <tr className="cursor-pointer hover:bg-[rgba(255,255,255,0.04)] transition-colors" onClick={() => toggleRole(role)}>
                              <td className="bg-[rgba(2,4,8,0.95)] border-b border-white/5 px-2 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                                <input type="checkbox" checked={staffList.length > 0 && staffList.every((s: any) => selectedPatternStaff.has(s.id))} onChange={e => toggleRoleSelection(staffList, false, e.target.checked)} className="accent-[#d4af37] w-3 h-3 cursor-pointer" />
                              </td>
                              <td colSpan={8} className="bg-[rgba(2,4,8,0.95)] border-b border-white/5 px-8 flex items-center h-10">
                                <div className="flex items-center gap-2 w-full">
                                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isRoleCollapsed ? "-rotate-90" : ""}`} />
                                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{roleLabel}</span>
                                  <span className="text-[10px] text-gray-500 font-mono ml-auto mr-4">{staffList.length} staff</span>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Individual Staff Rows */}
                            {!isRoleCollapsed && staffList.map((emp: any) => (
                              <tr key={emp.id} className="border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors relative" onClick={() => toggleStaffSelection(emp.id, false)}>
                                <td className="px-2 py-2 text-center" onClick={e => e.stopPropagation()}>
                                  <input type="checkbox" checked={selectedPatternStaff.has(emp.id)} onChange={() => toggleStaffSelection(emp.id, false)} className="accent-[#d4af37] w-3 h-3 cursor-pointer" />
                                </td>
                                <td className="px-6 py-2 cursor-pointer">
                                  <div className="text-xs text-white font-medium flex items-center gap-2">
                                    <div className="w-1 h-3 rounded bg-zinc-700/50" />
                                    {emp.legal_name || emp.employee_id}
                                  </div>
                                  <div className="text-[10px] text-gray-500 font-mono ml-3">{emp.id.substring(0, 8)}…</div>
                                </td>
                                {[1,2,3,4,5,6,7].map((dayNum) => {
                                  const p = patterns.find((x: any) => x.staff_record_id === emp.id && x.day_of_week === dayNum);
                                  const sd = p?.shift_dictionary_id ? getShift(p.shift_dictionary_id) : null;
                                  const isActive = activeCell?.empId === emp.id && activeCell?.day === dayNum;
                                  return (
                                    <td key={dayNum} className="px-1 py-1.5 text-center relative" onClick={e => e.stopPropagation()}>
                                      <div onClick={() => setActiveCell(isActive ? null : { empId: emp.id, day: dayNum })}
                                        className={`min-w-[52px] h-[30px] rounded cursor-pointer flex items-center justify-center text-[10px] font-bold uppercase tracking-wide border transition-all hover:scale-105 hover:border-[rgba(212,175,55,0.4)] ${sd ? "" : "bg-[rgba(255,255,255,0.02)] text-gray-400 border-white/5 opacity-70 border-dashed"}`}
                                        style={sd ? { background: sd.color + "18", color: sd.color, borderColor: sd.color + "20" } : undefined}>
                                        {sd ? sd.code : defaultOffLabel}
                                      </div>
                                      {isActive && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 z-40 bg-[rgba(10,20,30,0.97)] border border-white/12 rounded-md min-w-[140px] max-h-[220px] overflow-y-auto shadow-[0_10px_40px_rgba(0,0,0,0.5)] mt-1" onClick={(e) => e.stopPropagation()}>
                                          {dict.map((s: any) => (
                                            <button key={s.id} onClick={() => setPattern(emp.id, dayNum, s.id)}
                                              className={`block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[rgba(212,175,55,0.08)] hover:text-[#d4af37]`}>
                                              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: s.color }} />
                                              <span className="font-mono font-bold mr-1">{s.code}</span>
                                              <span className="text-[9px] opacity-60">
                                                {s.is_day_off ? "Rest Day" : `${s.start_time?.substring(0,5)}–${s.end_time?.substring(0,5)}`}
                                              </span>
                                            </button>
                                          ))}
                                          <div className="border-t border-white/5" />
                                          {/* Exisiting mapping naturally incorporates OFF now. If user clicks outside it closes via focus/blur naturally, or just clear natively.*/}
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ VIEW 2: LIVE ═══ */}
      {activeView === "live" && (
        <div className="glass-panel text-white p-4 rounded-lg bg-[#010204]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex md:w-1/3 w-full border border-white/10 rounded-md">
                  <input
                  type="date"
                  className="w-full bg-transparent px-4 py-2 focus:outline-none text-sm"
                  value={currentDate}
                  onChange={(e) => router.push(`?date=${e.target.value}`)}
                  style={{ colorScheme: "dark" }}
                  />
              </div>
              <button disabled={selectedLiveStaff.size === 0} onClick={() => setMacroLiveState({ shift: null })} className="px-3 py-1.5 h-full text-[10px] tracking-widest uppercase font-bold text-fuchsia-400 border border-fuchsia-500/30 hover:bg-fuchsia-500/10 flex items-center gap-1.5 rounded transition-colors whitespace-nowrap disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed">
                <Zap className="w-3 h-3" /> Assign Selected
              </button>
            </div>
            
            <div className="overflow-x-auto border-t border-white/10 pt-4">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] text-gray-500 uppercase tracking-wider bg-[#010204] sticky top-0 z-10 border-b border-white/10">
                  <tr>
                    <th className="px-2 py-3 font-semibold w-10 text-center">
                      <input type="checkbox" checked={staff.length > 0 && selectedLiveStaff.size === staff.length} onChange={e => toggleAllSelection(true, e.target.checked)} className="accent-[#d4af37] w-3.5 h-3.5 cursor-pointer" />
                    </th>
                    <th className="px-4 py-3 font-semibold w-48 min-w-[180px]">Employee</th>
                    <th className="px-3 py-3 font-semibold text-center w-24">Default Shift</th>
                    <th className="px-3 py-3 font-semibold text-center w-24">Resolved Shift</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(groupedStaff).sort().map((category) => {
                    const isCatCollapsed = collapsedCategories.has(category);
                    const subRoles = groupedStaff[category];
                    
                    return (
                      <React.Fragment key={`lcat-${category}`}>
                        {/* Main Category Header */}
                        <tr className="cursor-pointer bg-[rgba(212,175,55,0.08)] hover:bg-[rgba(212,175,55,0.12)] transition-colors" onClick={() => toggleCategory(category)}>
                          <td className="border-b border-[rgba(212,175,55,0.2)] px-2 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={Object.values(subRoles).flat().every((s: any) => selectedLiveStaff.has(s.id)) && Object.values(subRoles).flat().length > 0} onChange={e => toggleCategorySelection(subRoles, true, e.target.checked)} className="accent-[#d4af37] w-3.5 h-3.5 cursor-pointer" />
                          </td>
                          <td colSpan={3} className="border-b border-[rgba(212,175,55,0.2)] px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <ChevronDown className={`w-4 h-4 text-[#d4af37] transition-transform ${isCatCollapsed ? "-rotate-90" : ""}`} />
                              <span className="text-sm font-bold text-[#d4af37] uppercase tracking-widest">{category}</span>
                            </div>
                          </td>
                        </tr>

                        {/* Sub-Roles */}
                        {!isCatCollapsed && Object.keys(subRoles).sort().map((role) => {
                          const isRoleCollapsed = collapsedRoles.has(role);
                          const roleLabel = formatRoleLabel(role);
                          const staffList = subRoles[role];
                          
                          return (
                            <React.Fragment key={`lrole-${role}`}>
                              <tr className="cursor-pointer hover:bg-[rgba(255,255,255,0.04)] transition-colors" onClick={() => toggleRole(role)}>
                                <td className="bg-[rgba(2,4,8,0.95)] border-b border-white/5 px-2 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                                  <input type="checkbox" checked={staffList.length > 0 && staffList.every((s: any) => selectedLiveStaff.has(s.id))} onChange={e => toggleRoleSelection(staffList, true, e.target.checked)} className="accent-[#d4af37] w-3 h-3 cursor-pointer" />
                                </td>
                                <td colSpan={3} className="bg-[rgba(2,4,8,0.95)] border-b border-white/5 px-8 flex items-center h-10">
                                  <div className="flex items-center gap-2 w-full">
                                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isRoleCollapsed ? "-rotate-90" : ""}`} />
                                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{roleLabel}</span>
                                    <span className="text-[10px] text-gray-500 font-mono ml-auto mr-4">{staffList.length} staff</span>
                                  </div>
                                </td>
                              </tr>
                              
                              {/* Individual Staff Rows */}
                              {!isRoleCollapsed && staffList.map((emp: any) => {
                                const dailyRow = dailyShifts.find((ds: any) => ds.staff_record_id === emp.id);
                                const defaultPat = patterns.find((x: any) => x.staff_record_id === emp.id && x.day_of_week === liveDbDay);
                                
                                const defaultCode = defaultPat?.shift_dictionary_id;
                                let resolvedCode = dailyRow ? dailyRow.shift_dictionary_id : defaultCode;

                                const defShift = defaultCode ? getShift(defaultCode) : null;
                                const resShift = resolvedCode ? getShift(resolvedCode) : null;
                                const isShiftActive = activeLiveCell === emp.id;
                                const hasShiftOv = dailyRow && (dailyRow.shift_dictionary_id !== defaultCode);

                                return (
                                  <tr key={emp.id} className="border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors relative" onClick={() => toggleStaffSelection(emp.id, true)}>
                                    <td className="px-2 py-2 text-center" onClick={e => e.stopPropagation()}>
                                      <input type="checkbox" checked={selectedLiveStaff.has(emp.id)} onChange={() => toggleStaffSelection(emp.id, true)} className="accent-[#d4af37] w-3 h-3 cursor-pointer" />
                                    </td>
                                    <td className="px-6 py-2 cursor-pointer">
                                      <div className="text-xs text-white font-medium flex items-center gap-2">
                                        <div className="w-1 h-3 rounded bg-zinc-700/50" />
                                        {emp.legal_name || emp.employee_id}
                                      </div>
                                    </td>
                                    {/* Default Shift */}
                                    <td className="px-3 py-2 text-center">
                                      <div className="inline-flex items-center justify-center min-w-[56px] h-[28px] rounded text-[10px] font-bold uppercase tracking-wide border"
                                        style={defShift ? { background: defShift.color + "15", color: defShift.color, borderColor: defShift.color + "30" } : { color: "#9ca3af", borderColor: "transparent", borderStyle: "dashed", opacity: 0.7 }}>
                                        {defShift ? defShift.code : defaultOffLabel}
                                      </div>
                                    </td>
                                    {/* Resolved Shift */}
                                    <td className="px-3 py-2 text-center relative">
                                        {dailyRow?.linked_leave_id ? (
                                            <div className="inline-flex items-center justify-center px-3 h-[28px] rounded text-[10px] font-bold uppercase tracking-wide border bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30">
                                                ON LEAVE
                                            </div>
                                        ) : (
                                            <>
                                              <div onClick={() => setActiveLiveCell(isShiftActive ? null : emp.id)}
                                                className={`inline-flex items-center justify-center min-w-[56px] h-[28px] rounded text-[10px] font-bold uppercase tracking-wide border cursor-pointer transition-all hover:scale-105 ${hasShiftOv ? "border-dashed" : ""} ${resShift ? "" : "opacity-70 border-dashed"}`}
                                                style={resShift ? { background: resShift.color + "15", color: resShift.color, borderColor: hasShiftOv ? "#f59e0b80" : resShift.color + "30" } : { color: "#9ca3af", borderColor: hasShiftOv ? "#f59e0b80" : "transparent" }}>
                                                {resShift ? resShift.code : defaultOffLabel}
                                              </div>
                                              {isShiftActive && (
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 z-40 bg-[rgba(10,20,30,0.97)] border border-white/12 rounded-md min-w-[140px] shadow-lg mt-1" onClick={(e) => e.stopPropagation()}>
                                                  {dict.map((s: any) => (
                                                    <button key={s.id} onClick={() => setLiveShiftOverride(emp.id, s.id)} className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[rgba(212,175,55,0.08)] hover:text-[#d4af37]">
                                                      <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: s.color }} /><span className="font-mono font-bold mr-1">{s.code}</span>
                                                    </button>
                                                  ))}
                                                </div>
                                              )}
                                            </>
                                        )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
        </div>
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
              <div className="flex items-center gap-2 mb-2 p-3 bg-white/[0.02] border border-white/5 rounded-md">
                <input type="checkbox" id="isDayOff" checked={dictForm.is_day_off} onChange={(e) => setDictForm({ ...dictForm, is_day_off: e.target.checked })} className="accent-[#d4af37] w-4 h-4 cursor-pointer" />
                <label htmlFor="isDayOff" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer">Designate as Native Rest Entity</label>
              </div>
              <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Shift Code</label><input type="text" value={dictForm.code} onChange={(e) => setDictForm({ ...dictForm, code: e.target.value.toUpperCase() })} maxLength={4} placeholder="e.g. MOR" className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] uppercase" /></div>
              <div className={`grid grid-cols-2 gap-3 transition-opacity ${dictForm.is_day_off ? 'opacity-30 pointer-events-none' : ''}`}>
                <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Start Time</label><input disabled={dictForm.is_day_off} type="time" value={dictForm.start_time} onChange={(e) => setDictForm({ ...dictForm, start_time: e.target.value })} className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)]" style={{ colorScheme: "dark" }} /></div>
                <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">End Time</label><input disabled={dictForm.is_day_off} type="time" value={dictForm.end_time} onChange={(e) => setDictForm({ ...dictForm, end_time: e.target.value })} className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)]" style={{ colorScheme: "dark" }} /></div>
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

      {/* ═══ UNROLL MODAL ═══ */}
      {unrollModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4" onClick={() => setUnrollModal(null)}>
          <div className="glass-panel w-full max-w-sm p-6 bg-[#020408] rounded-xl border border-[rgba(212,175,55,0.2)] shadow-[0_10px_40px_rgba(212,175,55,0.1)]" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-cinzel font-bold text-[#d4af37] uppercase tracking-widest flex items-center gap-2 mb-4">
              <CalendarClock className="w-5 h-5" /> Execute Ledger Unroll
            </h3>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">Select the timeframe to project weekly patterns into the formal Shift Ledger. <br/><br/><strong className="text-red-400">WARNING:</strong> This action forcefully overides and completely replaces any existing shift schedules in this timeframe.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Start Date</label>
                <input type="date" value={unrollModal.start} onChange={e => setUnrollModal({ ...unrollModal, start: e.target.value })} className="w-full bg-[#010204] border border-white/10 rounded-md text-sm text-white px-3 py-2 outline-none focus:border-[#d4af37]/50" style={{ colorScheme: "dark" }} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">End Date</label>
                <input type="date" value={unrollModal.end} onChange={e => setUnrollModal({ ...unrollModal, end: e.target.value })} className="w-full bg-[#010204] border border-white/10 rounded-md text-sm text-white px-3 py-2 outline-none focus:border-[#d4af37]/50" style={{ colorScheme: "dark" }} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setUnrollModal(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white">Cancel</button>
              <button onClick={() => {
                 setUnrollModal(null);
                 startTransition(async () => {
                     const res = await unrollWeeklyPatterns(unrollModal.start, unrollModal.end);
                     if (res?.error) { showToast("Failed: " + res.error); } 
                     else { showToast(`Schedule overriden from ${unrollModal.start} to ${unrollModal.end}`); window.location.reload(); }
                 });
              }} className="px-6 py-2 text-xs font-bold uppercase tracking-widest bg-[rgba(212,175,55,0.1)] border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/20 rounded transition-all">
                Unroll Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRM MODAL ═══ */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4" onClick={() => setDeleteConfirmModal(null)}>
          <div className="glass-panel w-full max-w-sm p-6 bg-[#020408] rounded-xl border border-red-500/20 shadow-[0_10px_40px_rgba(239,68,68,0.1)]" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-cinzel font-bold text-red-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5" /> Destructive Action
            </h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to delete this shift dictionary entry? 
              <br/><br/>
              <strong className="text-red-400">WARNING:</strong> Deleting a shift completely breaks the historical and future ledger for anyone assigned to it. It will convert all assigned records into "OFF" days.
              <br/><br/>
              <span className="text-[#d4af37] font-semibold flex items-center gap-2"><Clock className="w-4 h-4"/> We highly recommend <strong className="underline">editing</strong> the shift timing instead of deleting it.</span>
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirmModal(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/10 rounded">Keep & Edit Instead</button>
              <button onClick={() => deleteDictEntry(deleteConfirmModal)} className="px-6 py-2 text-xs font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded transition-all">
                Delete Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MACRO WEEKLY MODAL ═══ */}
      {macroWeeklyState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4" onClick={() => setMacroWeeklyState(null)}>
          <div className="glass-panel w-full max-w-sm p-6 bg-[#020408] rounded-xl border border-fuchsia-500/30 shadow-[0_10px_40px_rgba(217,70,239,0.1)]" onClick={e=>e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-fuchsia-400" /> Assign Pattern to Selected
            </h3>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">You are projecting a weekly pattern to <strong className="text-white">{selectedPatternStaff.size}</strong> selected employees.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-2">Days of Week (Matrix Override)</label>
                <div className="flex flex-wrap gap-2">
                  {[1,2,3,4,5,6,7].map(d => {
                    const isSelected = macroWeeklyState.days.includes(d);
                    return (
                      <button key={d} onClick={() => {
                        const newDays = isSelected ? macroWeeklyState.days.filter(x => x !== d) : [...macroWeeklyState.days, d];
                        setMacroWeeklyState({ ...macroWeeklyState, days: newDays });
                      }} className={`px-2 py-1 text-xs font-bold uppercase rounded border transition-colors ${isSelected ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                        {DAY_LABELS[d-1]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Deploy Global Shift Dictionary Payload</label>
                <select value={macroWeeklyState.shift || offShiftId} onChange={e => setMacroWeeklyState({ ...macroWeeklyState, shift: e.target.value || offShiftId })} className="w-full bg-[#010204] border border-white/10 rounded-md text-sm text-white px-3 py-2 outline-none focus:border-fuchsia-500/50">
                  {dict.map((s:any) => <option key={s.id} value={s.id}>{s.code} {s.is_day_off ? "(Formal Rest Day)" : `(${s.start_time?.substring(0,5)}–${s.end_time?.substring(0,5)})`}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setMacroWeeklyState(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white">Cancel</button>
              <button onClick={() => {
                 const tIDs = Array.from(selectedPatternStaff);
                 if (!tIDs.length || !macroWeeklyState.days.length) { setMacroWeeklyState(null); return; }
                 
                 const pLoads: any[] = [];
                 const resolvedTargetShift = macroWeeklyState.shift || offShiftId;
                 tIDs.forEach((id: string) => {
                   macroWeeklyState.days.forEach(d => {
                     pLoads.push({ staff_record_id: id, day_of_week: d, shift_dictionary_id: resolvedTargetShift });
                   });
                 });
                 setMacroWeeklyState(null);
                 startTransition(async () => {
                     try { await saveWeeklyPatterns(pLoads); showToast(`Macro Pattern Enforced to ${tIDs.length} entities.`); setSelectedPatternStaff(new Set()); }
                     catch(e:any) { showToast(`Macro Failed: ${e.message}`); }
                 });
              }} disabled={isPending} className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-fuchsia-500 hover:bg-fuchsia-400 text-white rounded transition-colors disabled:opacity-50">
                Execute Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MACRO LIVE MODAL (HR) ═══ */}
      {macroLiveState && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200" onClick={() => setMacroLiveState(null)}>
          <div className="bg-[#020408] border border-white/10 p-6 rounded-xl w-full max-w-sm shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-fuchsia-400" /> Assign Shift to Selected
            </h3>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">You are assigning a daily route to <strong className="text-white">{selectedLiveStaff.size}</strong> selected employees for: <strong>{currentDate}</strong></p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Select Shift to Apply</label>
                <select value={macroLiveState.shift || offShiftId} onChange={e => setMacroLiveState({ ...macroLiveState, shift: e.target.value || offShiftId })} className="w-full bg-[#010204] border border-white/10 rounded-md text-sm text-white px-3 py-2 outline-none focus:border-fuchsia-500/50">
                  {dict.map((s:any) => <option key={s.id} value={s.id}>{s.code} {s.is_day_off ? "(Formal Rest Day)" : `(${s.start_time?.substring(0,5)}–${s.end_time?.substring(0,5)})`}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setMacroLiveState(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white">Cancel</button>
              <button onClick={() => {
                 const tIDs = Array.from(selectedLiveStaff);
                 if (!tIDs.length) { setMacroLiveState(null); return; }
                 
                 setMacroLiveState(null);
                 startTransition(async () => {
                     try { 
                         // Note: HR module setDailyOverride is scalar, so we map into Promises
                         await Promise.all(tIDs.map(id => setDailyOverride(id, currentDate, macroLiveState.shift)));
                         showToast(`Daily route assigned to ${tIDs.length} entities.`);
                         setSelectedLiveStaff(new Set());
                     } catch(e:any) { showToast(`Assignment Failed: ${e.message}`); }
                 });
              }} disabled={isPending} className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-fuchsia-500 hover:bg-fuchsia-400 text-white rounded transition-colors disabled:opacity-50">
                Execute Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MACRO LIVE MODAL ═══ */}
      {macroLiveState && macroLiveState.roles !== undefined && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4" onClick={() => setMacroLiveState(null)}>
          <div className="glass-panel w-full max-w-sm p-6 bg-[#020408] rounded-xl border border-fuchsia-500/30 shadow-[0_10px_40px_rgba(217,70,239,0.1)]" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-cinzel font-bold text-fuchsia-400 uppercase tracking-widest flex items-center gap-2 mb-4"><Zap className="w-5 h-5" /> Daily Matrix Reroute</h3>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">Instantly redirect all active personnel under a defined structural role parameter to a unified timeframe overlay for: <strong>{currentDate}</strong></p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">
                  <span>Target Structural Roles</span>
                  <span className="text-[#d4af37] font-bold">{macroLiveState.roles.length} Selected</span>
                </label>
                <div className="max-h-48 overflow-y-auto border border-white/10 rounded-md bg-[#010204] p-2 space-y-2">
                  {Object.entries(ROLE_GROUPS).map(([group, groupRoles]) => {
                     const safeRoles = macroLiveState.roles || [];
                     const allSelected = groupRoles.every(r => safeRoles.includes(r));
                     return (
                       <div key={group} className="border-b border-white/5 last:border-0 pb-1 mb-1">
                          <div className="flex items-center justify-between mb-1 px-2 py-1 bg-white/[0.02] cursor-pointer hover:bg-white/[0.05]" onClick={() => {
                              if (allSelected) {
                                  setMacroLiveState({ ...macroLiveState, roles: safeRoles.filter(r => !groupRoles.includes(r)) });
                              } else {
                                  const newRoles = [...safeRoles];
                                  groupRoles.forEach(r => { if (!newRoles.includes(r)) newRoles.push(r); });
                                  setMacroLiveState({ ...macroLiveState, roles: newRoles });
                              }
                          }}>
                             <span className="text-[10px] uppercase text-[#d4af37] font-bold">{group}</span>
                             <input type="checkbox" readOnly checked={allSelected} className="accent-[#d4af37] cursor-pointer pointer-events-none" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-2">
                            {groupRoles.map(r => (
                               <label key={r} className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-300 hover:bg-[rgba(212,175,55,0.08)] cursor-pointer rounded">
                                  <input type="checkbox" checked={safeRoles.includes(r)} onChange={() => {
                                     const newRoles = safeRoles.includes(r) 
                                        ? safeRoles.filter(x => x !== r)
                                        : [...safeRoles, r];
                                     setMacroLiveState({ ...macroLiveState, roles: newRoles });
                                  }} className="accent-[#d4af37]" />
                                  <span className="truncate">{ROLES[r]}</span>
                               </label>
                            ))}
                          </div>
                       </div>
                     );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Override Shift Dictionary Directive</label>
                <select value={macroLiveState.shift || "OFF"} onChange={e => setMacroLiveState({ ...macroLiveState, shift: e.target.value === "OFF" ? null : e.target.value, roles: macroLiveState.roles })} className="w-full bg-[#010204] border border-white/10 rounded-md text-sm text-white px-3 py-2 outline-none focus:border-fuchsia-500/50">
                  <option value="OFF">OFF (Hard Stop & Evacuate)</option>
                  {dict.map((s:any) => <option key={s.id} value={s.id}>{s.code} ({s.start_time?.substring(0,5)}–{s.end_time?.substring(0,5)})</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setMacroLiveState(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white">Cancel</button>
              <button onClick={() => {
                 const safeRoles = macroLiveState.roles || [];
                 const tIDs = staff.filter((s:any) => safeRoles.includes(s.role)).map((s:any)=>s.id);
                 if (!tIDs.length) { setMacroLiveState(null); return; }
                 
                 setMacroLiveState(null);
                 startTransition(async () => {
                     try { await bulkSetDailyOverride(tIDs, currentDate, macroLiveState.shift); showToast(`Daily Sequence Forced over ${tIDs.length} terminals.`); }
                     catch(e:any) { showToast(`Macro Failed: ${e.message}`); }
                 });
              }} className="px-6 py-2 text-xs font-bold uppercase tracking-widest bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/20 rounded transition-all">
                Execute Mass Reroute
              </button>
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

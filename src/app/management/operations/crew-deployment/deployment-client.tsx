"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useState, useMemo, useTransition } from "react";
import { ChevronDown, CheckCircle2, Zap } from "lucide-react";
import { setOpsDailyOverrideAction, bulkSetOpsDailyOverrideAction } from "../actions";
import { ROLE_GROUPS, ROLES } from "@/components/ui/data-table/filters";

function formatRoleLabel(role: string) {
  return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getCategory(role: string) {
  const r = role.toLowerCase();
  if (r.includes('admin')) return "Admins";
  if (r.includes('manager')) return "Managers";
  return "Crews";
}

export default function DeploymentClient({ staff, dict, patterns, dailyShifts, currentDate }: any) {
  const router = useRouter();
  
  const [activeLiveCell, setActiveLiveCell] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [collapsedRoles, setCollapsedRoles] = useState<Set<string>>(new Set());
  
  const [selectedLiveStaff, setSelectedLiveStaff] = useState<Set<string>>(new Set());
  const [macroLiveState, setMacroLiveState] = useState<{ shift: string | null } | null>(null);
  
  const [isPending, startTransition] = useTransition();

  const toggleStaffSelection = (id: string, role: string) => {
    if (!ROLE_GROUPS.CREW.includes(role)) return;
    setSelectedLiveStaff(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  
  const toggleRoleSelection = (roleStaff: any[], checked: boolean) => {
    setSelectedLiveStaff(prev => { const n = new Set(prev); roleStaff.forEach((s: any) => { if (ROLE_GROUPS.CREW.includes(s.role)) { checked ? n.add(s.id) : n.delete(s.id); } }); return n; });
  };
  
  const toggleCategorySelection = (catStaffMap: Record<string, any[]>, checked: boolean) => {
    setSelectedLiveStaff(prev => { const n = new Set(prev); Object.values(catStaffMap).flat().forEach((s: any) => { if (ROLE_GROUPS.CREW.includes(s.role)) { checked ? n.add(s.id) : n.delete(s.id); } }); return n; });
  };
  
  const toggleAllSelection = (checked: boolean) => {
    setSelectedLiveStaff(prev => { const n = new Set(prev); if (checked) { staff.forEach((s: any) => { if (ROLE_GROUPS.CREW.includes(s.role)) n.add(s.id); }); } else { n.clear(); } return n; });
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };
  const offShiftId = useMemo(() => dict.find((d: any) => d.is_day_off)?.id || "", [dict]);
  const defaultOffLabel = useMemo(() => dict.find((d: any) => d.is_day_off)?.code || "OFF", [dict]);

  const assignLiveMacro = () => {
    const tIDs = Array.from(selectedLiveStaff);
    if (!tIDs.length) { setMacroLiveState(null); return; }
    
    const targetDictId = macroLiveState?.shift || offShiftId;
    setMacroLiveState(null);
    startTransition(async () => {
      try { 
        await bulkSetOpsDailyOverrideAction(tIDs, currentDate, targetDictId);
        showToast(`Override assigned to ${tIDs.length} crew.`); 
        setSelectedLiveStaff(new Set()); 
      }
      catch(e:any) { showToast(`Macro Failed: ${e.message}`); }
    });
  };

  function getShift(id: string) { return dict.find((d: any) => d.id === id); }

  function setLiveShiftOverride(empId: string, dictId: string | null) {
    setActiveLiveCell(null);
    startTransition(async () => {
      try {
        await setOpsDailyOverrideAction(empId, currentDate, dictId);
        showToast("Operation shift deployed to crew.");
      } catch (e: any) {
        showToast(`Authorization Failed: ${e.message}`);
      }
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
      {/* ── Read-Only Global Shift Dictionary ── */}
      <div className="glass-panel rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
             Global Shift Dictionary (Read-Only) {isPending && <span className="text-[#d4af37] animate-pulse">Syncing...</span>}
          </h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {dict.length === 0 ? <span className="text-xs text-gray-600 italic">No shifts defined by HR yet.</span> : dict.map((s: any) => (
            <div key={s.id} className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border"
              style={{ background: s.color + "18", color: s.color, borderColor: s.color + "40" }}>
              <span className="font-mono">{s.code}</span>
              <span className="text-[9px] opacity-60">{s.is_day_off ? "Rest Entity" : `${s.start_time?.substring(0,5)}–${s.end_time?.substring(0,5)}`}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Live Daily Tracker ── */}
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
                    <input type="checkbox" checked={staff.filter((s:any) => ROLE_GROUPS.CREW.includes(s.role)).length > 0 && selectedLiveStaff.size === staff.filter((s:any) => ROLE_GROUPS.CREW.includes(s.role)).length} onChange={e => toggleAllSelection(e.target.checked)} className="accent-[#d4af37] w-3.5 h-3.5 cursor-pointer" />
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
                      <tr className="cursor-pointer bg-[rgba(212,175,55,0.08)] hover:bg-[rgba(212,175,55,0.12)] transition-colors" onClick={() => toggleCategory(category)}>
                        <td className="border-b border-[rgba(212,175,55,0.2)] px-2 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={Object.values(subRoles).flat().filter((s:any) => ROLE_GROUPS.CREW.includes(s.role)).every((s: any) => selectedLiveStaff.has(s.id)) && Object.values(subRoles).flat().filter((s:any) => ROLE_GROUPS.CREW.includes(s.role)).length > 0} onChange={e => toggleCategorySelection(subRoles, e.target.checked)} className="accent-[#d4af37] w-3.5 h-3.5 cursor-pointer" />
                        </td>
                        <td colSpan={3} className="border-b border-[rgba(212,175,55,0.2)] px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <ChevronDown className={`w-4 h-4 text-[#d4af37] transition-transform ${isCatCollapsed ? "-rotate-90" : ""}`} />
                            <span className="text-sm font-bold text-[#d4af37] uppercase tracking-widest">{category}</span>
                          </div>
                        </td>
                      </tr>

                      {!isCatCollapsed && Object.keys(subRoles).sort().map((role) => {
                        const isRoleCollapsed = collapsedRoles.has(role);
                        const roleLabel = formatRoleLabel(role);
                        const staffList = subRoles[role];
                        
                        return (
                          <React.Fragment key={`lrole-${role}`}>
                            <tr className="cursor-pointer hover:bg-[rgba(255,255,255,0.04)] transition-colors" onClick={() => toggleRole(role)}>
                              <td className="bg-[rgba(2,4,8,0.95)] border-b border-white/5 px-2 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                                <input type="checkbox" checked={staffList.filter((s:any) => ROLE_GROUPS.CREW.includes(s.role)).length > 0 && staffList.filter((s:any) => ROLE_GROUPS.CREW.includes(s.role)).every((s: any) => selectedLiveStaff.has(s.id))} onChange={e => toggleRoleSelection(staffList, e.target.checked)} className="accent-[#d4af37] w-3 h-3 cursor-pointer" />
                              </td>
                              <td colSpan={3} className="bg-[rgba(2,4,8,0.95)] border-b border-white/5 px-8 flex items-center h-10">
                                <div className="flex items-center gap-2 w-full">
                                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isRoleCollapsed ? "-rotate-90" : ""}`} />
                                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{roleLabel}</span>
                                  <span className="text-[10px] text-gray-500 font-mono ml-auto mr-4">{staffList.length} staff</span>
                                </div>
                              </td>
                            </tr>
                            
                            {!isRoleCollapsed && staffList.map((emp: any) => {
                              const dailyRow = dailyShifts.find((ds: any) => ds.staff_record_id === emp.id);
                              const defaultPat = patterns.find((x: any) => x.staff_record_id === emp.id && x.day_of_week === liveDbDay);
                              
                              const defaultCode = defaultPat?.shift_dictionary_id;
                              let resolvedCode = dailyRow ? dailyRow.shift_dictionary_id : defaultCode;

                              const defShift = defaultCode ? getShift(defaultCode) : null;
                              const resShift = resolvedCode ? getShift(resolvedCode) : null;
                              
                              const isCrewContext = ROLE_GROUPS.CREW.includes(emp.role);
                              const isShiftActive = activeLiveCell === emp.id && isCrewContext;
                              const hasShiftOv = dailyRow && (dailyRow.shift_dictionary_id !== defaultCode);

                              return (
                                <tr key={emp.id} className="border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors relative" onClick={() => isCrewContext && toggleStaffSelection(emp.id, emp.role)}>
                                  <td className="px-2 py-2 text-center" onClick={e => e.stopPropagation()}>
                                    {isCrewContext ? (
                                      <input type="checkbox" checked={selectedLiveStaff.has(emp.id)} onChange={() => toggleStaffSelection(emp.id, emp.role)} className="accent-[#d4af37] w-3 h-3 cursor-pointer" />
                                    ) : (
                                      <div className="w-3 h-3 rounded bg-white/5 border border-white/10 mx-auto opacity-30 cursor-not-allowed" title="Administrative Staff - Modification Locked" />
                                    )}
                                  </td>
                                  <td className="px-6 py-2 cursor-pointer">
                                    <div className="text-xs text-white font-medium flex items-center gap-2">
                                      <div className="w-1 h-3 rounded bg-zinc-700/50" />
                                      {emp.legal_name || emp.employee_id}
                                    </div>
                                  </td>
                                  {/* Default Shift */}
                                  <td className="px-3 py-2 text-center border-l border-white/5 bg-white/[0.01]">
                                    <div className="inline-flex items-center justify-center min-w-[56px] h-[28px] rounded text-[10px] font-bold uppercase tracking-wide border opacity-70"
                                      style={defShift ? { background: defShift.color + "15", color: defShift.color, borderColor: defShift.color + "30" } : { color: "#9ca3af", borderColor: "transparent", borderStyle: "dashed" }}>
                                      {defShift ? defShift.code : defaultOffLabel}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-center relative" onClick={e => e.stopPropagation()}>
                                      {dailyRow?.linked_leave_id ? (
                                          <div className="inline-flex items-center justify-center px-3 h-[28px] rounded text-[10px] font-bold uppercase tracking-wide border bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30">
                                              ON LEAVE
                                          </div>
                                      ) : (
                                          <>
                                            <div onClick={() => { if (isCrewContext) setActiveLiveCell(isShiftActive ? null : emp.id) }}
                                              className={`inline-flex items-center justify-center min-w-[56px] h-[28px] rounded text-[10px] font-bold uppercase tracking-wide border transition-all ${isCrewContext ? 'cursor-pointer hover:scale-105' : 'opacity-70 cursor-not-allowed'} ${hasShiftOv ? "border-dashed" : ""} ${resShift ? "" : "opacity-70 border-dashed"}`}
                                              style={resShift ? { background: resShift.color + "15", color: resShift.color, borderColor: hasShiftOv ? "#f59e0b80" : resShift.color + "30" } : { color: "#9ca3af", borderColor: hasShiftOv ? "#f59e0b80" : "transparent" }}
                                              title={!isCrewContext ? "Read Only: Action not permitted on administrative structures" : "Execute Daily Reroute"}>
                                              {resShift ? resShift.code : defaultOffLabel}
                                            </div>
                                            {isShiftActive && (
                                              <div className="absolute top-full left-1/2 -translate-x-1/2 z-40 bg-[rgba(10,20,30,0.97)] border border-white/12 rounded-md min-w-[140px] shadow-lg mt-1" onClick={(e) => e.stopPropagation()}>
                                                {dict.map((s: any) => (
                                                  <button key={s.id} onClick={() => setLiveShiftOverride(emp.id, s.id)} className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[rgba(212,175,55,0.08)] hover:text-[#d4af37]">
                                                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: s.color }} /><span className="font-mono font-bold mr-1">{s.code}</span> {!s.is_day_off && `${s.start_time?.substring(0,5)}–${s.end_time?.substring(0,5)}`}
                                                  </button>
                                                ))}
                                                <div className="border-t border-white/5" />
                                                <button onClick={() => setLiveShiftOverride(emp.id, null)} className="block w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/8">OFF (Force day off)</button>
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

      {/* ═══ MACRO LIVE MODAL ═══ */}
      {macroLiveState && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#020408] border border-white/10 p-6 rounded-xl w-full max-w-sm shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-fuchsia-400" /> Assign Shift to Selected
            </h3>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">You are assigning a daily route to <strong className="text-white">{selectedLiveStaff.size}</strong> selected crew members for: <strong>{currentDate}</strong></p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Select Shift to Apply</label>
                <select value={macroLiveState?.shift || offShiftId} onChange={e => setMacroLiveState({ ...macroLiveState!, shift: e.target.value || offShiftId })} className="w-full bg-[#010204] border border-white/10 rounded-md text-sm text-white px-3 py-2 outline-none focus:border-fuchsia-500/50">
                  {dict.map((s:any) => <option key={s.id} value={s.id}>{s.code} {s.is_day_off ? "(Formal Rest Day)" : `(${s.start_time?.substring(0,5)}–${s.end_time?.substring(0,5)})`}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setMacroLiveState(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white">Cancel</button>
              <button onClick={assignLiveMacro} disabled={isPending} className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-fuchsia-500 hover:bg-fuchsia-400 text-white rounded transition-colors disabled:opacity-50">
                Execute Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 right-8 bg-[#020408] border-l-4 border-l-[#d4af37] border border-white/10 text-white px-6 py-4 rounded-lg shadow-xl backdrop-blur-md text-sm font-semibold flex items-center gap-3 z-[60]">
          <CheckCircle2 className="w-5 h-5 text-[#d4af37]" /><span>{toast}</span>
        </div>
      )}
    </div>
  );
}

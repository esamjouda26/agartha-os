"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock, Activity, ChevronLeft, ChevronRight, X, AlertTriangle, Plus,
  Calendar, CheckCircle2,
} from "lucide-react";
import {
  fetchExperiencesListAction,
  fetchTimeSlotsForSchedulerAction,
  overrideSlotCapacityAction,
  generateTimeSlotsAction,
} from "../actions";
import DomainAuditTable from "@/components/DomainAuditTable";

// ── Types ───────────────────────────────────────────────────────────────────

interface Experience {
  id: string; name: string; capacity_per_slot: number | null;
  max_facility_capacity: number; arrival_window_minutes: number;
}
interface TimeSlotRow {
  id: string; slot_date: string; start_time: string; end_time: string;
  booked_count: number; override_capacity: number | null; is_active: boolean;
}

// ── Operational Timeline Data (matching legacy) ─────────────────────────────

function genTimelineData() {
  const times: { label: string; pct: number }[] = [];
  for (let h = 8; h <= 18; h++) {
    for (const m of ["00", "30"]) {
      const t = `${h.toString().padStart(2, "0")}:${m}`;
      let base = 30;
      if (t >= "13:00" && t <= "14:30") base = 90;
      if (t === "15:30") base = 100;
      let actual = Math.min(100, Math.floor(base + (Math.random() * 20 - 5)));
      if (t === "10:00" || t === "10:30") actual = 45;
      if (t === "16:00" || t === "16:30") actual = 35;
      times.push({ label: t, pct: actual });
    }
  }
  return times;
}

function genForecastDays(month: number, year: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const cells: { day: number | null; status: "low" | "med" | "full" }[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push({ day: null, status: "low" });
  for (let d = 1; d <= daysInMonth; d++) {
    const r = Math.random();
    cells.push({ day: d, status: r > 0.8 ? "full" : r > 0.5 ? "med" : "low" });
  }
  return cells;
}

const CONSTRAINTS = [
  { start: "13:00", end: "13:15", label: "Peak Full", desc: "98% Capacity Reached", type: "peak" as const },
  { start: "14:00", end: "14:15", label: "Peak Full", desc: "100% Capacity Reached", type: "peak" as const },
  { start: "15:00", end: "15:15", label: "Busy", desc: "91% Capacity Reached", type: "warning" as const },
  { start: "16:00", end: "17:00", label: "VIP Block", desc: "Private Corporate Booking (Gate C)", type: "vip" as const },
  { start: "10:00", end: "10:30", label: "System", desc: "Morning Hardware Reboot / Calibration", type: "system" as const },
];

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ── Page ────────────────────────────────────────────────────────────────────

export default function SchedulerPage() {
  // ─ Slot management state ─
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [selectedExp, setSelectedExp] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState<TimeSlotRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [overrideVal, setOverrideVal] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [genDays, setGenDays] = useState(7);
  const [genInterval, setGenInterval] = useState(15);
  const [genStart, setGenStart] = useState(9);
  const [genEnd, setGenEnd] = useState(21);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ─ Timeline state ─
  const [activeTab, setActiveTab] = useState<"timeline" | "slots">("timeline");
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [forecastMonth, setForecastMonth] = useState(new Date().getMonth());
  const [forecastYear, setForecastYear] = useState(new Date().getFullYear());
  const [blockModal, setBlockModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const timelineData = useMemo(() => genTimelineData(), [selectedDay, forecastMonth]);
  const forecastDays = useMemo(() => genForecastDays(forecastMonth, forecastYear), [forecastMonth, forecastYear]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  // ─ Slot management ─
  useEffect(() => {
    fetchExperiencesListAction().then((d) => {
      const exps = d as unknown as Experience[];
      setExperiences(exps);
      if (exps.length > 0) setSelectedExp(exps[0].id);
    });
  }, []);

  const loadSlots = useCallback(async () => {
    if (!selectedExp || !selectedDate) return;
    setLoading(true);
    const data = await fetchTimeSlotsForSchedulerAction(selectedExp, selectedDate);
    setSlots(data as TimeSlotRow[]);
    setLoading(false);
  }, [selectedExp, selectedDate]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const currentExp = experiences.find((e) => e.id === selectedExp);

  async function handleOverride(slotId: string) {
    const val = overrideVal.trim() === "" ? null : parseInt(overrideVal);
    const result = await overrideSlotCapacityAction(slotId, val);
    if (result.success) { setMessage({ type: "success", text: "Capacity override saved and audit logged." }); setEditingSlot(null); loadSlots(); }
    else { setMessage({ type: "error", text: result.error ?? "Failed" }); }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleGenerate() {
    if (!selectedExp) return;
    setGenerating(true);
    const result = await generateTimeSlotsAction({ experienceId: selectedExp, startDate: selectedDate, days: genDays, slotIntervalMinutes: genInterval, dayStartHour: genStart, dayEndHour: genEnd });
    setGenerating(false);
    if (result.success) { setMessage({ type: "success", text: `Time slots generated for ${genDays} days.` }); loadSlots(); }
    else { setMessage({ type: "error", text: result.error ?? "Generation failed" }); }
    setTimeout(() => setMessage(null), 4000);
  }

  function stepForecast(dir: number) {
    let m = forecastMonth + dir;
    let y = forecastYear;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    setForecastMonth(m); setForecastYear(y);
  }

  const displayDate = `${MONTH_NAMES[forecastMonth].substring(0, 3).toUpperCase()} ${String(selectedDay).padStart(2, "0")}, ${forecastYear}`;

  return (
    <div className="space-y-5 pb-10">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider">
            <Clock className="w-5 h-5 mr-2" /> Operational Timeline & Scheduler
          </h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Capacity Forecasting & Time Slot Control</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-full px-4 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-orbitron text-[10px] text-emerald-400 tracking-widest uppercase">Live Data</span>
        </div>
      </div>

      {/* ── Tab Switcher ─────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#020408]/40 border border-white/5 rounded-lg p-1 w-fit">
        {([["timeline", "📊 Operational Timeline"], ["slots", "🎰 Slot Manager"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === key
              ? "bg-[rgba(212,175,55,0.15)] text-[#d4af37] border border-[rgba(212,175,55,0.3)] shadow-[0_0_10px_rgba(212,175,55,0.1)]"
              : "text-gray-500 hover:text-gray-300"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Toast */}
      {message && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm border ${message.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {message.text}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: OPERATIONAL TIMELINE (from legacy operational_timeline.html)
         ═══════════════════════════════════════════════════════════ */}
      {activeTab === "timeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Timeline */}
          <div className="lg:col-span-2">
            <div className="glass-panel rounded-lg p-6 flex flex-col max-h-[calc(100vh-200px)]">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#d4af37]" />
                  <h2 className="font-cinzel text-base text-white font-bold tracking-wider uppercase flex items-center gap-3">
                    Operational Timeline
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded font-mono tracking-widest">{displayDate}</span>
                  </h2>
                </div>
              </div>
              {/* Legend */}
              <div className="flex gap-6 mb-4 px-4">
                <span className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
                  <span className="w-3 h-3 rounded-sm bg-[#d4af37]" /> Current Load
                </span>
                <span className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
                  <span className="w-3 h-3 rounded-sm bg-white/5 border border-white/10" /> Available Capacity
                </span>
              </div>
              {/* Bars */}
              <div className="overflow-y-auto pr-4 flex-grow space-y-1">
                {timelineData.map((t) => {
                  const isPeak = t.pct >= 90;
                  return (
                    <div key={t.label} className="flex items-center gap-4 py-1.5 hover:bg-white/[0.02] rounded transition-colors px-2">
                      <div className={`w-14 text-right font-orbitron text-[13px] font-semibold ${isPeak ? "text-red-400" : "text-gray-500"}`}>{t.label}</div>
                      <div className="flex-grow h-2 bg-white/[0.04] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isPeak ? "bg-red-500" : "bg-[#d4af37]"}`} style={{ width: `${t.pct}%` }} />
                      </div>
                      <div className={`w-10 text-right font-orbitron text-[13px] ${isPeak ? "text-red-400 font-bold" : "text-gray-500"}`}>{t.pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Forecast + Constraints */}
          <div className="space-y-6">
            {/* Forecast Map */}
            <div className="glass-panel rounded-lg p-6">
              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                <h3 className="font-cinzel text-sm text-white font-bold tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#d4af37]" /> FORECAST MAP
                </h3>
                <div className="flex items-center gap-3">
                  <button onClick={() => stepForecast(-1)} className="text-gray-400 hover:text-white transition"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-xs text-white font-orbitron font-bold tracking-widest uppercase">{MONTH_NAMES[forecastMonth].substring(0, 3)} {forecastYear}</span>
                  <button onClick={() => stepForecast(1)} className="text-gray-400 hover:text-white transition"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 text-center mb-3">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i} className={`text-[9px] uppercase tracking-widest ${i >= 5 ? "text-[#d4af37] font-bold" : "text-gray-500"}`}>{d}</span>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {forecastDays.map((cell, i) => {
                  if (cell.day === null) return <div key={`e${i}`} className="aspect-square" />;
                  const statusColors = { low: "border-green-500/50 text-green-400", med: "border-[#d4af37]/50 text-[#d4af37]", full: "border-red-500/50 text-red-400" };
                  const isSelected = cell.day === selectedDay;
                  return (
                    <button key={cell.day} onClick={() => setSelectedDay(cell.day!)}
                      className={`aspect-square flex items-center justify-center rounded text-sm font-semibold cursor-pointer transition-all border bg-black/40 hover:scale-105 ${statusColors[cell.status]} ${isSelected ? "bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.15)]" : ""}`}>
                      {cell.day}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between items-center text-[9px] text-gray-500 uppercase tracking-widest font-bold px-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-green-500 bg-green-500/20" /> LOW</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-yellow-500 bg-yellow-500/20" /> MED</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-red-500 bg-red-500/20" /> FULL</span>
              </div>
            </div>

            {/* Active Constraints */}
            <div className="glass-panel rounded-lg p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10 z-10">
                <AlertTriangle className="w-4 h-4 text-white" />
                <h3 className="font-cinzel text-sm text-white font-bold tracking-wider">ACTIVE CONSTRAINTS</h3>
              </div>
              <div className="flex-grow overflow-y-auto pr-2 space-y-3 z-10">
                {CONSTRAINTS.map((c, i) => {
                  const styles = {
                    peak: "bg-red-950/20 border-red-900/30 border-l-red-500",
                    warning: "bg-yellow-950/20 border-yellow-900/30 border-l-yellow-500",
                    vip: "bg-black/40 border-white/5 border-l-purple-500",
                    system: "bg-black/40 border-white/5 border-l-gray-500",
                  };
                  const textColors = {
                    peak: { time: "text-red-300", label: "text-red-400", desc: "text-gray-400" },
                    warning: { time: "text-yellow-300", label: "text-yellow-500", desc: "text-gray-400" },
                    vip: { time: "text-purple-300", label: "text-purple-400", desc: "text-gray-500" },
                    system: { time: "text-gray-300", label: "text-gray-400", desc: "text-gray-500" },
                  };
                  const tc = textColors[c.type];
                  return (
                    <div key={i} className={`p-3 border rounded-lg border-l-2 ${styles[c.type]}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-orbitron font-bold tracking-wider ${tc.time}`}>{c.start} - {c.end}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${tc.label}`}>{c.label}</span>
                      </div>
                      <p className={`text-[10px] ${tc.desc}`}>{c.desc}</p>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setBlockModal(true)}
                className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white text-[10px] uppercase tracking-widest font-bold rounded transition flex items-center justify-center gap-2 z-10">
                <Plus className="w-4 h-4" /> Block New Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: SLOT MANAGER (existing functionality)
         ═══════════════════════════════════════════════════════════ */}
      {activeTab === "slots" && (
        <>
          {/* Controls */}
          <div className="glass-panel rounded-lg p-5 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">Experience</label>
              <select value={selectedExp} onChange={(e) => setSelectedExp(e.target.value)}
                className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] transition-all appearance-none">
                {experiences.map((exp) => <option key={exp.id} value={exp.id}>{exp.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">Date</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] transition-all" />
            </div>
            {currentExp && (
              <div className="space-y-1.5">
                {[{ label: "Slot Capacity", value: currentExp.capacity_per_slot ?? "—" }, { label: "Facility Max", value: currentExp.max_facility_capacity }, { label: "Arrival Window", value: `${currentExp.arrival_window_minutes} min` }].map((d) => (
                  <div key={d.label} className="flex justify-between text-xs"><span className="text-gray-500">{d.label}</span><span className="text-white font-orbitron font-bold">{d.value}</span></div>
                ))}
              </div>
            )}
          </div>

          {/* Batch Generator */}
          <div className="glass-panel rounded-lg p-5">
            <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Batch Generate Slots</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
              {[{ label: "Days", val: genDays, set: setGenDays, min: 1, max: 30 }, { label: "Interval (min)", val: genInterval, set: setGenInterval, min: 5, max: 120 }, { label: "Day Start (hr)", val: genStart, set: setGenStart, min: 0, max: 23 }, { label: "Day End (hr)", val: genEnd, set: setGenEnd, min: 1, max: 24 }].map((f) => (
                <div key={f.label}>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">{f.label}</label>
                  <input type="number" value={f.val} min={f.min} max={f.max} onChange={(e) => f.set(Number(e.target.value))}
                    className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] transition-all" />
                </div>
              ))}
              <button onClick={handleGenerate} disabled={generating || !selectedExp}
                className="bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-[#020408] font-bold text-sm px-4 py-2 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all">
                {generating ? "Generating…" : "Generate"}
              </button>
            </div>
          </div>

          {/* Slots Table */}
          <div className="glass-panel rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <span className="text-sm font-cinzel text-[#d4af37] tracking-wider">Time Slots</span>
              <span className="text-xs text-gray-500 font-mono">{slots.length} slots</span>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" /></div>
              ) : slots.length === 0 ? (
                <div className="py-16 text-center">
                  <Clock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No slots for this date.</p>
                  <p className="text-gray-600 text-xs">Use the Batch Generator above to create slots.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-[#010204] border-b border-white/10 text-[10px] text-gray-500 uppercase tracking-wider">
                    <tr>{["Time Window", "Booked", "Default Cap", "Override", "Effective", "Utilization", ""].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {slots.map((slot) => {
                      const effectiveCap = slot.override_capacity ?? currentExp?.capacity_per_slot ?? 0;
                      const utilization = effectiveCap > 0 ? Math.round((slot.booked_count / effectiveCap) * 100) : 0;
                      const isEditing = editingSlot === slot.id;
                      const barColor = utilization >= 90 ? "bg-red-500" : utilization >= 60 ? "bg-amber-500" : "bg-green-500";
                      return (
                        <tr key={slot.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 font-mono text-white">{slot.start_time} – {slot.end_time}</td>
                          <td className="px-5 py-3 font-orbitron font-bold text-white">{slot.booked_count}</td>
                          <td className="px-5 py-3 text-gray-400">{currentExp?.capacity_per_slot ?? "—"}</td>
                          <td className="px-5 py-3">
                            {isEditing ? (
                              <input type="number" value={overrideVal} onChange={(e) => setOverrideVal(e.target.value)} placeholder="null"
                                className="bg-[#020408] border border-[rgba(212,175,55,0.4)] text-white text-xs rounded px-2 py-1 w-20 focus:outline-none" />
                            ) : (
                              <span className={slot.override_capacity !== null ? "text-[#d4af37] font-bold font-mono" : "text-gray-600"}>{slot.override_capacity ?? "—"}</span>
                            )}
                          </td>
                          <td className="px-5 py-3 font-orbitron font-bold text-white">{effectiveCap}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-[#020408] rounded-full h-1.5 border border-white/5"><div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(100, utilization)}%` }} /></div>
                              <span className="text-xs text-gray-400">{utilization}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <button onClick={() => handleOverride(slot.id)} className="bg-[rgba(212,175,55,0.2)] hover:bg-[rgba(212,175,55,0.4)] text-[#d4af37] text-xs px-3 py-1 rounded border border-[rgba(212,175,55,0.4)] transition-colors">Save</button>
                                <button onClick={() => setEditingSlot(null)} className="text-gray-500 hover:text-gray-200 px-2 py-1 rounded transition-colors"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingSlot(slot.id); setOverrideVal(slot.override_capacity?.toString() ?? ""); }}
                                className="text-xs text-gray-500 hover:text-[#d4af37] px-3 py-1 rounded border border-transparent hover:border-[rgba(212,175,55,0.3)] transition-all">Override</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <DomainAuditTable entityTypes={["time_slot"]} title="Scheduler Audit Trail" />
        </>
      )}

      {/* ═══ BLOCK TIME SLOT MODAL ═══ */}
      {blockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/85 backdrop-blur-sm" onClick={() => setBlockModal(false)}>
          <div className="glass-panel rounded-lg w-full max-w-md p-8 border-[#d4af37]/30 shadow-[0_10px_40px_rgba(212,175,55,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-cinzel text-lg text-white font-bold tracking-wider">Block Time Slot</h3>
              <button onClick={() => setBlockModal(false)} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setBlockModal(false); showToast("✅ Slot constraint applied successfully."); }} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Start Time</label>
                  <input type="time" required className="w-full bg-black/50 border border-white/20 text-white px-3 py-2.5 rounded text-sm focus:outline-none focus:border-[#d4af37] transition-colors" style={{ colorScheme: "dark" }} />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">End Time</label>
                  <input type="time" required className="w-full bg-black/50 border border-white/20 text-white px-3 py-2.5 rounded text-sm focus:outline-none focus:border-[#d4af37] transition-colors" style={{ colorScheme: "dark" }} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Constraint Type</label>
                <select required className="w-full bg-black/50 border border-white/20 text-white px-3 py-2.5 rounded text-sm focus:outline-none focus:border-[#d4af37] cursor-pointer">
                  <option value="system">System Maintenance</option>
                  <option value="vip">VIP Private Booking</option>
                  <option value="incident">Operational Incident</option>
                  <option value="manual">Manual Override</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">Reason / Notes</label>
                <textarea required placeholder="Enter brief details for the operations log..."
                  className="w-full bg-black/50 border border-white/20 text-white px-3 py-2.5 rounded text-sm focus:outline-none focus:border-[#d4af37] resize-none h-20 transition-colors" />
              </div>
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setBlockModal(false)} className="flex-1 py-3 text-xs text-gray-400 hover:text-white uppercase tracking-widest transition">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-[#d4af37] text-black font-bold text-xs uppercase tracking-widest rounded hover:bg-white transition shadow-[0_0_15px_rgba(212,175,55,0.3)]">Apply Block</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 bg-green-500/20 border border-green-500/40 text-green-400 px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle2 className="w-5 h-5" /><span>{toast}</span>
        </div>
      )}
    </div>
  );
}

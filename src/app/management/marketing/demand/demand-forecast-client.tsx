"use client";

import { useState, useMemo } from "react";
import { BarChart3, CalendarDays, Clock, MousePointerClick } from "lucide-react";
import type { ForecastRow } from "./page";

/* ── Constants ──────────────────────────────────────────────────────── */
const TOTAL_DAILY_CAPACITY = 1000;
const HOURLY_CAPACITY = 125;
const OP_HOURS = ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ── Helpers ─────────────────────────────────────────────────────────── */
function getCapClass(pct: number) {
  if (pct >= 80) return "cap-high";
  if (pct >= 40) return "cap-opt";
  return "cap-low";
}

function getBadgeStyle(pct: number) {
  if (pct >= 80) return "bg-red-500/20 text-red-400";
  if (pct >= 40) return "bg-[#d4af37]/20 text-[#d4af37]";
  return "bg-slate-700/60 text-slate-300";
}

function getStatusInfo(pct: number) {
  if (pct >= 80) return { color: "text-red-400", label: "High" };
  if (pct >= 40) return { color: "text-[#d4af37]", label: "Optimal" };
  return { color: "text-slate-400", label: "Low" };
}

function getBarColor(pct: number) {
  if (pct >= 80) return "from-red-500 to-red-400";
  if (pct >= 40) return "from-[#806b45] to-[#d4af37]";
  return "from-slate-600/80 to-slate-500/60";
}

function getDotColor(pct: number) {
  if (pct >= 80) return "bg-red-500";
  if (pct >= 40) return "bg-[#d4af37]";
  return "bg-slate-500";
}

function getTxtColor(pct: number) {
  if (pct >= 80) return "text-red-400";
  if (pct >= 40) return "text-[#d4af37]";
  return "text-slate-400";
}

interface CalendarDay {
  dateObj: Date;
  dayStr: string;
  weekday: string;
  isValid: boolean;
  total: number;
  percent: number;
  hourly: { time: string; val: number; pct: number }[];
  forecastRow: ForecastRow | null;
}

/* ── Component ──────────────────────────────────────────────────────── */
export default function DemandForecastClient({ forecasts }: { forecasts: ForecastRow[] }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  /* Build calendar data — 35 cells (5 weeks), starting from the current week's Sunday */
  const calendarData = useMemo<CalendarDay[]>(() => {
    const today = new Date();
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - today.getDay()); // Go to Sunday

    const forecastMap = new Map<string, ForecastRow>();
    forecasts.forEach((f) => {
      forecastMap.set(f.forecast_date, f);
    });

    const days: CalendarDay[] = [];
    let firstValidIdx = -1;

    for (let i = 0; i < 35; i++) {
      const cellDate = new Date(startDay);
      cellDate.setDate(startDay.getDate() + i);

      const dateKey = cellDate.toISOString().slice(0, 10);
      const isPast = new Date(cellDate.toDateString()) < new Date(new Date().toDateString());
      const daysDiff = Math.floor((cellDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isTooFar = daysDiff > 30;

      const isValid = !isPast && !isTooFar;
      const forecastRow = forecastMap.get(dateKey) ?? null;

      let total = 0;
      let percent = 0;
      const hourly: { time: string; val: number; pct: number }[] = [];

      if (isValid) {
        if (firstValidIdx === -1) firstValidIdx = i;

        if (forecastRow) {
          total = forecastRow.predicted_guests;
        } else {
          // Generate synthetic data for days without forecast rows
          const isWeekend = [0, 6].includes(cellDate.getDay());
          const baseDemand = isWeekend ? 0.6 : 0.3;
          const variance = (Math.random() * 0.5) - 0.15;
          const capRatio = Math.max(0.1, Math.min(0.98, baseDemand + variance));
          total = Math.floor(TOTAL_DAILY_CAPACITY * capRatio);
        }

        percent = (total / TOTAL_DAILY_CAPACITY) * 100;

        // Distribute hourly
        let remaining = total;
        for (let h = 0; h < OP_HOURS.length; h++) {
          const hourWeight = [3, 4, 5].includes(h) ? 0.2 : 0.08;
          let hourAmt = h === OP_HOURS.length - 1
            ? remaining
            : Math.floor(total * hourWeight * (0.8 + Math.random() * 0.4));
          hourAmt = Math.min(hourAmt, HOURLY_CAPACITY);
          remaining -= hourAmt;
          hourly.push({
            time: OP_HOURS[h],
            val: Math.max(0, hourAmt),
            pct: (Math.max(0, hourAmt) / HOURLY_CAPACITY) * 100,
          });
        }
      }

      days.push({
        dateObj: cellDate,
        dayStr: cellDate.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
        weekday: cellDate.toLocaleDateString("en-US", { weekday: "short" }),
        isValid,
        total,
        percent,
        hourly,
        forecastRow,
      });
    }

    return days;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forecasts]);

  /* Determine the first valid index for auto-selection */
  const firstValidIdx = calendarData.findIndex((d) => d.isValid);
  const activeIdx = selectedIdx ?? firstValidIdx;
  const selectedDay = activeIdx >= 0 ? calendarData[activeIdx] : null;

  /* Collect month names for header */
  const monthsSpanned = [
    ...new Set(calendarData.filter((d) => d.isValid).map((d) =>
      d.dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
    )),
  ].join(" / ");

  /* Peak hour for selected day */
  const peakHour = selectedDay?.hourly.reduce((a, b) => (a.val > b.val ? a : b), { val: 0, time: "—", pct: 0 });
  const selectedPct = selectedDay ? Math.round(selectedDay.percent) : 0;
  const selectedStatus = getStatusInfo(selectedPct);

  return (
    <div className="space-y-5 pb-10">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-cinzel text-xl text-[#d4af37] flex items-center tracking-wider">
            <BarChart3 className="w-6 h-6 mr-3" /> Demand Forecasts
          </h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">30-Day Forward Capacity View</p>
        </div>
        {/* Inline Legend */}
        <div className="glass-panel rounded-lg px-4 py-2 flex items-center space-x-5 text-[11px] font-mono text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-500/60" />
            <span>&gt;80% High</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#d4af37]/60" />
            <span>40-80% Optimal</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-500/40" />
            <span>&lt;40% Low</span>
          </div>
        </div>
      </div>

      {/* ═══ FORECAST CALENDAR ═══ */}
      <div className="glass-panel p-5 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-cinzel text-gray-300 uppercase tracking-widest flex items-center">
            <CalendarDays className="w-4 h-4 mr-2 text-[#d4af37]/60" /> Capacity Calendar
          </h4>
          <span className="text-xs font-mono text-[#d4af37]/80 bg-[#d4af37]/10 px-3 py-1 rounded-full border border-[#d4af37]/20">
            {monthsSpanned}
          </span>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
          {DAY_HEADERS.map((d) => <div key={d}>{d}</div>)}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarData.map((day, idx) => {
            if (!day.isValid) {
              return (
                <div
                  key={idx}
                  className="border border-white/[0.02] rounded-lg p-2 min-h-[72px] bg-white/[0.01] cursor-not-allowed opacity-20 flex flex-col justify-between"
                >
                  <span className="text-[11px] text-gray-600 font-mono">{day.dateObj.getDate()}</span>
                </div>
              );
            }

            const isToday = idx === firstValidIdx;
            const isSelected = idx === activeIdx;
            const pctRound = Math.round(day.percent);
            const capClass = getCapClass(day.percent);
            const badgeStyle = getBadgeStyle(pctRound);

            /* Map cap class to inline styles to match legacy CSS */
            const capStyles: Record<string, React.CSSProperties> = {
              "cap-high": { background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.06))", borderLeft: "3px solid #ef4444" },
              "cap-opt": { background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.06))", borderLeft: "3px solid #d4af37" },
              "cap-low": { background: "linear-gradient(135deg, rgba(148,163,184,0.08), rgba(148,163,184,0.03))", borderLeft: "3px solid #475569" },
            };

            return (
              <div
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`rounded-lg p-2 min-h-[72px] cursor-pointer flex flex-col justify-between border transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:-translate-y-px group ${
                  isSelected
                    ? "border-[#d4af37] shadow-[0_0_16px_rgba(212,175,55,0.3),inset_0_0_20px_rgba(212,175,55,0.05)]"
                    : "border-white/5 hover:border-[#d4af37]/40"
                }`}
                style={capStyles[capClass]}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-[11px] font-semibold font-mono group-hover:text-white transition-colors ${isToday ? "text-white" : "text-gray-300"}`}>
                    {day.dayStr}
                  </span>
                  {isToday && (
                    <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
                  )}
                </div>
                <div className="flex items-end justify-between mt-auto">
                  <div className="text-sm font-bold font-mono text-white leading-none">
                    {day.total.toLocaleString()}
                  </div>
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${badgeStyle}`}>
                    {pctRound}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ SELECTED DAY DETAIL ═══ */}
      <div className="glass-panel rounded-lg overflow-hidden">
        {/* Day Summary Strip */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-[#020408]/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="w-4 h-4 text-[#d4af37]/60" />
            <h4 className="text-sm font-cinzel text-gray-300 uppercase tracking-widest">
              {selectedDay ? `${selectedDay.weekday}, ${selectedDay.dayStr}` : "Select a Day"}
            </h4>
          </div>
          {selectedDay && (
            <div className="flex items-center space-x-6 text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Bookings</span>
                <span className="text-white font-bold">
                  {selectedDay.total.toLocaleString()} <span className="text-gray-600 font-normal">/ 1,000</span>
                </span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Fill</span>
                <span className={`${selectedStatus.color} font-bold`}>{selectedPct}%</span>
                <span className={`text-[10px] ${selectedStatus.color} bg-white/5 px-1.5 py-0.5 rounded font-semibold`}>
                  {selectedStatus.label}
                </span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Peak</span>
                <span className="text-white font-bold">{peakHour?.time ?? "—"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Hourly Timeline */}
        <div className="p-5 overflow-y-auto max-h-[420px]">
          {!selectedDay ? (
            <div className="text-center text-gray-500 text-sm italic py-12 flex flex-col items-center">
              <MousePointerClick className="w-8 h-8 mb-3 text-gray-600" />
              Click any date on the calendar above to see its hourly breakdown.
            </div>
          ) : (
            selectedDay.hourly.map((hour, i) => {
              const p = Math.min(100, hour.pct);
              const barColor = getBarColor(p);
              const txtColor = getTxtColor(p);
              const dotColor = getDotColor(p);

              return (
                <div
                  key={i}
                  className={`flex items-center space-x-4 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-default hover:bg-white/[0.03] hover:translate-x-0.5 ${
                    i % 2 === 0 ? "bg-white/[0.01]" : ""
                  }`}
                >
                  <div className="w-[72px] flex items-center space-x-2 shrink-0">
                    <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
                    <span className="text-xs font-semibold text-gray-400 font-mono">{hour.time}</span>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden border border-white/[0.04] relative">
                      <div
                        className={`bg-gradient-to-r ${barColor} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${p}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-[88px] flex items-center justify-end space-x-1.5 shrink-0">
                    <span className={`text-sm font-bold font-mono ${txtColor}`}>{hour.val}</span>
                    <span className="text-[10px] text-gray-600 font-mono">/ {HOURLY_CAPACITY}</span>
                  </div>
                  <div className="w-[44px] text-right shrink-0">
                    <span className={`text-[10px] font-bold font-mono ${txtColor}`}>{Math.round(p)}%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

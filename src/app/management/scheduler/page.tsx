"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DomainAuditTable from "@/components/DomainAuditTable";
import {
  fetchExperiencesListAction,
  fetchTimeSlotsForSchedulerAction,
  overrideSlotCapacityAction,
  generateTimeSlotsAction,
} from "../actions";

interface Experience { id: string; name: string; capacity_per_slot: number | null; max_facility_capacity: number; arrival_window_minutes: number; }
interface TimeSlotRow { id: string; slot_date: string; start_time: string; end_time: string; booked_count: number; override_capacity: number | null; is_active: boolean; }

export default function SchedulerPage() {
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

  useEffect(() => { fetchExperiencesListAction().then((d) => { const exps = d as unknown as Experience[]; setExperiences(exps); if (exps.length > 0) setSelectedExp(exps[0].id); }); }, []);

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
    if (result.success) {
      setMessage({ type: "success", text: "Capacity override saved and audit logged." });
      setEditingSlot(null);
      loadSlots();
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed" });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleGenerate() {
    if (!selectedExp) return;
    setGenerating(true);
    const result = await generateTimeSlotsAction({
      experienceId: selectedExp,
      startDate: selectedDate,
      days: genDays,
      slotIntervalMinutes: genInterval,
      dayStartHour: genStart,
      dayEndHour: genEnd,
    });
    setGenerating(false);
    if (result.success) {
      setMessage({ type: "success", text: `Time slots generated for ${genDays} days.` });
      loadSlots();
    } else {
      setMessage({ type: "error", text: result.error ?? "Generation failed" });
    }
    setTimeout(() => setMessage(null), 4000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Timeline Scheduler</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage metered arrival windows and capacity overrides</p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-destructive/10 text-destructive border border-destructive/30"}`}>
          {message.text}
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Experience</Label>
          <select value={selectedExp} onChange={(e) => setSelectedExp(e.target.value)} className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground">
            {experiences.map((exp) => (<option key={exp.id} value={exp.id}>{exp.name}</option>))}
          </select>
        </div>
        <div>
          <Label>Date</Label>
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        <div className="flex items-end">
          {currentExp && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Slot Capacity: <span className="text-foreground font-bold">{currentExp.capacity_per_slot}</span></div>
              <div>Facility Max: <span className="text-foreground font-bold">{currentExp.max_facility_capacity}</span></div>
              <div>Interval: <span className="text-foreground font-bold">{currentExp.arrival_window_minutes}min</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Batch Generator */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Batch Generate Slots</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div><Label className="text-xs">Days</Label><Input type="number" value={genDays} onChange={(e) => setGenDays(Number(e.target.value))} min={1} max={30} /></div>
            <div><Label className="text-xs">Interval (min)</Label><Input type="number" value={genInterval} onChange={(e) => setGenInterval(Number(e.target.value))} min={5} max={120} /></div>
            <div><Label className="text-xs">Day Start (hr)</Label><Input type="number" value={genStart} onChange={(e) => setGenStart(Number(e.target.value))} min={0} max={23} /></div>
            <div><Label className="text-xs">Day End (hr)</Label><Input type="number" value={genEnd} onChange={(e) => setGenEnd(Number(e.target.value))} min={1} max={24} /></div>
            <div className="flex items-end"><Button onClick={handleGenerate} disabled={generating || !selectedExp} className="w-full">{generating ? "Generating..." : "Generate"}</Button></div>
          </div>
        </CardContent>
      </Card>

      {/* Slots Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Time Slots</span>
            <Badge variant="outline">{slots.length} slots</Badge>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : slots.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">No slots for this date. Use the batch generator above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Time", "Booked", "Default Cap", "Override", "Effective", "Utilization", ""].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot) => {
                    const effectiveCap = slot.override_capacity ?? currentExp?.capacity_per_slot ?? 0;
                    const utilization = effectiveCap > 0 ? Math.round((slot.booked_count / effectiveCap) * 100) : 0;
                    const isEditing = editingSlot === slot.id;
                    return (
                      <tr key={slot.id} className="border-b border-border/50 hover:bg-muted/20 transition">
                        <td className="py-3 px-4 font-mono text-foreground">{slot.start_time} – {slot.end_time}</td>
                        <td className="py-3 px-4 font-bold text-foreground">{slot.booked_count}</td>
                        <td className="py-3 px-4 text-muted-foreground">{currentExp?.capacity_per_slot ?? "—"}</td>
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <Input type="number" value={overrideVal} onChange={(e) => setOverrideVal(e.target.value)} placeholder="null" className="h-8 w-24" />
                          ) : (
                            <span className={slot.override_capacity !== null ? "text-primary font-bold" : "text-muted-foreground"}>{slot.override_capacity ?? "—"}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground">{effectiveCap}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${utilization >= 90 ? "bg-destructive" : utilization >= 60 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, utilization)}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{utilization}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <div className="flex gap-1">
                              <Button size="sm" variant="default" onClick={() => handleOverride(slot.id)}>Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingSlot(null)}>✕</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => { setEditingSlot(slot.id); setOverrideVal(slot.override_capacity?.toString() ?? ""); }}>Override</Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <DomainAuditTable entityTypes={["time_slot"]} title="Scheduler Audit Trail" />
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchZoneTelemetryAction, fetchCrewTelemetryAction } from "../actions";
import { createClient } from "@/lib/supabase/client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { KpiCard, ChartContainer } from "@/components/shared";
import { Users, Activity, AlertTriangle, MapPin } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

interface ZoneData {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  is_active: boolean;
  currentGuests: number;
  pct: number;
  location_name: string;
  location_type: string | null;
}

interface CrewInZone {
  legal_name: string;
  employee_id: string;
  role: string;
  last_scanned_at: string | null;
  is_mismatched: boolean;
}

interface LocationGroup {
  name: string;
  type: string | null;
  zones: ZoneData[];
  totalGuests: number;
  totalCapacity: number;
  avgPct: number;
  totalCrew: number;
}

const LOCATION_TYPE_ICONS: Record<string, string> = {
  warehouse: "📦", fnb: "🍽", retail: "🛍", attraction: "🎢", entrance: "🚪",
};

function getLoadStatus(pct: number) {
  if (pct >= 90) return { label: "CRITICAL", barClass: "bg-gradient-to-r from-red-500 to-red-400", textClass: "text-red-400", dotClass: "bg-red-500" };
  if (pct >= 70) return { label: "ELEVATED", barClass: "bg-gradient-to-r from-amber-500 to-amber-400", textClass: "text-amber-400", dotClass: "bg-amber-500" };
  return { label: "NORMAL", barClass: "bg-gradient-to-r from-emerald-500 to-emerald-400", textClass: "text-emerald-400", dotClass: "bg-emerald-500" };
}

export default function ZoneTelemetryPage() {
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [crewByZone, setCrewByZone] = useState<Record<string, CrewInZone[]>>({});
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [collapsedLocations, setCollapsedLocations] = useState<Record<string, boolean>>({});
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const refresh = useCallback(async () => {
    const [zoneData, crewData] = await Promise.all([
      fetchZoneTelemetryAction(),
      fetchCrewTelemetryAction(),
    ]);
    setZones(zoneData as ZoneData[]);

    // Group crew by current_zone_id
    const grouped: Record<string, CrewInZone[]> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (crewData as any[]).forEach((shift) => {
      const zoneId = shift.current_zone_id;
      if (!zoneId) return;
      if (!grouped[zoneId]) grouped[zoneId] = [];
      grouped[zoneId].push({
        legal_name: shift.staff_records?.legal_name ?? "Unknown",
        employee_id: shift.staff_records?.employee_id ?? "",
        role: shift.staff_records?.role ?? "",
        last_scanned_at: shift.last_scanned_at,
        is_mismatched: shift.assigned_zone_id !== shift.current_zone_id,
      });
    });
    setCrewByZone(grouped);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Supabase Realtime ─────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("telemetry-realtime-v2")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "zones" }, (payload) => {
        const updated = payload.new as { id: string; name: string; description: string | null; capacity: number; is_active: boolean };
        setZones((prev) => prev.map((z) => {
          if (z.id !== updated.id) return z;
          const capacity = updated.capacity ?? z.capacity;
          const pct = capacity > 0 ? Math.round((z.currentGuests / capacity) * 100) : 0;
          return { ...z, ...updated, capacity, pct };
        }));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "shift_schedules" }, () => {
        // When a crew member scans into a new zone, refresh crew telemetry
        fetchCrewTelemetryAction().then((crewData) => {
          const grouped: Record<string, CrewInZone[]> = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (crewData as any[]).forEach((shift) => {
            const zoneId = shift.current_zone_id;
            if (!zoneId) return;
            if (!grouped[zoneId]) grouped[zoneId] = [];
            grouped[zoneId].push({
              legal_name: shift.staff_records?.legal_name ?? "Unknown",
              employee_id: shift.staff_records?.employee_id ?? "",
              role: shift.staff_records?.role ?? "",
              last_scanned_at: shift.last_scanned_at,
              is_mismatched: shift.assigned_zone_id !== shift.current_zone_id,
            });
          });
          setCrewByZone(grouped);
        });
      })
      // M-5: Live zone telemetry — update occupancy when IoT sensors push data
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "zone_telemetry" }, (payload) => {
        const row = payload.new as { zone_id: string; current_occupancy: number };
        setZones((prev) => prev.map((z) => {
          if (z.id !== row.zone_id) return z;
          const currentGuests = row.current_occupancy ?? z.currentGuests;
          const pct = z.capacity > 0 ? Math.round((currentGuests / z.capacity) * 100) : 0;
          return { ...z, currentGuests, pct };
        }));
      })
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") setRealtimeStatus("connected");
        else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setRealtimeStatus("disconnected");
          if (status === "CHANNEL_ERROR") showToast("Error: Realtime socket connection failed or was refused.");
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Group zones by parent location ────────────────────────────────────
  const locationGroups: LocationGroup[] = [];
  const groupMap = new Map<string, ZoneData[]>();
  zones.forEach((z) => {
    const key = z.location_name;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(z);
  });
  groupMap.forEach((groupZones, name) => {
    const totalGuests = groupZones.reduce((s, z) => s + z.currentGuests, 0);
    const totalCapacity = groupZones.reduce((s, z) => s + z.capacity, 0);
    const avgPct = totalCapacity > 0 ? Math.round((totalGuests / totalCapacity) * 100) : 0;
    const totalCrew = groupZones.reduce((s, z) => s + (crewByZone[z.id]?.length ?? 0), 0);
    locationGroups.push({ name, type: groupZones[0]?.location_type ?? null, zones: groupZones, totalGuests, totalCapacity, avgPct, totalCrew });
  });
  locationGroups.sort((a, b) => a.name.localeCompare(b.name));

  const totalGuests = zones.reduce((s, z) => s + z.currentGuests, 0);
  const avgLoad = zones.length > 0 ? Math.round(zones.reduce((s, z) => s + z.pct, 0) / zones.length) : 0;
  const critical = zones.filter((z) => z.pct >= 90).length;
  const totalCrewOnSite = Object.values(crewByZone).reduce((s, arr) => s + arr.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground text-sm">Initializing telemetry…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        <div>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
            Real-time guest + crew throughput — grouped by location
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 border ${realtimeStatus === "connected" ? "bg-success/5 border-success/20" : realtimeStatus === "connecting" ? "bg-warning/5 border-warning/20" : "bg-destructive/5 border-destructive/20"}`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${realtimeStatus === "connected" ? "bg-success" : realtimeStatus === "connecting" ? "bg-warning" : "bg-destructive"}`} />
            <span className={`text-[10px] tracking-widest uppercase font-bold ${realtimeStatus === "connected" ? "text-success" : realtimeStatus === "connecting" ? "text-warning" : "text-destructive"}`}>
              {realtimeStatus === "connected" ? "Realtime Connected" : realtimeStatus === "connecting" ? "Connecting…" : "Disconnected"}
            </span>
          </div>
          <button onClick={refresh} className="flex items-center gap-2 bg-card border border-border hover:border-primary/40 text-muted-foreground hover:text-primary font-medium py-2 px-4 rounded-lg transition-all text-sm">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard title="Total Guests" value={totalGuests.toLocaleString()} icon={Users}
          subtitle="Park-wide occupancy" />
        <KpiCard title="Crew On-Site" value={totalCrewOnSite} icon={Activity}
          subtitle="Active personnel" />
        <KpiCard title="Avg. Load" value={`${avgLoad}%`} icon={Activity}
          variant={avgLoad >= 90 ? "danger" : avgLoad >= 70 ? "warning" : "default"}
          subtitle="Across all zones" />
        <KpiCard title="Critical Zones" value={critical} icon={AlertTriangle}
          variant={critical > 0 ? "danger" : "success"}
          subtitle=">90% capacity" />
        <KpiCard title="Locations" value={locationGroups.length} icon={MapPin}
          subtitle="Active areas" />
      </div>

      {/* Zone Telemetry Chart */}
      {zones.length > 0 && (
        <ZoneTelemetryChart zones={zones} />
      )}

      {/* Location Groups */}
      {locationGroups.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No active zones found.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {locationGroups.map((loc) => {
            const locStatus = getLoadStatus(loc.avgPct);
            const isCollapsed = collapsedLocations[loc.name] ?? false;
            const icon = LOCATION_TYPE_ICONS[loc.type ?? ""] ?? "📍";

            return (
              <div key={loc.name} className="glass rounded-xl overflow-hidden">
                {/* Location Header */}
                <button
                  onClick={() => setCollapsedLocations((prev) => ({ ...prev, [loc.name]: !prev[loc.name] }))}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs transition-transform ${isCollapsed ? "-rotate-90" : ""}`}>▼</span>
                    <span className="text-lg">{icon}</span>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-foreground">{loc.name}</h3>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{loc.type} · {loc.zones.length} zone{loc.zones.length !== 1 ? "s" : ""} · {loc.totalCrew} crew</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className={`text-lg font-bold ${locStatus.textClass}`}>{loc.totalGuests}</span>
                      <span className="text-muted-foreground/30 mx-1">/</span>
                      <span className="text-sm text-muted-foreground">{loc.totalCapacity}</span>
                    </div>
                    <div className="w-20">
                      <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${locStatus.barClass} transition-all duration-500`} style={{ width: `${loc.avgPct}%` }} />
                      </div>
                      <p className={`text-[10px] font-bold text-right mt-0.5 ${locStatus.textClass}`}>{loc.avgPct}%</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${locStatus.dotClass} animate-pulse`} />
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${locStatus.textClass}`}>{locStatus.label}</span>
                    </div>
                  </div>
                </button>

                {/* Zone Cards */}
                {!isCollapsed && (
                  <div className="border-t border-border/30 px-5 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {loc.zones.map((zone) => {
                        const status = getLoadStatus(zone.pct);
                        const crewInZone = crewByZone[zone.id] ?? [];
                        const isHovered = hoveredZone === zone.id;
                        return (
                          <div
                            key={zone.id}
                            className="bg-background/30 rounded-lg border border-border/40 overflow-hidden hover:border-primary/25 transition-all relative"
                            onMouseEnter={() => setHoveredZone(zone.id)}
                            onMouseLeave={() => setHoveredZone(null)}
                          >
                            <div className="px-3 pt-3 pb-2 flex items-start justify-between">
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-foreground truncate">{zone.name}</h4>
                                {zone.description && <p className="text-[9px] text-muted-foreground/40 truncate mt-0.5">{zone.description}</p>}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass} animate-pulse`} />
                                <span className={`text-[8px] font-bold uppercase tracking-widest ${status.textClass}`}>{status.label}</span>
                              </div>
                            </div>
                            <div className="px-3 pb-2 space-y-1.5">
                              <div className="flex items-baseline justify-between">
                                <div>
                                  <span className={`text-xl font-bold ${status.textClass}`}>{zone.currentGuests}</span>
                                  <span className="text-muted-foreground/30 text-xs mx-0.5">/</span>
                                  <span className="text-xs text-muted-foreground">{zone.capacity}</span>
                                </div>
                                <span className={`text-sm font-bold ${status.textClass}`}>{zone.pct}%</span>
                              </div>
                              <div className="h-1 bg-border/30 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${status.barClass} transition-all duration-1000`} style={{ width: `${zone.pct}%` }} />
                              </div>
                            </div>
                            {/* Crew Count Badge */}
                            <div className="px-3 py-2 border-t border-border/20 flex items-center justify-between bg-background/20">
                              <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                                👤 <span className={`font-bold ${crewInZone.length > 0 ? "text-accent" : "text-muted-foreground/30"}`}>{crewInZone.length}</span> crew
                              </span>
                              {crewInZone.some(c => c.is_mismatched) && (
                                <span className="text-[9px] text-amber-400 font-bold">⚠ MISMATCH</span>
                              )}
                            </div>

                            {/* Crew Tooltip */}
                            {isHovered && crewInZone.length > 0 && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-card border border-border rounded-lg shadow-xl p-3 min-w-[200px] max-w-[280px]">
                                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-2">Active Crew ({crewInZone.length})</p>
                                {crewInZone.map((c, i) => (
                                  <div key={i} className="flex items-center justify-between gap-2 py-1 border-b border-border/20 last:border-0">
                                    <div>
                                      <span className="text-[11px] text-foreground font-medium">{c.legal_name}</span>
                                      <span className="text-[9px] text-muted-foreground/50 ml-1 font-mono">{c.employee_id}</span>
                                    </div>
                                    {c.is_mismatched && <span className="text-[8px] text-amber-400 font-bold flex-shrink-0">OFF-STATION</span>}
                                  </div>
                                ))}
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-border" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-destructive/90 border border-destructive text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 backdrop-blur-md z-[60] animate-in">
          <span className="text-sm font-bold tracking-wide">{toast}</span>
        </div>
      )}
    </div>
  );
}

/* ── Zone Telemetry Line Chart ─────────────────────────────────── */
function ZoneTelemetryChart({ zones }: { zones: ZoneData[] }) {
  // Show top 6 zones by load for the chart
  const topZones = [...zones].sort((a, b) => b.pct - a.pct).slice(0, 6);

  // Generate mock time-series data for each zone (simulating hourly readings)
  const hours = ["8AM", "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM"];

  const colors = ["#d4af37", "#806b45", "#ef4444", "#3b82f6", "#10b981", "#a78bfa"];

  const datasets = topZones.map((zone, i) => {
    // Generate a plausible occupancy curve peaking around midday
    const baseLoad = zone.pct / 100;
    const curve = hours.map((_, hi) => {
      const peakFactor = 1 - Math.abs(hi - 5) / 6; // peak at index 5 (1PM)
      const noise = (Math.random() - 0.5) * 0.15;
      return Math.max(0, Math.min(100, Math.round(baseLoad * peakFactor * 100 * (1 + noise))));
    });

    return {
      label: zone.name.length > 18 ? zone.name.slice(0, 18) + "…" : zone.name,
      data: curve,
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length] + "15",
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: colors[i % colors.length],
      pointBorderColor: "#020408",
      pointBorderWidth: 1,
      tension: 0.4,
      fill: false,
    };
  });

  const data = { labels: hours, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: "#9ca3af", font: { size: 10 }, usePointStyle: true, pointStyleWidth: 10, padding: 12 },
      },
      tooltip: {
        backgroundColor: "rgba(2, 4, 8, 0.95)",
        borderColor: "rgba(212, 175, 55, 0.3)",
        borderWidth: 1,
        titleColor: "#d4af37",
        bodyColor: "#e5e7eb",
        padding: 10,
        callbacks: {
          label: (ctx: any) =>
            `${ctx.dataset.label}: ${ctx.parsed.y}% capacity`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#6b7280", font: { size: 10 } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#9ca3af", font: { size: 10 }, callback: (v: unknown) => `${v}%` },
        title: { display: true, text: "Capacity %", color: "#9ca3af", font: { size: 9 } },
      },
    },
  };

  return (
    <ChartContainer title="Zone Telemetry" subtitle="Top zones — hourly occupancy trend" timeToggle>
      <div className="h-[320px]">
        <Line data={data} options={options} />
      </div>
    </ChartContainer>
  );
}

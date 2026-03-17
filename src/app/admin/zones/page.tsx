import { createClient } from "@/lib/supabase/server";
import { MapPin, CheckCircle2, XCircle, Users, Building2 } from "lucide-react";
import ZoneToggleClient from "./zone-toggle-client";

type ZoneRow = {
  id: string;
  name: string;
  capacity: number | null;
  is_active: boolean | null;
  description: string | null;
  location_id: string | null;
  locations: { name: string } | null;
};

type TelemetryRow = {
  zone_id: string;
  current_occupancy: number | null;
};

export default async function ZoneConfigPage() {
  const supabase = await createClient();

  // Fetch zones joined with locations
  const { data: rawZones, error } = await supabase
    .from("zones")
    .select("id, name, capacity, is_active, description, location_id, locations(name)")
    .order("location_id")
    .order("name");

  const zones = (rawZones ?? []) as unknown as ZoneRow[];

  // Fetch telemetry for current occupancy (latest per zone)
  const { data: rawTelemetry } = await supabase
    .from("zone_telemetry")
    .select("zone_id, current_occupancy")
    .order("recorded_at", { ascending: false });

  const telemetry = (rawTelemetry ?? []) as unknown as TelemetryRow[];

  // Build: zone_id → latest occupancy
  const occupancyMap: Record<string, number> = {};
  for (const t of telemetry) {
    if (t.zone_id && !(t.zone_id in occupancyMap)) {
      occupancyMap[t.zone_id] = t.current_occupancy ?? 0;
    }
  }

  const activeCount   = zones.filter((z) => z.is_active).length;
  const totalCapacity = zones.reduce((s, z) => s + (z.capacity ?? 0), 0);

  return (
    <div className="space-y-8 pb-10">

      {/* ── Header stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Zones",    value: zones.length,                     icon: Building2,    color: "text-[#d4af37]" },
          { label: "Active",         value: activeCount,                       icon: CheckCircle2, color: "text-green-400" },
          { label: "Inactive",       value: zones.length - activeCount,        icon: XCircle,      color: "text-gray-500" },
          { label: "Total Capacity", value: totalCapacity.toLocaleString(),    icon: Users,        color: "text-[#d4af37]" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-panel rounded-lg p-4 flex items-center gap-3">
              <Icon className={`w-5 h-5 flex-shrink-0 ${s.color}`} />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">{s.label}</p>
                <p className="font-orbitron text-lg font-bold text-white">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Zone Table ───────────────────────────────────────────── */}
      <section>
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider">
          <MapPin className="w-5 h-5 mr-2" /> Zone Configuration
        </h3>

        {error ? (
          <div className="glass-panel rounded-lg p-6 text-center text-red-400 text-sm">
            Failed to load zones: {error.message}
          </div>
        ) : zones.length === 0 ? (
          <div className="glass-panel rounded-lg p-8 text-center text-gray-500 text-sm">
            No zones configured. Add zones via the database.
          </div>
        ) : (
          <div className="glass-panel rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#010204] border-b border-white/10 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Zone Name</th>
                    <th className="px-5 py-3 font-semibold">Location</th>
                    <th className="px-5 py-3 font-semibold text-center">Capacity</th>
                    <th className="px-5 py-3 font-semibold text-center">Occupancy</th>
                    <th className="px-5 py-3 font-semibold">Description</th>
                    <th className="px-5 py-3 font-semibold text-center">Status</th>
                    <th className="px-5 py-3 font-semibold text-center">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {zones.map((zone) => {
                    const occ = zone.id in occupancyMap ? occupancyMap[zone.id] : null;
                    const warn = occ !== null && zone.capacity !== null && occ / zone.capacity >= 0.9;

                    return (
                      <tr key={zone.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3 text-white font-medium">{zone.name}</td>
                        <td className="px-5 py-3">
                          <span className="text-[10px] text-[#d4af37] bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)] px-2 py-0.5 rounded">
                            {zone.locations?.name ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center text-gray-300 font-mono">
                          {zone.capacity ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {occ !== null ? (
                            <span className={`font-mono text-xs ${warn ? "text-red-400" : "text-green-400"}`}>
                              {occ}{" "}
                              <span className="text-gray-500">/{zone.capacity}</span>
                              {warn && <span className="ml-1 text-[9px] text-red-400">⚠</span>}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs">No data</span>
                          )}
                        </td>
                        <td
                          className="px-5 py-3 text-gray-400 text-xs max-w-[220px] truncate"
                          title={zone.description ?? undefined}
                        >
                          {zone.description ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {zone.is_active ? (
                            <span className="flex items-center justify-center text-green-400 text-xs gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center justify-center text-gray-500 text-xs gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <ZoneToggleClient
                            zoneId={zone.id}
                            isActive={zone.is_active ?? false}
                            zoneName={zone.name}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

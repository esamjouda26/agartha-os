"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

// ── Tier Templates CRUD ─────────────────────────────────────────────────────

export async function fetchTierTemplatesAction() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tier_templates")
    .select("*")
    .order("name");
  return data ?? [];
}

export async function createTierTemplateAction(params: {
  name: string;
  base_price: number;
  base_duration_minutes: number;
  base_perks: string[];
}) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("tier_templates").insert({
    name: params.name,
    base_price: params.base_price,
    base_duration_minutes: params.base_duration_minutes,
    base_perks: params.base_perks,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/management/operations/experiences");
  return { success: true };
}

export async function updateTierTemplateAction(
  id: string,
  updates: { base_price?: number; base_duration_minutes?: number; base_perks?: string[] }
) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("tier_templates")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/management/operations/experiences");
  return { success: true };
}

export async function deleteTierTemplateAction(id: string) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("tier_templates")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/management/operations/experiences");
  return { success: true };
}

// ── Experiences CRUD ────────────────────────────────────────────────────────

export async function fetchExperiencesWithTiersAction() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("experiences")
    .select("*, experience_tiers(*)")
    .order("name");
  return data ?? [];
}

export async function createExperienceAction(params: {
  name: string;
  description?: string;
  capacity_per_slot: number;
  max_facility_capacity: number;
  arrival_window_minutes: number;
  is_active: boolean;
  tiers: { tier_name: string; price: number; duration_minutes: number; perks: string[] }[];
}) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();

  // 1. Insert the experience
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: exp, error: expError } = await (supabase.from as any)("experiences")
    .insert({
      name: params.name,
      description: params.description || null,
      capacity_per_slot: params.capacity_per_slot,
      max_facility_capacity: params.max_facility_capacity,
      arrival_window_minutes: params.arrival_window_minutes,
      is_active: params.is_active,
    })
    .select("id")
    .single();

  if (expError) return { success: false, error: expError.message };

  // 2. Copy selected tier templates into experience_tiers with optional overrides
  if (params.tiers.length > 0) {
    const tierRows = params.tiers.map((t) => ({
      experience_id: exp.id,
      tier_name: t.tier_name,
      price: t.price,
      duration_minutes: t.duration_minutes,
      perks: t.perks,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: tierError } = await (supabase.from as any)("experience_tiers").insert(tierRows);
    if (tierError) return { success: false, error: tierError.message };
  }

  revalidatePath("/management/operations/experiences");
  return { success: true, id: exp.id };
}

export async function updateExperienceAction(
  id: string,
  updates: {
    name?: string;
    description?: string;
    capacity_per_slot?: number;
    max_facility_capacity?: number;
    arrival_window_minutes?: number;
    is_active?: boolean;
  }
) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("experiences")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/management/operations/experiences");
  return { success: true };
}

export async function deleteExperienceAction(id: string) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();
  // First delete experience_tiers, then the experience
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from as any)("experience_tiers").delete().eq("experience_id", id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("experiences").delete().eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/management/operations/experiences");
  return { success: true };
}

// ── Zone Telemetry ──────────────────────────────────────────────────────────

export async function fetchZoneTelemetryAction() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: zones } = await (supabase.from as any)("zones")
    .select("id, name, description, capacity, is_active, location_id, locations(id, name, type)")
    .eq("is_active", true)
    .order("name");

  if (!zones || (zones as unknown[]).length === 0) return [];

  // M-4 FIX: Query actual telemetry data from zone_telemetry instead of mocking.
  // Get the latest telemetry reading per zone.
  const zoneIds = (zones as { id: string }[]).map((z) => z.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: telemetry } = await (supabase.from as any)("zone_telemetry")
    .select("zone_id, current_occupancy, temperature, humidity, co2_level, recorded_at")
    .in("zone_id", zoneIds)
    .order("recorded_at", { ascending: false });

  // Build a map of zone_id → latest telemetry row (first match since ordered desc)
  const telemetryMap = new Map<string, { current_occupancy: number; temperature: number | null; humidity: number | null; co2_level: number | null }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (telemetry ?? []).forEach((row: any) => {
    if (!telemetryMap.has(row.zone_id)) {
      telemetryMap.set(row.zone_id, {
        current_occupancy: row.current_occupancy ?? 0,
        temperature: row.temperature ?? null,
        humidity: row.humidity ?? null,
        co2_level: row.co2_level ?? null,
      });
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (zones as any[]).map((zone: any) => {
    const capacity = zone.capacity ?? 100;
    const reading = telemetryMap.get(zone.id);
    const currentGuests = reading?.current_occupancy ?? 0;
    const pct = capacity > 0 ? Math.round((currentGuests / capacity) * 100) : 0;

    return {
      ...zone,
      capacity,
      currentGuests,
      pct,
      temperature: reading?.temperature ?? null,
      humidity: reading?.humidity ?? null,
      co2_level: reading?.co2_level ?? null,
      location_name: zone.locations?.name ?? "Unassigned",
      location_type: zone.locations?.type ?? null,
    };
  });
}

// ── Crew Deployment ─────────────────────────────────────────────────────────

export async function fetchCrewForDeploymentAction(date: string) {
  const supabase = await createClient();

  // Get all active staff records with their shift schedules for the given date
  const { data: staffRecords } = await supabase
    .from("staff_records")
    .select("id, user_id, employee_id, legal_name, role")
    .in("employment_status", ["active", "pending"])
    .order("role")
    .order("legal_name");

  if (!staffRecords) return { staff: [], shifts: [], zones: [] };

  // Get shift schedules for the given date — now using assigned_zone_id + current_zone_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shifts } = await (supabase.from as any)("shift_schedules")
    .select("id, staff_record_id, assigned_zone_id, current_zone_id, last_scanned_at, shift_date, start_time, end_time, status, notes")
    .eq("shift_date", date)
    .order("start_time");

  // Get active zones with parent locations for cascading dropdown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: zones } = await (supabase.from as any)("zones")
    .select("id, name, location_id, locations(id, name, type)")
    .eq("is_active", true)
    .order("name");

  return {
    staff: staffRecords ?? [],
    shifts: (shifts ?? []) as { id: string; staff_record_id: string; assigned_zone_id: string | null; current_zone_id: string | null; last_scanned_at: string | null; shift_date: string; start_time: string; end_time: string; status: string; notes: string | null }[],
    zones: (zones ?? []) as { id: string; name: string; location_id: string | null; locations: { id: string; name: string; type: string } | null }[],
  };
}

export async function setOpsDailyOverrideAction(staffId: string, date: string, dictId: string | null) {
  const caller = await requireRole("management");
  if (!caller) throw new Error("UNAUTHORIZED");

  const supabase = await createClient();
  
  // Verification bounds against rigid Role
  const { data: targetStaff } = await supabase.from("staff_records").select("role").eq("id", staffId).single();
  if (!targetStaff) throw new Error("Staff record geometry invalid");
  
  const CREW_ROLES = ["fnb_crew", "service_crew", "giftshop_crew", "runner_crew", "security_crew", "health_crew", "cleaning_crew", "experience_crew", "internal_maintainence_crew"];
  if (!CREW_ROLES.includes(targetStaff.role)) {
    throw new Error("Operations protocol limits structural alteration rights strictly to standard personnel parameters. Non-crew architectures must be delegated back to HR authorization bounds.");
  }

  let expStart = null;
  let expEnd = null;
  if (dictId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: d } = await (supabase.from as any)("shift_dictionary").select("start_time, end_time").eq("id", dictId).single();
    if (d) { expStart = d.start_time; expEnd = d.end_time; }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from as any)("shift_schedules").select("id").match({ staff_record_id: staffId, shift_date: date }).single();

  const payload: any = {
    staff_record_id: staffId,
    shift_date: date,
    shift_dictionary_id: dictId,
    expected_start_time: expStart,
    expected_end_time: expEnd,
  };
  
  if (existing) {
    payload.id = existing.id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("shift_schedules").upsert(payload, { onConflict: "staff_record_id, shift_date" });
  if (error) throw new Error(error.message);
  
  revalidatePath("/management/operations/crew-deployment");
  return { success: true };
}

export async function bulkSetOpsDailyOverrideAction(staffIds: string[], date: string, dictId: string | null) {
  const caller = await requireRole("management");
  if (!caller) throw new Error("UNAUTHORIZED");

  const supabase = await createClient();
  
  const { data: targetStaff } = await supabase.from("staff_records").select("role").in("id", staffIds);
  if (!targetStaff || targetStaff.length === 0) return { success: true };
  
  const CREW_ROLES = ["fnb_crew", "service_crew", "giftshop_crew", "runner_crew", "security_crew", "health_crew", "cleaning_crew", "experience_crew", "internal_maintainence_crew"];
  const invalid = targetStaff.some((s: any) => !CREW_ROLES.includes(s.role));
  if (invalid) {
    throw new Error("Operations protocol limits structural alteration rights strictly to standard personnel parameters. Non-crew architectures must be delegated back to HR authorization bounds.");
  }

  let expStart = null;
  let expEnd = null;
  if (dictId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: d } = await (supabase.from as any)("shift_dictionary").select("start_time, end_time").eq("id", dictId).single();
    if (d) { expStart = d.start_time; expEnd = d.end_time; }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from as any)("shift_schedules").select("id, staff_record_id").in("staff_record_id", staffIds).eq("shift_date", date);
  const existingMap = new Map((existing || []).map((e: any) => [e.staff_record_id, e.id]));

  const payloads = staffIds.map(staffId => {
    const payload: any = {
      staff_record_id: staffId,
      shift_date: date,
      shift_dictionary_id: dictId,
      expected_start_time: expStart,
      expected_end_time: expEnd,
    };
    if (existingMap.has(staffId)) payload.id = existingMap.get(staffId);
    return payload;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("shift_schedules").upsert(payloads, { onConflict: "staff_record_id, shift_date" });
  if (error) throw new Error(error.message);
  
  revalidatePath("/management/operations/crew-deployment");
  return { success: true };
}

export async function assignCrewToZoneAction(shiftId: string, zoneId: string | null) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("shift_schedules")
    .update({ assigned_zone_id: zoneId, updated_at: new Date().toISOString() })
    .eq("id", shiftId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/management/hr-roster/deployment");
  return { success: true };
}

export async function createShiftOverrideAction(params: {
  staff_record_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  assigned_zone_id?: string | null;
  notes?: string;
}) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("shift_schedules").insert({
    staff_record_id: params.staff_record_id,
    shift_date: params.shift_date,
    start_time: params.start_time,
    end_time: params.end_time,
    assigned_zone_id: params.assigned_zone_id || null,
    status: "override",
    notes: params.notes || "Operational override",
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/management/hr-roster/deployment");
  return { success: true };
}

// ── Crew Telemetry ──────────────────────────────────────────────────────────

export async function fetchCrewTelemetryAction() {
  const supabase = await createClient();

  // Get today's shifts with current_zone_id populated (live tracked crew)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shifts } = await (supabase.from as any)("shift_schedules")
    .select("id, staff_record_id, assigned_zone_id, current_zone_id, last_scanned_at, staff_records(legal_name, employee_id, role)")
    .eq("shift_date", new Date().toISOString().split("T")[0])
    .not("current_zone_id", "is", null)
    .in("status", ["scheduled", "override"]);

  return (shifts ?? []) as {
    id: string;
    staff_record_id: string;
    assigned_zone_id: string | null;
    current_zone_id: string;
    last_scanned_at: string | null;
    staff_records: { legal_name: string; employee_id: string; role: string } | null;
  }[];
}


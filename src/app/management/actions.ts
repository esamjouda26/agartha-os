"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

// ── Types ───────────────────────────────────────────────────────────────────

interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Inventory ───────────────────────────────────────────────────────────────

export async function fetchProductsAction({ page = 1, pageSize = 20, search }: PaginationParams = {}): Promise<PaginatedResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("products").select("*, product_stock_levels(current_qty, location_id)", { count: "exact" });
  if (search) query = query.ilike("name", `%${search}%`);
  const { data, count } = await query.range(from, to).order("name");

  return { data: (data ?? []) as Record<string, unknown>[], total: count ?? 0, page, pageSize };
}

export async function updateProductAction(id: string, updates: Record<string, unknown>) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("products").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { success: false, error: error.message };

  // Audit logging handled by Postgres AFTER trigger on products table

  revalidatePath("/management/inventory");
  return { success: true };
}

// ── Shift Scheduling ────────────────────────────────────────────────────────

export async function fetchShiftsAction({ page = 1, pageSize = 20 }: PaginationParams = {}): Promise<PaginatedResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("shift_schedules")
    .select("*, staff_records(legal_name, role)", { count: "exact" })
    .order("shift_date", { ascending: false })
    .range(from, to);

  return { data: (data ?? []) as Record<string, unknown>[], total: count ?? 0, page, pageSize };
}

// ── Incidents ───────────────────────────────────────────────────────────────

export async function fetchIncidentsAction({ page = 1, pageSize = 20 }: PaginationParams = {}): Promise<PaginatedResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("incidents")
    .select("*, zones(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  return { data: (data ?? []) as Record<string, unknown>[], total: count ?? 0, page, pageSize };
}

// ── Scheduler & Constraints ────────────────────────────────────────────────

export async function fetchActiveConstraintsAction(date: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("operational_constraints")
    .select("*")
    .eq("applies_to_date", date)
    .eq("is_active", true)
    .order("start_time");

  return data ?? [];
}

export async function createSlotConstraintAction(payload: { 
  name: string; 
  constraint_type: string; 
  start_time: string; 
  end_time: string; 
  applies_to_date: string; 
  notes?: string; 
}) {
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized");
  
  const supabase = await createClient();
  const { data, error } = await supabase.from("operational_constraints").insert([{
    name: payload.name,
    constraint_type: payload.constraint_type,
    start_time: payload.start_time,
    end_time: payload.end_time,
    applies_to_date: payload.applies_to_date,
    notes: payload.notes || null,
    is_active: true,
    created_by: user.id
  }]).select().single();

  if (error) throw new Error(error.message);
  revalidatePath("/management/scheduler");
  return { success: true, data };
}

export async function fetchMonthlyForecastAction(year: number, month: number, experienceId?: string) {
  const supabase = await createClient();
  // Construct first and last day of the given month (month is 0-indexed in JS, so we add 1 for Postgres Date construction)
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

  let query = supabase
    .from("time_slots")
    .select("slot_date, booked_count, override_capacity, experiences(capacity_per_slot)")
    .gte("slot_date", startDate)
    .lte("slot_date", endDate);
    
  if (experienceId) {
    query = query.eq("experience_id", experienceId);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  
  // Aggregate data by day
  const dailyLoads = new Map<string, { total_booked: number, total_cap: number }>();
  for (const row of data) {
    const d = row.slot_date;
    const baseCap = (row.experiences as any)?.capacity_per_slot ?? 0;
    const cap = row.override_capacity ?? baseCap;
    
    if (!dailyLoads.has(d)) dailyLoads.set(d, { total_booked: 0, total_cap: 0 });
    const acc = dailyLoads.get(d)!;
    acc.total_booked += row.booked_count;
    acc.total_cap += cap;
  }
  
  const result: { date: string, utilization: number }[] = [];
  dailyLoads.forEach((stats, date) => {
    result.push({
      date,
      utilization: stats.total_cap > 0 ? (stats.total_booked / stats.total_cap) * 100 : 0
    });
  });
  
  return result;
}

// ── Timeline Batch Generator ────────────────────────────────────────────────

export async function generateTimeSlotsAction(params: {
  experienceId: string;
  startDate: string;
  days: number;
  slotIntervalMinutes: number;
  dayStartHour: number;
  dayEndHour: number;
}) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("rpc_generate_time_slots", {
    p_experience_id: params.experienceId,
    p_start_date: params.startDate,
    p_days: params.days,
    p_slot_interval_minutes: params.slotIntervalMinutes,
    p_day_start_hour: params.dayStartHour,
    p_day_end_hour: params.dayEndHour,
  });

  if (error) return { success: false, error: (error as { message: string }).message };

  // Semantic audit logging handled inside rpc_generate_time_slots PL/pgSQL

  revalidatePath("/management/scheduler");
  return { success: true, data };
}

export async function overrideSlotCapacityAction(slotId: string, overrideCapacity: number | null) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("time_slots")
    .update({ override_capacity: overrideCapacity, updated_at: new Date().toISOString() })
    .eq("id", slotId);

  if (error) return { success: false, error: error.message };

  // Audit logging handled by Postgres AFTER trigger on time_slots table

  revalidatePath("/management/scheduler");
  return { success: true };
}

export async function fetchTimeSlotsForSchedulerAction(experienceId: string, date: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_slots")
    .select("*")
    .eq("experience_id", experienceId)
    .eq("slot_date", date)
    .order("start_time");

  return data ?? [];
}

export async function fetchExperiencesListAction() {
  const supabase = await createClient();
  const { data } = await supabase.from("experiences").select("id, name, capacity_per_slot, max_facility_capacity, arrival_window_minutes").eq("is_active", true);
  return data ?? [];
}

// ── Audit Log (Rule 6.3) ───────────────────────────────────────────────────

const ROLE_ENTITY_ACCESS: Record<string, string[]> = {
  it_admin: ["product", "time_slot", "device", "role", "profile", "zone", "incident", "staff_record", "maintenance_work_order"],
  business_admin: ["product", "time_slot", "device", "role", "profile", "zone", "incident", "staff_record", "maintenance_work_order"],
  human_resources_manager: ["staff_record", "shift_schedule", "incident"],
  operations_manager: ["time_slot", "incident", "zone", "maintenance_work_order"],
  inventory_manager: ["product", "purchase_order", "inventory_transfer"],
  fnb_manager: ["product", "fnb_menu_item", "fnb_order"],
  merch_manager: ["product", "inventory_transfer"],
  maintenance_manager: ["maintenance_work_order", "device", "incident"],
  marketing_manager: ["campaign", "promo_code"],
  compliance_manager: ["incident", "staff_record", "system_audit_log"],
};

export async function fetchDomainAuditLogs(entityTypes: string[], page = 1, pageSize = 25): Promise<PaginatedResult<Record<string, unknown>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const staffRole = user?.app_metadata?.staff_role as string | undefined;

  if (!staffRole) return { data: [], total: 0, page, pageSize };

  // Server-side validation: only allow entity types this role can access
  const allowedTypes = ROLE_ENTITY_ACCESS[staffRole] ?? [];
  const filteredTypes = entityTypes.filter((t) => allowedTypes.includes(t));

  if (filteredTypes.length === 0) return { data: [], total: 0, page, pageSize };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("system_audit_log")
    .select("*", { count: "exact" })
    .in("entity_type", filteredTypes)
    .order("created_at", { ascending: false })
    .range(from, to);

  return { data: (data ?? []) as Record<string, unknown>[], total: count ?? 0, page, pageSize };
}

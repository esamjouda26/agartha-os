"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

// ── Date Range Helper ─────────────────────────────────────────────────────────

function getDateRange(filter: string): { from: string; to: string; fromDate: string; toDate: string } {
  const now = new Date();
  const to = now.toISOString();
  const toDate = now.toISOString().split("T")[0];
  let from: Date;

  switch (filter) {
    case "today":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "7d":
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "mtd":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "ytd":
      from = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  return {
    from: from.toISOString(),
    to,
    fromDate: from.toISOString().split("T")[0],
    toDate,
  };
}

// ── Executive Stats ───────────────────────────────────────────────────────────

export interface ExecutiveStats {
  grossRevenue: number;
  ticketCount: number;
  guestCount: number;
  arpc: number;
  utilizationPct: number;
  tierBreakdown: { tier_name: string; count: number; revenue: number }[];
  statusBreakdown: { status: string; count: number }[];
  prevGrossRevenue: number;
  prevTicketCount: number;
}

export async function fetchExecutiveStatsAction(filter: string): Promise<ExecutiveStats> {
  const supabase = await createClient();
  const { from, to, fromDate, toDate } = getDateRange(filter);

  // Previous period for % change
  const ms = new Date(to).getTime() - new Date(from).getTime();
  const prevFrom = new Date(new Date(from).getTime() - ms).toISOString();
  const prevTo = from;

  // Current period — non-cancelled bookings
  const { data: rawBookings } = await supabase
    .from("bookings")
    .select("total_price, adult_count, child_count, tier_name, status")
    .neq("status", "cancelled")
    .gte("created_at", from)
    .lte("created_at", to);

  // Previous period
  const { data: rawPrev } = await supabase
    .from("bookings")
    .select("total_price")
    .neq("status", "cancelled")
    .gte("created_at", prevFrom)
    .lte("created_at", prevTo);

  // All statuses for breakdown
  const { data: rawAll } = await supabase
    .from("bookings")
    .select("status")
    .gte("created_at", from)
    .lte("created_at", to);

  const rows = (rawBookings ?? []) as {
    total_price: number;
    adult_count: number;
    child_count: number;
    tier_name: string;
    status: string;
  }[];

  const grossRevenue = rows.reduce((s, r) => s + Number(r.total_price), 0);
  const ticketCount = rows.length;
  const guestCount = rows.reduce((s, r) => s + (r.adult_count ?? 0) + (r.child_count ?? 0), 0);
  const arpc = guestCount > 0 ? grossRevenue / guestCount : 0;
  const prevGrossRevenue = (rawPrev ?? []).reduce((s: number, r: { total_price: number }) => s + Number(r.total_price), 0);
  const prevTicketCount = (rawPrev ?? []).length;

  // Tier breakdown
  const tierMap: Record<string, { count: number; revenue: number }> = {};
  for (const r of rows) {
    const t = r.tier_name ?? "Other";
    if (!tierMap[t]) tierMap[t] = { count: 0, revenue: 0 };
    tierMap[t].count++;
    tierMap[t].revenue += Number(r.total_price);
  }
  const tierBreakdown = Object.entries(tierMap).map(([tier_name, v]) => ({ tier_name, ...v }));

  // Status breakdown (all statuses)
  const statusMap: Record<string, number> = {};
  for (const r of (rawAll ?? []) as { status: string }[]) {
    statusMap[r.status] = (statusMap[r.status] ?? 0) + 1;
  }
  const statusBreakdown = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  // Utilization from time_slots (booked vs capacity)
  const { data: rawSlots } = await supabase
    .from("time_slots")
    .select("booked_count, override_capacity, experience_id")
    .gte("slot_date", fromDate)
    .lte("slot_date", toDate)
    .eq("is_active", true);

  const slots = (rawSlots ?? []) as { booked_count: number; override_capacity: number | null; experience_id: string }[];
  const slotsWithCap = slots.filter((s) => s.override_capacity);
  const totalCapacity = slotsWithCap.reduce((s, sl) => s + (sl.override_capacity ?? 0), 0);
  const totalBooked = slotsWithCap.reduce((s, sl) => s + (sl.booked_count ?? 0), 0);
  const utilizationPct = totalCapacity > 0 ? Math.min(100, Math.round((totalBooked / totalCapacity) * 100)) : 0;

  return {
    grossRevenue,
    ticketCount,
    guestCount,
    arpc,
    utilizationPct,
    tierBreakdown,
    statusBreakdown,
    prevGrossRevenue,
    prevTicketCount,
  };
}

// ── GX Analytics ─────────────────────────────────────────────────────────────

export interface GxAnalytics {
  tierData: { label: string; pct: number; color: string }[];
  demoData: { label: string; pct: number; color: string }[];
  commitmentData: { label: string; pct: number; color: string }[];
  totalBookings: number;
}

export async function fetchGxAnalyticsAction(filter: string): Promise<GxAnalytics> {
  const supabase = await createClient();
  const { from, to } = getDateRange(filter);

  const { data: rawBookings } = await supabase
    .from("bookings")
    .select("tier_name, adult_count, child_count, status")
    .gte("created_at", from)
    .lte("created_at", to);

  const rows = (rawBookings ?? []) as {
    tier_name: string;
    adult_count: number;
    child_count: number;
    status: string;
  }[];
  const total = rows.length;

  // Tier distribution
  const TIER_COLORS: Record<string, string> = {
    Skimmer: "rgba(255,255,255,0.15)",
    Swimmer: "#806b45",
    Diver: "#d4af37",
  };
  const tierMap: Record<string, number> = {};
  for (const r of rows) {
    const t = r.tier_name ?? "Other";
    tierMap[t] = (tierMap[t] ?? 0) + 1;
  }
  const tierData = Object.entries(tierMap).map(([label, count]) => ({
    label,
    pct: total > 0 ? Math.round((count / total) * 100) : 0,
    color: TIER_COLORS[label] ?? "#806b45",
  }));

  // Adult / child split
  const adults = rows.reduce((s, r) => s + (r.adult_count ?? 0), 0);
  const children = rows.reduce((s, r) => s + (r.child_count ?? 0), 0);
  const gTotal = adults + children;
  const demoData = [
    { label: "Adults", pct: gTotal > 0 ? Math.round((adults / gTotal) * 100) : 0, color: "#d4af37" },
    { label: "Children", pct: gTotal > 0 ? Math.round((children / gTotal) * 100) : 0, color: "#806b45" },
  ];

  // Commitment rate from booking statuses
  const kept = rows.filter((r) =>
    ["confirmed", "checked_in", "completed"].includes(r.status)
  ).length;
  const cancelled = rows.filter((r) => r.status === "cancelled").length;
  const pending = total - kept - cancelled;
  const commitmentData = [
    { label: "Kept", pct: total > 0 ? Math.round((kept / total) * 100) : 0, color: "#22c55e" },
    { label: "Pending", pct: total > 0 ? Math.round((pending / total) * 100) : 0, color: "#eab308" },
    { label: "Cancelled", pct: total > 0 ? Math.round((cancelled / total) * 100) : 0, color: "#ef4444" },
  ];

  return { tierData, demoData, commitmentData, totalBookings: total };
}

// ── Reports — Real Data Query ─────────────────────────────────────────────────

export interface ReportResult {
  metric: string;
  summary: string;
  count: number;
  rows: Record<string, string | number>[];
}

export async function fetchReportDataAction(metric: string, timeframe: string): Promise<ReportResult> {
  const supabase = await createClient();
  const filterMap: Record<string, string> = {
    today: "today",
    last_7_days: "7d",
    custom_range: "mtd",
    mtd: "mtd",
    ytd: "ytd",
  };
  const { from, to } = getDateRange(filterMap[timeframe] ?? "7d");

  switch (metric) {
    case "gross_revenue": {
      const { data } = await supabase
        .from("bookings")
        .select("total_price, tier_name, status, created_at, booker_email")
        .neq("status", "cancelled")
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: false })
        .limit(20);

      const rows = (data ?? []) as { total_price: number; tier_name: string; status: string; created_at: string; booker_email: string }[];
      const total = rows.reduce((s, r) => s + Number(r.total_price), 0);
      return {
        metric,
        summary: `RM ${total.toLocaleString("en-MY", { minimumFractionDigits: 2 })} gross revenue across ${rows.length} bookings (${timeframe.replace(/_/g, " ")})`,
        count: rows.length,
        rows: rows.map((r) => ({
          Date: new Date(r.created_at).toLocaleDateString(),
          Tier: r.tier_name,
          Status: r.status,
          Revenue: `RM ${Number(r.total_price).toFixed(2)}`,
          Guest: r.booker_email,
        })),
      };
    }

    case "gx_demographics": {
      const { data } = await supabase
        .from("bookings")
        .select("adult_count, child_count, tier_name, created_at")
        .neq("status", "cancelled")
        .gte("created_at", from)
        .lte("created_at", to)
        .limit(20);

      const rows = (data ?? []) as { adult_count: number; child_count: number; tier_name: string; created_at: string }[];
      const adults = rows.reduce((s, r) => s + (r.adult_count ?? 0), 0);
      const children = rows.reduce((s, r) => s + (r.child_count ?? 0), 0);
      return {
        metric,
        summary: `${adults} adults + ${children} children across ${rows.length} bookings (${timeframe.replace(/_/g, " ")})`,
        count: rows.length,
        rows: rows.map((r) => ({
          Date: new Date(r.created_at).toLocaleDateString(),
          Tier: r.tier_name,
          Adults: r.adult_count,
          Children: r.child_count,
          Total: (r.adult_count ?? 0) + (r.child_count ?? 0),
        })),
      };
    }

    case "ancillary_conversion": {
      const { data } = await supabase
        .from("bookings")
        .select("face_pay_enabled, auto_capture_opt, tier_name, created_at")
        .neq("status", "cancelled")
        .gte("created_at", from)
        .lte("created_at", to)
        .limit(20);

      const rows = (data ?? []) as { face_pay_enabled: boolean; auto_capture_opt: boolean; tier_name: string; created_at: string }[];
      const fp = rows.filter((r) => r.face_pay_enabled).length;
      const ac = rows.filter((r) => r.auto_capture_opt).length;
      return {
        metric,
        summary: `Face Pay: ${fp}/${rows.length} (${rows.length > 0 ? Math.round((fp / rows.length) * 100) : 0}% attach) | Auto-Capture: ${ac}/${rows.length} opted in`,
        count: rows.length,
        rows: rows.map((r) => ({
          Date: new Date(r.created_at).toLocaleDateString(),
          Tier: r.tier_name,
          "Face Pay": r.face_pay_enabled ? "Yes" : "No",
          "Auto Capture": r.auto_capture_opt ? "Yes" : "No",
        })),
      };
    }

    case "nps_summaries":
    default:
      return {
        metric,
        summary: `NPS / survey data requires a feedback integration — no survey table exists in the current schema.`,
        count: 0,
        rows: [],
      };
  }
}

// ── IAM Requests ─────────────────────────────────────────────────────────────

export interface IamRequest {
  id: string;
  request_type: string;
  status: string;
  target_role: string | null;
  current_role: string | null;
  justification: string | null;
  created_at: string;
  legal_name: string | null;
  employee_id: string | null;
}

export async function fetchIamRequestsAction(): Promise<IamRequest[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)("iam_requests")
    .select(`
      id, request_type, status, target_role, current_role,
      justification, created_at,
      staff_records ( legal_name, employee_id )
    `)
    .in("status", ["pending_hr", "pending_it"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchIamRequestsAction error:", error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: r.id,
    request_type: r.request_type,
    status: r.status,
    target_role: r.target_role ?? null,
    current_role: r.current_role ?? null,
    justification: r.justification ?? null,
    created_at: r.created_at,
    legal_name: r.staff_records?.legal_name ?? null,
    employee_id: r.staff_records?.employee_id ?? null,
  }));
}

export async function approveIamRequestAction(requestId: string, note?: string) {
  const caller = await requireRole("admin");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: req } = await (supabase.from as any)("iam_requests")
    .select("status")
    .eq("id", requestId)
    .single();

  const currentStatus = (req as { status: string } | null)?.status;
  // pending_hr → pending_it (HR step done); pending_it → approved (IT step done)
  const newStatus = currentStatus === "pending_hr" ? "pending_it" : "approved";

  const payload: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (newStatus === "approved") {
    payload.it_approved_by = caller.id;
    payload.it_approved_at = new Date().toISOString();
    if (note) payload.it_auth_note = note;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("iam_requests")
    .update(payload)
    .eq("id", requestId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/access-control");
  return { success: true, newStatus };
}

export async function rejectIamRequestAction(requestId: string) {
  const caller = await requireRole("admin");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (createClient().then((s) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s.from as any)("iam_requests")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", requestId)
  ));

  if (error) return { success: false, error: (error as { message: string }).message };
  revalidatePath("/admin/access-control");
  return { success: true };
}

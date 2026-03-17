import { createClient } from "@/lib/supabase/server";
import StaffingClient from "./staffing-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface StaffShiftRow {
  id: string;
  legal_name: string;
  role: string;
  employment_status: string;
  shift_schedules: {
    shift_date: string;
    start_time: string;
    end_time: string;
    status: string;
    zones: { name: string } | null;
  }[];
}

/* ── Page (Server Component) ──────────────────────────────────────── */
export default async function FnBStaffingPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("staff_records")
    .select(`
      id, legal_name, role, employment_status,
      shift_schedules(shift_date, start_time, end_time, status, zones(name))
    `)
    .eq("role", "fnb_crew")
    .eq("employment_status", "active") as { data: StaffShiftRow[] | null };

  return <StaffingClient staff={data ?? []} today={today} />;
}

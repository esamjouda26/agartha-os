import { createClient } from "@/lib/supabase/server";
import StaffingClient from "./staffing-client";

export default async function StaffingPage() {
  const supabase = await createClient();
  // Get today's local date based on UTC
  const todayRaw = new Date();
  const today = new Date(todayRaw.getTime() - todayRaw.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const { data } = await supabase
    .from("shift_schedules")
    .select(`
      id, shift_date, expected_start_time, expected_end_time, clock_in, clock_out,
      staff_records!inner (
        profiles!inner (
          id, display_name, employee_id, staff_role, employment_status
        )
      )
    `)
    .eq("shift_date", today);

  const flatData = (data || []).map((shift: any) => {
    const profiles = shift.staff_records?.profiles;
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;
    return {
      shift_id: shift.id,
      employee_id: profile?.employee_id || "N/A",
      display_name: profile?.display_name || "Unknown",
      staff_role: profile?.staff_role || "Unknown",
      employment_status: profile?.employment_status || "Unknown",
      expected_start_time: shift.expected_start_time,
      expected_end_time: shift.expected_end_time,
      clock_in: shift.clock_in,
      clock_out: shift.clock_out,
    };
  }).filter((s) => ["fnb_crew", "giftshop_crew", "fnb_manager"].includes(s.staff_role) && s.employment_status === "active");

  return <StaffingClient staff={flatData} today={today} />;
}

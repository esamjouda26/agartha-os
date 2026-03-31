"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Types ──────────────────────────────────────────────────────────────────
export type AttendanceStatus = "Normal" | "Late" | "Early";

export interface CheckInResult {
  success: true;
  status: AttendanceStatus;
  minutesDiff: number; // positive = late, 0 = on-time
}

export interface CheckOutResult {
  success: true;
  status: AttendanceStatus;
  minutesDiff: number; // positive = early-departure, 0 = on-time
  actualHours: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Parse "HH:MM:SS" time string into today's KL Date for comparison */
function toTodayKLDate(timeStr: string): Date {
  const klNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
  );
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(klNow);
  d.setHours(h, m, 0, 0);
  return d;
}

// ── submitCheckIn ──────────────────────────────────────────────────────────
export async function submitCheckIn(
  photoBase64: string,
  gpsLocation: string // JSON string: { lat, lng, accuracy }
): Promise<CheckInResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("staff_record_id")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.staff_record_id) throw new Error("Staff record not linked to auth account.");

  // KL date string for shift lookup
  const klDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const { data: shift } = await supabase
    .from("shift_schedules")
    .select("id, expected_start_time, clock_in")
    .eq("staff_record_id", profile.staff_record_id)
    .eq("shift_date", klDate)
    .order("expected_start_time", { ascending: true })
    .limit(1)
    .single();

  if (!shift) throw new Error("No shift assigned for today.");
  if (shift.clock_in) throw new Error("Already clocked in for this shift.");
  if (!shift.expected_start_time) throw new Error("Shift has no scheduled start time.");

  const now = new Date();
  const nowKL = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
  );
  const expectedStart = toTodayKLDate(shift.expected_start_time);
  const diffMs = nowKL.getTime() - expectedStart.getTime();
  const minutesDiff = Math.round(diffMs / 60000);
  const status: AttendanceStatus = minutesDiff > 5 ? "Late" : "Normal";

  const { error } = await supabase
    .from("shift_schedules")
    .update({
      clock_in: now.toISOString(),
      clock_in_photo: photoBase64,
      clock_in_location: gpsLocation,
    })
    .eq("id", shift.id);

  if (error) throw new Error("Check-in failed: " + error.message);

  revalidatePath("/crew/attendance");
  return { success: true, status, minutesDiff };
}

// ── submitCheckOut ─────────────────────────────────────────────────────────
export async function submitCheckOut(
  shiftId: string,
  photoBase64: string,
  gpsLocation: string
): Promise<CheckOutResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: shift } = await supabase
    .from("shift_schedules")
    .select("clock_in, expected_end_time")
    .eq("id", shiftId)
    .single();

  if (!shift?.clock_in) throw new Error("Cannot clock out: no clock-in recorded.");
  if (!shift.expected_end_time) throw new Error("Shift has no scheduled end time.");

  const now = new Date();
  const nowKL = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
  );
  const expectedEnd = toTodayKLDate(shift.expected_end_time);
  const diffMs = expectedEnd.getTime() - nowKL.getTime(); // positive = clocking out early
  const minutesDiff = Math.round(diffMs / 60000);
  const status: AttendanceStatus = minutesDiff > 5 ? "Early" : "Normal";

  const clockInTS = new Date(shift.clock_in).getTime();
  const actualHours = Number(((now.getTime() - clockInTS) / 3_600_000).toFixed(2));

  const { error } = await supabase
    .from("shift_schedules")
    .update({
      clock_out: now.toISOString(),
      clock_out_photo: photoBase64,
      clock_out_location: gpsLocation,
      actual_hours: actualHours,
    })
    .eq("id", shiftId);

  if (error) throw new Error("Check-out failed: " + error.message);

  revalidatePath("/crew/attendance");
  return { success: true, status, minutesDiff, actualHours };
}

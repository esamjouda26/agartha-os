"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getLedger(start: string, end: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shift_schedules")
    .select(`
      *,
      staff_records (
        id, legal_name,
        profiles!profiles_staff_record_id_fkey(employee_id, staff_role)
      ),
      leave_requests ( id, type, status )
    `)
    .gte("shift_date", start)
    .lte("shift_date", end)
    .order("shift_date", { ascending: false });

  if (error) {
    console.error("Ledger Fetch Error:", error);
    return [];
  }

  // Flatten profiles into staff_records so clients keep the same access pattern
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => {
    const sr = row.staff_records;
    if (sr) {
      const profile = Array.isArray(sr.profiles) ? sr.profiles[0] : sr.profiles;
      row.staff_records = {
        ...sr,
        employee_id: profile?.employee_id ?? null,
        role: profile?.staff_role ?? null,
        profiles: undefined,
      };
    }
    return row;
  });
}

export async function getLeaves() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leave_requests")
    .select(`
      *,
      staff_records (
        id, legal_name,
        profiles!profiles_staff_record_id_fkey(employee_id, staff_role)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Leaves Fetch Error:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => {
    const sr = row.staff_records;
    if (sr) {
      const profile = Array.isArray(sr.profiles) ? sr.profiles[0] : sr.profiles;
      row.staff_records = {
        ...sr,
        employee_id: profile?.employee_id ?? null,
        role: profile?.staff_role ?? null,
        profiles: undefined,
      };
    }
    return row;
  });
}

export async function getDiscrepancies() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_discrepancies")
    .select(`
      *,
      shift_schedules (
        id, shift_date, expected_start_time, expected_end_time, clock_in, clock_out,
        staff_records (
          id, legal_name,
          profiles!profiles_staff_record_id_fkey(employee_id, staff_role)
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Discrepancies Fetch Error:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((disc: any) => {
    const sr = disc.shift_schedules?.staff_records;
    if (sr) {
      const profile = Array.isArray(sr.profiles) ? sr.profiles[0] : sr.profiles;
      disc.shift_schedules.staff_records = {
        ...sr,
        employee_id: profile?.employee_id ?? null,
        role: profile?.staff_role ?? null,
        profiles: undefined,
      };
    }
    return disc;
  });
}


export async function approveLeave(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("leave_requests").update({ status: "approved" }).eq("id", id);
  if (error) throw new Error(error.message);

  const { data: leave } = await supabase.from("leave_requests").select("*").eq("id", id).single();
  if (leave && leave.staff_record_id) {
    // Mathematically suppress schedule gaps
    await supabase.from("shift_schedules")
      .update({ linked_leave_id: id })
      .eq("staff_record_id", leave.staff_record_id)
      .gte("shift_date", leave.start_date)
      .lte("shift_date", leave.end_date);
  }
  revalidatePath("/management/hr-roster/attendance");
}

export async function rejectLeave(id: string, reason: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("leave_requests").update({ status: "rejected", rejection_reason: reason }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/management/hr-roster/attendance");
}

export async function resolveDiscrepancy(id: string, shiftId: string, isApproved: boolean, reason: string) {
  const supabase = await createClient();
  
  const status = isApproved ? "justified" : "unjustified";

  // Phase 4: Zero Trust Auto-Calculation (Server-Side Offset Enforcement)
  const { data: disc } = await supabase.from("attendance_discrepancies").select("type").eq("id", id).single();
  if (!disc) throw new Error("Fatal Validation Error: Structural Discrepancy node could not be retrieved.");

  const { error } = await supabase.from("attendance_discrepancies").update({ 
    status, 
    justification_reason: reason 
  }).eq("id", id);
  
  if (error) throw new Error("Database constraints rejected discrepancy approval: " + error.message);

  if (isApproved) {
     const { data: shift } = await supabase.from("shift_schedules")
        .select("shift_date, expected_start_time, expected_end_time, clock_in, clock_out, justified_hours")
        .eq("id", shiftId).single();
     
     if (shift && shift.expected_start_time && shift.expected_end_time) {
        let gapMs = 0;
        
        // Helper to construct absolute JS Date timestamps locked physically inside local parameters
        const constructLocalPing = (baseDate: string, timeString: string) => {
           return new Date(`${baseDate}T${timeString}+08:00`).getTime();
        };

        const expectedStartTS = constructLocalPing(shift.shift_date, shift.expected_start_time);
        
        let expectedEndTS = constructLocalPing(shift.shift_date, shift.expected_end_time);
        // Handle physical day crossover math for 24h Night Shifts
        if (expectedEndTS < expectedStartTS) expectedEndTS += (24 * 60 * 60 * 1000);

        if (disc.type === "late_arrival" && shift.clock_in) {
             const actualStartTS = new Date(shift.clock_in).getTime();
             gapMs = actualStartTS - expectedStartTS;
        } else if (disc.type === "early_departure" && shift.clock_out) {
             const actualEndTS = new Date(shift.clock_out).getTime();
             gapMs = expectedEndTS - actualEndTS;
        } else if (["missing_checkin", "missing_checkout", "absent"].includes(disc.type)) {
             gapMs = expectedEndTS - expectedStartTS;
        }

        if (gapMs > 0) {
            const computedGapHours = gapMs / (1000 * 60 * 60);
            const newHrs = Number(shift.justified_hours || 0) + computedGapHours;
            await supabase.from("shift_schedules").update({ justified_hours: Number(newHrs.toFixed(2)) }).eq("id", shiftId);
        }
     }
  }
  revalidatePath("/management/hr-roster/attendance");
}

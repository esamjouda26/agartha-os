"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getSetupData() {
  const supabase = await createClient();
  
  const { data: staff } = await supabase
    .from("staff_records")
    .select("id, legal_name, employee_id, role")
    .order("legal_name");

  const { data: dict } = await supabase
    .from("shift_dictionary")
    .select("*")
    .order("code");

  const { data: patterns } = await supabase
    .from("weekly_patterns")
    .select("*");

  return { 
    staff: staff || [], 
    dict: dict || [], 
    patterns: patterns || [] 
  };
}

export async function getDailyShifts(date: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shift_schedules")
    .select("*, leave_requests(type, status)")
    .eq("shift_date", date);

  if (error) {
    console.error("Failed to fetch daily shifts:", error);
    return [];
  }
  return data || [];
}

export async function saveShiftDictionary(shift: any) {
  const supabase = await createClient();
  const payload: any = {
    code: shift.code,
    start_time: shift.start_time,
    end_time: shift.end_time,
    color: shift.color
  };
  if (shift.id && !shift.id.startsWith("new")) {
    payload.id = shift.id;
  }
  const { error } = await supabase.from("shift_dictionary").upsert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/management/hr-roster/shifts");
}

export async function deleteShiftDictionary(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("shift_dictionary").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/management/hr-roster/shifts");
}

export async function saveWeeklyPatterns(patterns: any[]) {
  const supabase = await createClient();
  // UPSERT patterns array into weekly_patterns
  if (!patterns.length) return { success: true };
  const { error } = await supabase.from("weekly_patterns").upsert(patterns, { onConflict: "staff_record_id, day_of_week" });
  if (error) throw new Error(error.message);
  revalidatePath("/management/hr-roster/shifts");
  return { success: true };
}

export async function deleteWeeklyPattern(staffId: string, dayOfWeek: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("weekly_patterns").delete().match({ staff_record_id: staffId, day_of_week: dayOfWeek });
  if (error) throw new Error(error.message);
  revalidatePath("/management/hr-roster/shifts");
  return { success: true };
}

export async function setDailyOverride(staffId: string, date: string, dictId: string | null) {
  const supabase = await createClient();
  
  let expStart = null;
  let expEnd = null;
  if (dictId) {
    const { data: d } = await supabase.from("shift_dictionary").select("start_time, end_time").eq("id", dictId).single();
    if (d) { expStart = d.start_time; expEnd = d.end_time; }
  }

  // Find if exists
  const { data: existing } = await supabase.from("shift_schedules").select("id").match({ staff_record_id: staffId, shift_date: date }).single();

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

  const { error } = await supabase.from("shift_schedules").upsert(payload, { onConflict: "staff_record_id, shift_date" });
  if (error) throw new Error(error.message);
  
  revalidatePath("/management/hr-roster/shifts");
  return { success: true };
}

export async function bulkSetDailyOverride(staffIds: string[], date: string, dictId: string | null) {
  const supabase = await createClient();
  
  let expStart = null;
  let expEnd = null;
  if (dictId) {
    const { data: d } = await supabase.from("shift_dictionary").select("start_time, end_time").eq("id", dictId).single();
    if (d) { expStart = d.start_time; expEnd = d.end_time; }
  }

  const { data: existing } = await supabase.from("shift_schedules").select("id, staff_record_id").in("staff_record_id", staffIds).eq("shift_date", date);
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

  const { error } = await supabase.from("shift_schedules").upsert(payloads, { onConflict: "staff_record_id, shift_date" });
  if (error) throw new Error(error.message);
  
  revalidatePath("/management/hr-roster/shifts");
  return { success: true };
}

export async function unrollWeeklyPatterns(startDateStr: string, endDateStr: string) {
  const supabase = await createClient();
  
  const { data: staff } = await supabase.from("staff_records").select("id");
  const { data: patterns } = await supabase.from("weekly_patterns").select("*");
  const { data: dict } = await supabase.from("shift_dictionary").select("*");
  if (!staff || !patterns || !dict) return { error: "Failed to fetch necessary structure." };

  const dictMap = new Map((dict || []).map((d: any) => [d.id, d]));
  const offShiftId = (dict || []).find((d: any) => d.is_day_off)?.id || null;
  const patternMap = new Map();
  (patterns || []).forEach((p: any) => {
     if(!patternMap.has(p.staff_record_id)) patternMap.set(p.staff_record_id, new Map());
     patternMap.get(p.staff_record_id).set(p.day_of_week, p);
  });

  const startObj = new Date(startDateStr + "T00:00:00");
  const endObj = new Date(endDateStr + "T00:00:00");
  const inserts = [];

  for (let d = new Date(startObj); d <= endObj; d.setDate(d.getDate() + 1)) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const shiftDate = `${year}-${month}-${date}`;
    
    let jsDay = d.getDay();
    let dbDay = jsDay === 0 ? 7 : jsDay;

    for (const emp of (staff || [])) {
      const pat = patternMap.get(emp.id)?.get(dbDay);
      
      let targetDictId = offShiftId;
      let expectedStart = null;
      let expectedEnd = null;

      if (pat && pat.shift_dictionary_id !== null) {
          const shiftDef = dictMap.get(pat.shift_dictionary_id);
          if (shiftDef) {
             targetDictId = shiftDef.id;
             expectedStart = shiftDef.start_time;
             expectedEnd = shiftDef.end_time;
          }
      }
      
      inserts.push({
        staff_record_id: emp.id,
        shift_date: shiftDate,
        shift_dictionary_id: targetDictId,
        expected_start_time: expectedStart,
        expected_end_time: expectedEnd
      });
    }
  }

  // UPSERT the entirely dense explicit pattern mapping into shift_schedules
  const chunkSize = 1000;
  for (let i = 0; i < inserts.length; i += chunkSize) {
    const { error: insertErr } = await supabase.from("shift_schedules").upsert(
      inserts.slice(i, i + chunkSize), 
      { onConflict: "staff_record_id, shift_date" }
    );
    if (insertErr) return { error: `Upsertion failed: ${insertErr.message}` };
  }
  
  return { success: true };
}


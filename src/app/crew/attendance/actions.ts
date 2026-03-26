"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitCheckIn(photoRef: string, locationData: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Resolve staff_record_id securely via auth.uid()
  const { data: staff } = await supabase
    .from('staff_records')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!staff) throw new Error("Staff record not securely linked to external IAM auth.");

  // 2. Fetch today's assigned shift configuration locked physically inside KL timezone bounds
  const klDate = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Asia/Kuala_Lumpur', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(new Date());

  const { data: shift } = await supabase
    .from('shift_schedules')
    .select('id')
    .eq('staff_record_id', staff.id)
    .eq('shift_date', klDate)
    .order('expected_start_time', { ascending: true })
    .limit(1)
    .single();

  if (!shift) throw new Error("No operational shift bounds assigned for today.");

  // 3. Update the shift record exactly once.
  const { error } = await supabase
    .from('shift_schedules')
    .update({ 
      clock_in: new Date().toISOString(),
      clock_in_photo: photoRef 
    })
    .eq('id', shift.id);

  if (error) throw new Error("Database constraints rejected check-in payload: " + error.message);

  revalidatePath('/crew/attendance');
  return { success: true };
}

export async function submitCheckOut(shiftId: string, photoRef: string, locationData: string) {
  const supabase = await createClient();
  
  // Fetch existing clock_in bound to calculate quantitative difference natively on server
  const { data: shift } = await supabase
    .from('shift_schedules')
    .select('clock_in')
    .eq('id', shiftId)
    .single();

  if (!shift || !shift.clock_in) throw new Error("Critical synchronization failure: Missing physical clock-in initialization bound.");

  const clockInTS = new Date(shift.clock_in).getTime();
  const clockOutTS = new Date().getTime();
  const computedHours = (clockOutTS - clockInTS) / (1000 * 60 * 60);

  const { error } = await supabase
    .from('shift_schedules')
    .update({ 
      clock_out: new Date(clockOutTS).toISOString(),
      clock_out_photo: photoRef,
      actual_hours: Number(computedHours.toFixed(2))
    })
    .eq('id', shiftId);

  if (error) throw new Error("Failed to formalize check-out telemetry constraints: " + error.message);

  revalidatePath('/crew/attendance');
  return { success: true };
}

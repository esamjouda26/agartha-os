import { createClient } from "@/lib/supabase/server";
import AttendanceClient from "./attendance-client";

export default async function AttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let todaysShift = null;

  if (user) {
    // Standard Resolution mapping `user_id` to actual organizational records
    const { data: staff } = await supabase
      .from('staff_records')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (staff) {
      // Look up today's current shift
      const today = new Date().toISOString().split('T')[0];
      const { data: shift } = await supabase
        .from('shift_schedules')
        .select('*')
        .eq('staff_record_id', staff.id)
        .eq('shift_date', today)
        .order('expected_start_time', { ascending: true })
        .limit(1)
        .single();
      
      todaysShift = shift;
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <AttendanceClient 
        todaysShift={todaysShift} 
      />
    </div>
  );
}

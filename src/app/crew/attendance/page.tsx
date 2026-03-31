import { createClient } from "@/lib/supabase/server";
import AttendanceClient from "./attendance-client";

export default async function AttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let todaysShift = null;

  if (user) {
    // Structural Resolution mapping `profile` to staff organizational record
    const { data: profile } = await supabase
      .from('profiles')
      .select('staff_record_id')
      .eq('id', user.id)
      .single();

    if (profile && profile.staff_record_id) {
      // Look up today's current shift using precise KL timezone
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kuala_Lumpur",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

      const { data: shift } = await supabase
        .from('shift_schedules')
        .select('*')
        .eq('staff_record_id', profile.staff_record_id)
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

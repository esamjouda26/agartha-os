import { createClient } from "@/lib/supabase/server";
import ZoneCheckClient from "./zone-check-client";

export default async function ZoneCheckInPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let activeLocation = null;
  let zones: any[] = [];

  if (user) {
    const { data: staff } = await supabase
      .from('staff_records')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (staff) {
      // Find active incomplete check-in log
      const { data: loc } = await supabase
        .from('crew_locations')
        .select(`*, zones(name)`)
        .eq('staff_record_id', staff.id)
        .is('left_at', null)
        .order('scanned_at', { ascending: false })
        .limit(1)
        .single();
        
      activeLocation = loc;
    }
    
    // Fetch reference zones
    const { data: z } = await supabase
      .from('zones')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true });
      
    zones = z || [];
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
       <ZoneCheckClient zones={zones} activeLocation={activeLocation} />
    </div>
  );
}

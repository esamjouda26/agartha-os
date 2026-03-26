"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function checkIntoZone(zoneId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Retrieve user's actual staff record mapping securely
  const { data: staff } = await supabase
    .from('staff_records')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!staff) throw new Error("User mapping to HR entity denied.");

  // Check if they are already in a zone and auto close it
  const { data: activeLocation } = await supabase
    .from('crew_locations')
    .select('id')
    .eq('staff_record_id', staff.id)
    .is('left_at', null)
    .single();

  if (activeLocation) {
    await supabase.from('crew_locations').update({ left_at: new Date().toISOString() }).eq('id', activeLocation.id);
  }

  // Insert new active entry
  const { error } = await supabase.from('crew_locations').insert({
    staff_record_id: staff.id,
    zone_id: zoneId,
    scanned_at: new Date().toISOString()
  });

  if (error) throw new Error("Failed to register structural zone: " + error.message);
  revalidatePath('/crew/zone-check-in');
  return { success: true };
}

export async function checkOutOfZone(locationRecordId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('crew_locations')
    .update({ left_at: new Date().toISOString() })
    .eq('id', locationRecordId);
    
  if (error) throw new Error("Failed to process zone exit: " + error.message);
  revalidatePath('/crew/zone-check-in');
  return { success: true };
}

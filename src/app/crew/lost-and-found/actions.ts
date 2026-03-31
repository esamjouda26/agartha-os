"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitLostFoundReport(
  category: 'lost_report' | 'found_report',
  description: string,
  zone_id: string,
  attachment_url: string | null,
  metadata: {
    laf_type: 'lost_child' | 'lost_item' | 'found_child' | 'found_item';
    item_name: string;
    guest_name?: string;
    guest_phone?: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("incidents").insert({
    category,
    description,
    status: "open",
    zone_id,
    attachment_url,
    metadata,
    logged_by: user.id,
  });

  if (error) throw new Error("Database Constraint Failure: " + error.message);
  
  revalidatePath("/crew/lost-and-found");
  return { success: true };
}

export async function resolveLostFoundIncident(id: string, resolutionPhotoUrl: string | null = null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  // Natively bypass RLS limitations by bridging through a SECURITY DEFINER Postgres Function.
  // This physically isolates the UPDATE command from the Crew's restricted JWT.
  const { error } = await (supabase.rpc as any)('resolve_incident', {
    p_incident_id: id,
    p_attachment_url: resolutionPhotoUrl
  });
  
  if (error) throw new Error("Database Access Blocked: " + error.message);

  revalidatePath("/crew/lost-and-found");
  return { success: true };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitLostFoundReport(category: 'lost_report' | 'found_report', description: string, metadata: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const finalMetadata = {
    ...metadata,
    isLostAndFound: true,
    lafCategory: category // Store logical category here
  };

  const { error } = await supabase.from("incidents").insert({
    category: "guest_complaint" as any,
    description,
    status: "open" as any, // Adhering to incident_status enum limits
    metadata: finalMetadata as any,
    logged_by: user.id, // Column is logged_by, not reported_by based on SQL table
  } as any);

  if (error) throw new Error("Failed to submit report: " + error.message);
  
  revalidatePath("/crew/lost-and-found");
  return { success: true };
}

export async function updateLostFoundStatus(id: string, newStatus: string, newCategory?: 'found_report') {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  // Execute the strictly bound PostgreSQL RPC function.
  // The 'update_laf_status' acts as a SECURITY DEFINER, securely executing the JSONB transition
  // without granting the user broader access to the incidents table.
  const { error } = await (supabase.rpc as any)('update_laf_status', {
    p_incident_id: id,
    p_new_status: newStatus,
    p_new_category: newCategory || null
  });

  if (error) {
    throw new Error("RPC Audit Failure: " + error.message);
  }

  revalidatePath("/crew/lost-and-found");
  return { success: true };
}

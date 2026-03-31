"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function resolveIncident(incidentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("incidents")
    .update({ 
      status: "resolved", 
      resolved_by: user.id,
      resolved_at: new Date().toISOString()
    })
    .eq("id", incidentId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/management/fnb/incidents");
  return { success: true };
}

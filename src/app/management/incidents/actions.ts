"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function createIncidentAction(payload: { category: string, description: string }) {
  // We allow multiple roles to log incidents, roughly management level + security/operations
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized");
  const supabase = await createClient();

  // Fetch the user's role and name to stamp in the database if the schema expects it 
  // (the schema has `logged_by` mapping to UUID, but we can also log a description securely).
  const { error } = await supabase.from("incidents").insert([{
    category: payload.category as any,
    description: payload.description,
    status: "open",
    logged_by: user.id, // natively bound to auth.users UUID
    created_by: user.id // standard audit column
  }]);

  if (error) throw new Error(error.message);

  revalidatePath("/management/incidents");
  return { success: true };
}

export async function resolveIncidentAction(id: string) {
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized");
  const supabase = await createClient();

  const { error } = await supabase
    .from("incidents")
    .update({ 
      status: "resolved", 
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/management/incidents");
  return { success: true };
}

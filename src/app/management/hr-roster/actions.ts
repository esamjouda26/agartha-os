"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function fetchStaffRecordsAction() {
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized to access staff records.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_records")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createStaffRecordAction(payload: any) {
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized to provision staff.");
  const supabase = await createClient();

  const { data, error } = await supabase.from("staff_records").insert([{
    ...payload,
    created_by: user.id
  }]).select().single();

  if (error) throw new Error(error.message);
  revalidatePath("/management/hr-roster");
  return { success: true, data };
}

export async function updateStaffRecordAction(id: string, payload: any) {
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized to modify staff details.");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff_records")
    .update({
      ...payload,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select().single();

  if (error) throw new Error(error.message);
  revalidatePath("/management/hr-roster");
  return { success: true, data };
}

export async function transferStaffRoleAction(id: string, targetRole: string, justification: string) {
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized to initiate IAM transfer.");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff_records")
    .update({
      role: targetRole as any,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select().single();

  if (error) throw new Error(error.message);

  revalidatePath("/management/hr-roster");
  return { success: true, data };
}

export async function terminateStaffAction(id: string, reason: "resignation" | "contract_expired" | "misconduct" | "other") {
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff_records")
    .update({ 
      employment_status: "terminated", 
      termination_reason: reason,
      terminated_at: new Date().toISOString(),
      terminated_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  // Note: in a real environment, we'd also trigger an auth.users deletion or ban here 
  // via Supabase Admin SDK. For the simulation, we mark the staff_record as terminated.

  revalidatePath("/management/hr-roster");
  return { success: true, data };
}

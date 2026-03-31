"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type StaffProfile = {
  legal_name: string;
  email: string;
  employee_id: string;
  role: string;
  phone: string | null;
  address: string | null;
  kin_name: string | null;
  kin_phone: string | null;
  kin_relationship: string | null;
};

export async function getStaffProfile(): Promise<StaffProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("staff_records")
    .select("legal_name, email, employee_id, role, phone, address, kin_name, kin_phone, kin_relationship")
    .eq("user_id", user.id)
    .single();

  return data ?? null;
}

export async function updateStaffProfile(payload: {
  phone?: string;
  address?: string;
  kin_name?: string;
  kin_phone?: string;
  kin_relationship?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("staff_records")
    .update({
      phone: payload.phone?.trim() || null,
      address: payload.address?.trim() || null,
      kin_name: payload.kin_name?.trim() || null,
      kin_phone: payload.kin_phone?.trim() || null,
      kin_relationship: payload.kin_relationship?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/crew/settings");
  return { success: true };
}

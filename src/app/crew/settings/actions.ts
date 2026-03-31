"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type StaffProfile = {
  legal_name: string;
  email: string | null;            // Personal email from staff_records
  auth_email: string;      // The current system log in email
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

  // Since staff_records was severed from direct user_id, we map through profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("staff_record_id, employee_id, staff_role")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.staff_record_id) return null;

  const { data: staff } = await supabase
    .from("staff_records")
    .select("legal_name, personal_email, phone, address, kin_name, kin_phone, kin_relationship")
    .eq("id", profile.staff_record_id)
    .single();

  if (!staff) return null;

  return {
    legal_name: staff.legal_name,
    email: staff.personal_email,
    auth_email: user.email || "",
    employee_id: profile.employee_id,
    role: profile.staff_role,
    phone: staff.phone,
    address: staff.address,
    kin_name: staff.kin_name,
    kin_phone: staff.kin_phone,
    kin_relationship: staff.kin_relationship,
  };
}

export async function updateStaffProfile(payload: {
  phone?: string;
  address?: string;
  personal_email?: string;
  kin_name?: string;
  kin_phone?: string;
  kin_relationship?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("staff_record_id")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.staff_record_id) return { success: false, error: "Profile mapping invalid" };

  const { error } = await supabase
    .from("staff_records")
    .update({
      phone: payload.phone?.trim() || null,
      address: payload.address?.trim() || null,
      personal_email: payload.personal_email?.trim() || null,
      kin_name: payload.kin_name?.trim() || null,
      kin_phone: payload.kin_phone?.trim() || null,
      kin_relationship: payload.kin_relationship?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.staff_record_id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/crew/settings");
  return { success: true };
}

export async function updateSecuritySettings(password: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Securely update auth password directly via Supabase
  const { error } = await supabase.auth.updateUser({
    password: password.trim()
  });

  if (error) return { success: false, error: error.message };
  
  return { success: true };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function fetchDepartmentsAction() {
  const user = await requireRole("management");
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("departments")
    .select("id, name")
    .order("name", { ascending: true });
  return data ?? [];
}
export async function fetchStaffRecordsAction() {
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized to access staff records.");
  const supabase = await createClient();

  // Join profiles to get auth/role fields that were moved there in the refactor
  const { data, error } = await supabase
    .from("staff_records")
    .select(`
      id, legal_name, personal_email, phone, address,
      kin_name, kin_relationship, kin_phone,
      national_id_enc, bank_name, bank_account_enc, salary_enc,
      contract_start, contract_end, created_at,
      profiles!profiles_staff_record_id_fkey(employee_id, staff_role, employment_status, email)
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createStaffRecordAction(payload: {
  legal_name: string;
  personal_email: string;
  phone?: string;
  address?: string;
  national_id_enc?: string;
  bank_name?: string;
  bank_account_enc?: string;
  salary_enc?: string;
  department_id?: string;
  contract_start: string;
  contract_end?: string;
  kin_name?: string;
  kin_relationship?: string;
  kin_phone?: string;
  target_role: string;
  hr_remark?: string;
}) {
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized to provision staff.");
  const supabase = await createClient();

  const { target_role, hr_remark, ...staffData } = payload;

  // Insert only staff_records columns (no role/status — those belong to profiles)
  const { data, error } = await supabase.from("staff_records").insert([{
    ...staffData,
    created_by: user.id,
  }]).select().single();

  if (error) throw new Error(error.message);

  // Create parallel IAM request for IT provisioning
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: iamError } = await supabase.from("iam_requests").insert([{
    request_type: "provisioning",
    status: "pending_it",
    staff_record_id: data.id,
    target_role,
    hr_remark: hr_remark ?? `New staff provisioned by HR: ${payload.legal_name}`,
    created_by: user.id,
  }] as any);

  if (iamError) console.error("Failed to create IAM request:", iamError.message);

  revalidatePath("/management/hr-roster");
  return { success: true, data };
}

export async function updateStaffRecordAction(id: string, payload: Record<string, unknown>) {
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized to modify staff details.");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff_records")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select().single();

  if (error) throw new Error(error.message);
  revalidatePath("/management/hr-roster");
  return { success: true, data };
}

/**
 * Create an IAM transfer request for IT admin to approve.
 * Does NOT directly change the staff member's role.
 */
export async function transferStaffRoleAction(
  staffRecordId: string,
  targetRole: string,
  hrRemark: string
) {
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized to initiate IAM transfer.");
  const supabase = await createClient();

  // Get current role from the linked profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("staff_role")
    .eq("staff_record_id", staffRecordId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("iam_requests").insert([{
    request_type: "transfer",
    status: "pending_it",
    staff_record_id: staffRecordId,
    target_role: targetRole,
    current_role: profile?.staff_role ?? null,
    hr_remark: hrRemark,
    created_by: user.id,
  }] as any);

  if (error) throw new Error(error.message);
  revalidatePath("/management/hr-roster");
  return { success: true };
}

/**
 * Create an IAM termination request for IT admin to approve.
 * Does NOT directly terminate the account.
 */
export async function terminateStaffAction(staffRecordId: string, hrRemark: string) {
  const user = await requireRole("management");
  if (!user) throw new Error("Unauthorized to initiate termination.");
  const supabase = await createClient();

  // Get current role for audit record
  const { data: profile } = await supabase
    .from("profiles")
    .select("staff_role")
    .eq("staff_record_id", staffRecordId)
    .single();

  const { error } = await supabase.from("iam_requests").insert([{
    request_type: "termination",
    status: "pending_it",
    staff_record_id: staffRecordId,
    target_role: null,           // null for termination — no new role
    current_role: profile?.staff_role ?? null,
    hr_remark: hrRemark,
    created_by: user.id,
  }]);

  if (error) throw new Error(error.message);
  revalidatePath("/management/hr-roster");
  return { success: true };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

// ── IAM Access Control ──────────────────────────────────────────────────────

interface StaffUser {
  id: string;
  display_name: string | null;
  app_role: string;
  staff_role: string | null;
  is_mfa_enabled: boolean;
  is_locked: boolean;
  last_sign_in_at: string | null;
  created_at: string;
}

export async function fetchStaffUsersAction(): Promise<StaffUser[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, app_role, staff_role, is_mfa_enabled, is_locked, last_sign_in_at, created_at")
    .in("app_role", ["crew", "management", "admin"])
    .order("created_at", { ascending: false });

  return (data ?? []) as StaffUser[];
}

export async function updateUserRoleAction(userId: string, staffRole: string) {
  const caller = await requireRole("admin");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)("admin_set_user_role", {
    p_user_id: userId,
    p_app_role: "staff",
    p_staff_role: staffRole,
  });

  if (error) return { success: false, error: (error as { message: string }).message };

  // Audit logging handled by Postgres AFTER trigger on profiles table

  revalidatePath("/admin/access-control");
  return { success: true };
}

export async function toggleUserLockAction(userId: string, lock: boolean) {
  const caller = await requireRole("admin");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();
  const performedBy = caller.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("profiles")
    .update({
      is_locked: lock,
      locked_at: lock ? new Date().toISOString() : null,
      locked_by: lock ? performedBy : null,
      locked_reason: lock ? "admin_lock" : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  // Audit logging handled by Postgres AFTER trigger on profiles table

  revalidatePath("/admin/access-control");
  return { success: true };
}

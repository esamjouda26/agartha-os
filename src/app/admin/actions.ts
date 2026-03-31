"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

// ── IAM Access Control ──────────────────────────────────────────────────────

export interface StaffUser {
  id: string;
  employee_id: string | null;
  display_name: string | null;
  email: string | null;
  staff_role: string | null;
  employment_status: string;
  created_at: string;
  // Enriched from auth.users via Admin API
  last_sign_in_at: string | null;
  is_mfa_enrolled: boolean;
}

export async function fetchStaffUsersAction(): Promise<StaffUser[]> {
  const caller = await requireRole("admin");
  if (!caller) return [];

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabaseAdmin = createAdminClient();

  // 1. Fetch staff profiles from DB
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id, employee_id, display_name, email, staff_role, employment_status, created_at")
    .not("staff_role", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchStaffUsersAction error:", error.message);
    return [];
  }

  if (!profiles?.length) return [];

  // 2. Bulk fetch auth.users via Admin API (includes last_sign_in_at and MFA factors)
  // listUsers is paginated — fetch up to 1000 (sufficient for staff)
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const authMap = new Map(
    (authData?.users ?? []).map((u) => [
      u.id,
      {
        email: u.email ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
        // MFA enrolled = has at least one verified TOTP factor
        is_mfa_enrolled: (u.factors ?? []).some(
          (f) => f.factor_type === "totp" && f.status === "verified"
        ),
      },
    ])
  );

  // 3. Merge profiles with auth data
  // For pre-existing rows where profiles.email was added post-provisioning,
  // fall back to auth.users.email and backfill the column asynchronously.
  const toBackfill: { id: string; email: string }[] = [];

  const result = (profiles ?? []).map((p) => {
    const auth = authMap.get(p.id);
    const resolvedEmail = (p as StaffUser).email ?? auth?.email ?? null;

    // Queue a backfill if profiles.email is missing but auth has it
    if (!(p as StaffUser).email && auth?.email) {
      toBackfill.push({ id: p.id, email: auth.email });
    }

    return {
      ...(p as StaffUser),
      email: resolvedEmail,
      last_sign_in_at: auth?.last_sign_in_at ?? null,
      is_mfa_enrolled: auth?.is_mfa_enrolled ?? false,
    };
  });

  // Fire-and-forget: backfill profiles.email for pre-existing rows
  if (toBackfill.length > 0) {
    Promise.allSettled(
      toBackfill.map(({ id, email }) =>
        supabaseAdmin.from("profiles").update({ email }).eq("id", id)
      )
    ).catch(() => {}); // non-blocking, best-effort
  }

  return result;
}

export async function updateUserRoleAction(userId: string, staffRole: string) {
  const caller = await requireRole("admin");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)("admin_set_user_role", {
    p_user_id: userId,
    p_staff_role: staffRole,
  });

  if (error) return { success: false, error: (error as { message: string }).message };

  revalidatePath("/admin/access-control");
  return { success: true };
}

export async function updateEmploymentStatusAction(
  userId: string,
  status: "active" | "on_leave" | "suspended" | "terminated"
) {
  const caller = await requireRole("admin");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabaseAdmin = createAdminClient();

  // Update profiles table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (supabaseAdmin.from as any)("profiles").update({
    employment_status: status,
    updated_at: new Date().toISOString(),
  }).eq("id", userId);

  if (profileError) return { success: false, error: profileError.message };

  // Sync to app_metadata so middleware reads it from JWT without DB calls
  const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { employment_status: status },
  });

  if (metaError) return { success: false, error: metaError.message };

  // Ban/unban auth account based on status
  if (status === "terminated" || status === "suspended") {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: status === "terminated" ? "876600h" : "87660h", // 100yr or 10yr
    });
  } else {
    // Unban: setting ban_duration to "none" lifts the ban
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });
  }

  revalidatePath("/admin/access-control");
  return { success: true };
}

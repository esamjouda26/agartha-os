import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/mark-password-set
 *
 * Called immediately after the user successfully sets their password on
 * /auth/set-password. Updates app_metadata.password_set = true so middleware
 * no longer redirects them to the forced-password-reset gate.
 *
 * Requires a valid session cookie (the user is authenticated via magic link).
 * Uses the service-role admin client to write app_metadata (user JWT cannot do this).
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();

  // 1. Update app_metadata so JWT includes password_set: true on next refresh
  const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      password_set: true,
    },
  });

  if (metaError) {
    console.error("[AgarthaOS] mark-password-set error:", metaError.message);
    return NextResponse.json({ error: metaError.message }, { status: 500 });
  }

  // 2. Keep profiles.password_set in sync with app_metadata
  await supabaseAdmin
    .from("profiles")
    .update({ password_set: true, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  return NextResponse.json({ success: true });
}

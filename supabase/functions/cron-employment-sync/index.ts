import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * cron-employment-sync
 *
 * Daily job (triggered via pg_cron → net.http_post) that enforces two transitions:
 *
 * Job A — pending → active:
 *   Profiles with employment_status = 'pending' whose contract_start <= today → active.
 *
 * Job B — auto-terminate:
 *   Profiles with active/on_leave/suspended whose contract_end < today → terminated + banned.
 *
 * Security: Requires CRON_SECRET env var in Authorization header.
 * Schedule:  Daily @ 00:05 UTC (set in Supabase Dashboard > Scheduled Functions).
 */
Deno.serve(async (req: Request) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split("T")[0];

  const promoted: string[] = [];
  const terminated: string[] = [];
  const errors: string[] = [];

  // ── Job A: pending → active ────────────────────────────────────────────────
  const { data: pendingProfiles } = await admin
    .from("profiles")
    .select("id, staff_record_id")
    .eq("employment_status", "pending");

  for (const profile of pendingProfiles ?? []) {
    if (!profile.staff_record_id) continue;

    const { data: sr } = await admin
      .from("staff_records")
      .select("contract_start")
      .eq("id", profile.staff_record_id)
      .single();

    if (!sr?.contract_start || sr.contract_start > todayISO) continue;

    await admin.from("profiles").update({
      employment_status: "active",
      updated_at: new Date().toISOString(),
    }).eq("id", profile.id);

    const { error: metaErr } = await admin.auth.admin.updateUserById(profile.id, {
      app_metadata: { employment_status: "active" },
    });

    metaErr
      ? errors.push(`promote ${profile.id}: ${metaErr.message}`)
      : promoted.push(profile.id);
  }

  // ── Job B: auto-terminate on contract_end ──────────────────────────────────
  const { data: activeProfiles } = await admin
    .from("profiles")
    .select("id, staff_record_id")
    .in("employment_status", ["active", "on_leave", "suspended"]);

  for (const profile of activeProfiles ?? []) {
    if (!profile.staff_record_id) continue;

    const { data: sr } = await admin
      .from("staff_records")
      .select("contract_end")
      .eq("id", profile.staff_record_id)
      .single();

    if (!sr?.contract_end || sr.contract_end >= todayISO) continue;

    await admin.from("profiles").update({
      employment_status: "terminated",
      updated_at: new Date().toISOString(),
    }).eq("id", profile.id);

    const { error: banErr } = await admin.auth.admin.updateUserById(profile.id, {
      app_metadata: { employment_status: "terminated" },
      ban_duration: "876600h",
    });

    banErr
      ? errors.push(`terminate ${profile.id}: ${banErr.message}`)
      : terminated.push(profile.id);
  }

  const result = {
    run_at: new Date().toISOString(),
    promoted_count: promoted.length,
    terminated_count: terminated.length,
    error_count: errors.length,
    errors,
  };

  console.log("[cron-employment-sync]", JSON.stringify(result));
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});

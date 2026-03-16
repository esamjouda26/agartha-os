import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * QUARANTINED service_role Supabase Client (SOP 7.2).
 *
 * ⚠️  SECURITY CRITICAL: This client bypasses ALL Row Level Security policies.
 *
 * ALLOWED usage:
 *   - Guest Portal OTP flow Server Actions (no JWT exists for guests)
 *   - Admin user provisioning RPCs (admin_set_user_role, etc.)
 *
 * FORBIDDEN usage:
 *   - Any Staff/Crew/Management API where a JWT IS available.
 *   - Any client-side code (never import this in 'use client' files).
 *
 * Leaking service_role into staff APIs is a CRITICAL SECURITY FAILURE.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. " +
        "The admin client can only be used server-side."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

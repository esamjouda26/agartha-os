import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * CSR Supabase Client — for browser-side interactions only.
 * Uses the public anon key. All mutations MUST go through Server Actions.
 * Never use .insert(), .update(), .delete() from client components (SOP 7.1).
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

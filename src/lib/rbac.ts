import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

export type RoleTier = "admin" | "management" | "crew";

const TIER_WEIGHTS: Record<RoleTier, number> = {
  admin: 3,
  management: 2,
  crew: 1,
};

const anonSupabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Cached fetcher for the Route Matrix. Memory-memoized up to 1 Hour.
 * Bypasses RLS natively since the policy globally authorizes SELECTs.
 */
export const getRoleAccessMatrix = unstable_cache(
  async () => {
    const { data } = await anonSupabase
      .from("role_route_access")
      .select("role_id, portal_domain, security_tier");
    return data || [];
  },
  ["role_route_access_matrix"],
  { tags: ["rbac_matrix"], revalidate: 3600 }
);

/**
 * Server-side RBAC guard.
 * Mechanically queries the Active Matrix dictionary to determine hierarchical superiority.
 */
export async function requireRole(
  minimumTier: RoleTier
): Promise<{ id: string; staffRole: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const staffRole = (user.app_metadata?.staff_role as string) ?? null;
  if (!staffRole) return null;

  const matrix = await getRoleAccessMatrix();
  
  // Find the highest hierarchical tier this staffRole belongs to
  let highestWeight = 0;
  matrix.filter((m) => m.role_id === staffRole).forEach((record) => {
    const w = TIER_WEIGHTS[record.security_tier as RoleTier];
    if (w && w > highestWeight) highestWeight = w;
  });

  const requiredWeight = TIER_WEIGHTS[minimumTier];
  
  if (highestWeight >= requiredWeight) {
    return { id: user.id, staffRole };
  }

  return null;
}

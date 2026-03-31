import "server-only";
import { createClient } from "@/lib/supabase/server";
import { type StaffRole, ROLE_PORTAL_ACCESS } from "@/types";

export type RoleTier = "admin" | "management" | "crew";

const TIER_WEIGHTS: Record<RoleTier, number> = {
  admin: 3,
  management: 2,
  crew: 1,
};

/**
 * Derives the highest security tier for a staff role directly from the
 * ROLE_PORTAL_ACCESS constant in types/index.ts.
 *
 * Tier rules:
 *   - Role has "admin" portal access  → admin tier
 *   - Role has "management" access    → management tier
 *   - Role has only "crew" access     → crew tier
 *
 * Zero DB calls — the mapping is the single source of truth in code.
 */
function getRoleTier(staffRole: string): RoleTier | null {
  const portals = ROLE_PORTAL_ACCESS[staffRole as StaffRole];
  if (!portals || portals.length === 0) return null;
  if (portals.includes("admin")) return "admin";
  if (portals.includes("management")) return "management";
  if (portals.includes("crew")) return "crew";
  return null;
}

/**
 * Server-side RBAC guard for Server Actions.
 *
 * Validates the JWT, extracts staff_role from app_metadata, then derives
 * the role tier from the ROLE_PORTAL_ACCESS constant. No DB hit required.
 *
 * Usage:
 *   const caller = await requireRole("admin");
 *   if (!caller) return { success: false, error: "FORBIDDEN" };
 */
export async function requireRole(
  minimumTier: RoleTier
): Promise<{ id: string; staffRole: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const staffRole = (user.app_metadata?.staff_role as string) ?? null;
  if (!staffRole) return null;

  const roleTier = getRoleTier(staffRole);
  if (!roleTier) return null;

  if (TIER_WEIGHTS[roleTier] >= TIER_WEIGHTS[minimumTier]) {
    return { id: user.id, staffRole };
  }

  return null;
}

import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * RBAC role tiers — used by the requireRole() guard.
 * Maps logical tier names to the staff_role values that satisfy them.
 */
const ROLE_TIERS = {
  admin: ["it_admin", "business_admin"],
  management: [
    "it_admin", "business_admin",
    "fnb_manager", "merch_manager", "maintenance_manager",
    "inventory_manager", "marketing_manager", "human_resources_manager",
    "compliance_manager", "operations_manager",
  ],
  crew: [
    "it_admin", "business_admin",
    "fnb_manager", "merch_manager", "maintenance_manager",
    "inventory_manager", "marketing_manager", "human_resources_manager",
    "compliance_manager", "operations_manager",
    "fnb_crew", "service_crew", "giftshop_crew", "runner_crew",
    "security_crew", "health_crew", "cleaning_crew", "experience_crew",
    "internal_maintainence_crew",
  ],
} as const;

export type RoleTier = keyof typeof ROLE_TIERS;

/**
 * Server-side RBAC guard.
 * Verifies the authenticated user's staff_role is within the required tier.
 *
 * @returns The user object if authorized
 * @throws Returns null if not authenticated or not authorized
 *
 * Usage in Server Actions:
 *   const user = await requireRole("management");
 *   if (!user) return { success: false, error: "FORBIDDEN" };
 */
export async function requireRole(
  minimumTier: RoleTier
): Promise<{ id: string; staffRole: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const staffRole = (user.app_metadata?.staff_role as string) ?? null;
  if (!staffRole) return null;

  const allowedRoles = ROLE_TIERS[minimumTier];
  if (!(allowedRoles as readonly string[]).includes(staffRole)) return null;

  return { id: user.id, staffRole };
}

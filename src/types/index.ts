/**
 * App-specific composite types used across features.
 */
export type { Database } from "./database.types";
export type * from "./database.types";

/**
 * Resolved user session shape used in layouts and middleware.
 */
export interface AuthSession {
  userId: string;
  email: string;
  appRole: string; // or explicit literal if preferred
  staffRole: StaffRole | null;
  isMfaEnabled: boolean;
}

/**
 * Guest session stored in the encrypted HTTP-only cookie.
 */
export interface GuestSession {
  bookingRef: string;
  bookerEmail: string;
  exp: number; // Unix timestamp
}

/**
 * Portal domain identifiers used by middleware routing.
 */
export type PortalDomain = "guest" | "crew" | "management" | "admin";

export type StaffRole =
  | "it_admin" | "business_admin" | "fnb_manager" | "merch_manager"
  | "maintenance_manager" | "inventory_manager" | "marketing_manager"
  | "human_resources_manager" | "compliance_manager" | "operations_manager"
  | "fnb_crew" | "service_crew" | "giftshop_crew" | "runner_crew"
  | "security_crew" | "health_crew" | "cleaning_crew" | "experience_crew"
  | "internal_maintainence_crew";

/**
 * Map of staff_role values to the portal domains they're allowed to access.
 * Exactly 19 roles mapped to their respective portal tiers.
 */
export const ROLE_PORTAL_ACCESS: Record<StaffRole, PortalDomain[]> = {
  // ── Admin (2) ─────────────────────────────────────────────────────────
  it_admin: ["admin", "management", "crew"],
  business_admin: ["admin", "management", "crew"],

  // ── Management (8) ────────────────────────────────────────────────────
  fnb_manager: ["management", "crew"],
  merch_manager: ["management", "crew"],
  maintenance_manager: ["management", "crew"],
  inventory_manager: ["management", "crew"],
  marketing_manager: ["management", "crew"],
  human_resources_manager: ["management", "crew"],
  compliance_manager: ["management", "crew"],
  operations_manager: ["management", "crew"],

  // ── Crew (9) ──────────────────────────────────────────────────────────
  fnb_crew: ["crew"],
  service_crew: ["crew"],
  giftshop_crew: ["crew"],
  runner_crew: ["crew"],
  security_crew: ["crew"],
  health_crew: ["crew"],
  cleaning_crew: ["crew"],
  experience_crew: ["crew"],
  internal_maintainence_crew: ["crew"],
};

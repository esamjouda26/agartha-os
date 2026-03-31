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
 * Portal access map — single source of truth for role-to-domain routing.
 * Used by middleware, useRoleAccess hook, and root page redirect logic.
 * Security enforcement is in middleware.ts — this is for UI gating only.
 */
export const ROLE_PORTAL_ACCESS: Record<StaffRole, PortalDomain[]> = {
  // Level 1 — Full platform access
  it_admin:                   ["admin", "management", "crew"],
  business_admin:             ["admin", "management", "crew"],
  // Level 2 — Management portal + crew portal
  fnb_manager:                ["management", "crew"],
  merch_manager:              ["management", "crew"],
  maintenance_manager:        ["management", "crew"],
  inventory_manager:          ["management", "crew"],
  marketing_manager:          ["management", "crew"],
  human_resources_manager:    ["management", "crew"],
  compliance_manager:         ["management", "crew"],
  operations_manager:         ["management", "crew"],
  // Level 3 — Crew portal only
  fnb_crew:                   ["crew"],
  service_crew:               ["crew"],
  giftshop_crew:              ["crew"],
  runner_crew:                ["crew"],
  security_crew:              ["crew"],
  health_crew:                ["crew"],
  cleaning_crew:              ["crew"],
  experience_crew:            ["crew"],
  internal_maintainence_crew: ["crew"],
};

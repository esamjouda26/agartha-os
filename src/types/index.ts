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


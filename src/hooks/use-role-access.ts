"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { StaffRole, PortalDomain } from "@/types";
import { ROLE_PORTAL_ACCESS } from "@/types";

/**
 * Client-side hook for role-based UI toggling.
 * Reads the JWT from the browser Supabase client and exposes
 * the user's staff_role + helper to check portal access.
 *
 * NOTE: This is for UI toggling only — all security enforcement
 * happens in middleware.ts and Server Actions.
 */
export function useRoleAccess() {
  const [staffRole, setStaffRole] = useState<StaffRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.app_metadata?.staff_role) {
        setStaffRole(user.app_metadata.staff_role as StaffRole);
      }
      setLoading(false);
    }

    fetchRole();
  }, []);

  function canAccess(domain: PortalDomain): boolean {
    if (!staffRole) return false;
    const allowed = ROLE_PORTAL_ACCESS[staffRole] ?? [];
    return allowed.includes(domain);
  }

  return { staffRole, loading, canAccess };
}

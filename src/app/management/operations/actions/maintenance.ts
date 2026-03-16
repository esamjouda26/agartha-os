"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

/**
 * Fetch all maintenance work orders, ordered by scheduled_start.
 */
export async function fetchMaintenanceWorkOrdersAction() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from as any)("maintenance_work_orders")
    .select("id, target_ci_id, vendor_company, vendor_mac_address, scheduled_start, scheduled_end, mab_limit_hours, status, sponsor_id, created_at, updated_at")
    .order("scheduled_start", { ascending: false });

  return (data ?? []) as {
    id: string;
    target_ci_id: string;
    vendor_company: string;
    vendor_mac_address: string | null;
    scheduled_start: string;
    scheduled_end: string;
    mab_limit_hours: number;
    status: "pending_mac" | "active_mab" | "completed" | "revoked";
    sponsor_id: string | null;
    created_at: string;
    updated_at: string | null;
  }[];
}

/**
 * Create a new maintenance work order.
 */
export async function createWorkOrderAction(params: {
  target_ci_id: string;
  vendor_company: string;
  scheduled_start: string;
  scheduled_end: string;
  mab_limit_hours: number;
}) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("maintenance_work_orders").insert({
    target_ci_id: params.target_ci_id,
    vendor_company: params.vendor_company,
    scheduled_start: params.scheduled_start,
    scheduled_end: params.scheduled_end,
    mab_limit_hours: params.mab_limit_hours,
    status: "pending_mac",
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/management/operations/maintenance");
  return { success: true };
}

/**
 * Authorize MAB: Sets the vendor MAC, transitions WO to active_mab,
 * records the sponsoring user for non-repudiation, and simulates RADIUS CoA.
 */
export async function authorizeMabAction(woId: string, macAddress: string) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();

  // Validate MAC format (basic check)
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  if (!macRegex.test(macAddress)) {
    return { success: false, error: "INVALID_MAC_FORMAT" };
  }

  // Update WO to active_mab
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: wo, error } = await (supabase.from as any)("maintenance_work_orders")
    .update({
      vendor_mac_address: macAddress.toUpperCase(),
      status: "active_mab",
      sponsor_id: caller.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", woId)
    .eq("status", "pending_mac")
    .select("id, target_ci_id, vendor_company, vendor_mac_address, mab_limit_hours")
    .single();

  if (error) return { success: false, error: error.message };

  // ═══ MOCK RADIUS CoA/MAB DISPATCH ═══════════════════════════════════
  // In production, this would POST to the RADIUS server / network switch API
  const coaPayload = {
    action: "RADIUS_COA",
    type: "MAB_AUTHORIZE",
    timestamp: new Date().toISOString(),
    work_order_id: wo.id,
    target_ci: wo.target_ci_id,
    vendor: wo.vendor_company,
    mac_address: wo.vendor_mac_address,
    mab_limit_hours: wo.mab_limit_hours,
    sponsor_user_id: caller.id,
    switch_command: {
      interface: "GigabitEthernet1/0/24",
      action: "mab_enable",
      vlan: "MAINTENANCE_VLAN_99",
      acl: "ACL_VENDOR_RESTRICTED",
      session_timeout: wo.mab_limit_hours * 3600,
    },
  };
  console.log("[RADIUS_SIM] ═══ CoA DISPATCH ═══");
  console.log("[RADIUS_SIM]", JSON.stringify(coaPayload, null, 2));
  console.log("[RADIUS_SIM] ═══════════════════════");

  revalidatePath("/management/operations/maintenance");
  return { success: true, coaPayload };
}

/**
 * Revoke MAB: Transitions WO to revoked status and simulates RADIUS disconnect.
 */
export async function revokeMabAction(woId: string) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();

  // Fetch current WO for the disconnect payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentWo } = await (supabase.from as any)("maintenance_work_orders")
    .select("id, target_ci_id, vendor_company, vendor_mac_address")
    .eq("id", woId)
    .single();

  // Update WO to revoked
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("maintenance_work_orders")
    .update({
      status: "revoked",
      sponsor_id: caller.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", woId)
    .eq("status", "active_mab");

  if (error) return { success: false, error: error.message };

  // ═══ MOCK RADIUS DISCONNECT DISPATCH ════════════════════════════════
  const disconnectPayload = {
    action: "RADIUS_DISCONNECT",
    type: "MAB_REVOKE",
    timestamp: new Date().toISOString(),
    work_order_id: woId,
    target_ci: currentWo?.target_ci_id,
    vendor: currentWo?.vendor_company,
    mac_address: currentWo?.vendor_mac_address,
    revoked_by: caller.id,
    switch_command: {
      interface: "GigabitEthernet1/0/24",
      action: "shutdown_then_no_shutdown",
      vlan: "BLOCKED_VLAN_999",
      acl: "ACL_DENY_ALL",
    },
  };
  console.log("[RADIUS_SIM] ═══ DISCONNECT DISPATCH ═══");
  console.log("[RADIUS_SIM]", JSON.stringify(disconnectPayload, null, 2));
  console.log("[RADIUS_SIM] ═══════════════════════════════");

  revalidatePath("/management/operations/maintenance");
  return { success: true, disconnectPayload };
}

/**
 * Mark a WO as completed (after scheduled_end passes).
 */
export async function completeWorkOrderAction(woId: string) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("maintenance_work_orders")
    .update({
      status: "completed",
      sponsor_id: caller.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", woId)
    .eq("status", "active_mab"); // H-5: Only active MAB sessions can be completed

  if (error) return { success: false, error: error.message };
  revalidatePath("/management/operations/maintenance");
  return { success: true };
}

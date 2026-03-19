"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

/**
 * Fetch all maintenance work orders, ordered by maintenance_start.
 */
export async function fetchMaintenanceWorkOrdersAction() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)("maintenance_work_orders")
    .select(`
      id, target_ci_id, vendor_id, vendor_mac_address,
      maintenance_start, maintenance_end, mad_limit_minutes,
      status, assigned_sponsor_id, created_at, updated_at, scope,
      vendor_data:suppliers(name)
    `)
    .order("maintenance_start", { ascending: false });

  if (error) {
    console.error("Fetch DB Error:", error);
  }

  // Map pure database enums implicitly to the UI's structural types
  const mapped = (data ?? []).map((wo: any) => {
    let uiStatus = wo.status;
    if (wo.status === "scheduled") uiStatus = "pending_mac";
    if (wo.status === "active") uiStatus = "active_mab";
    
    // Explicitly unroll the arrays if they come back nested by PostgREST
    const supplierName = Array.isArray(wo.vendor_data) 
        ? wo.vendor_data[0]?.name 
        : (wo.vendor_data?.name || "Unknown");

    return {
      id: wo.id,
      target_ci_id: wo.target_ci_id,
      vendor_id: wo.vendor_id,
      vendor_company: supplierName,
      vendor_mac_address: wo.vendor_mac_address,
      scheduled_start: wo.maintenance_start,
      scheduled_end: wo.maintenance_end,
      mab_limit_hours: wo.mad_limit_minutes / 60,
      scope: wo.scope,
      status: uiStatus,
      sponsor_id: wo.assigned_sponsor_id,
      created_at: wo.created_at,
      updated_at: wo.updated_at
    };
  });

  return mapped as {
    id: string;
    target_ci_id: string;
    vendor_id: string;
    vendor_company: string;
    vendor_mac_address: string | null;
    scheduled_start: string;
    scheduled_end: string;
    mab_limit_hours: number;
    scope: string | null;
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
  vendor_id: string;
  scheduled_start: string;
  scheduled_end: string;
  mab_limit_hours: number;
  assigned_to?: string;
  scope?: string;
  topology: "remote" | "onsite";
}) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("maintenance_work_orders").insert({
    target_ci_id: params.target_ci_id,
    vendor_id: params.vendor_id,
    maintenance_start: params.scheduled_start,
    maintenance_end: params.scheduled_end,
    mad_limit_minutes: Math.round(params.mab_limit_hours * 60),
    assigned_sponsor_id: params.assigned_to || null,
    scope: params.scope || null,
    topology: params.topology,
    status: "scheduled", // Maps identically to 'pending_mac' within the UI
    created_by: caller.id,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/management/operations/maintenance");
  return { success: true };
}

export async function updateWorkOrderAction(woId: string, params: {
  target_ci_id: string;
  vendor_id: string;
  scheduled_start: string;
  scheduled_end: string;
  mab_limit_hours: number;
  assigned_to?: string;
  scope?: string;
  topology: "remote" | "onsite";
}) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("maintenance_work_orders").update({
    target_ci_id: params.target_ci_id,
    vendor_id: params.vendor_id,
    maintenance_start: params.scheduled_start,
    maintenance_end: params.scheduled_end,
    mad_limit_minutes: Math.round(params.mab_limit_hours * 60),
    assigned_sponsor_id: params.assigned_to || null,
    scope: params.scope || null,
    topology: params.topology,
  }).eq("id", woId);

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
      status: "active",
      authorized_by: caller.id,
    })
    .eq("id", woId)
    .eq("status", "scheduled")
    .select("id, target_ci_id, vendor_mac_address, mad_limit_minutes, vendor_data:suppliers(name)")
    .single();

  if (error) return { success: false, error: error.message };

  const supplierName = Array.isArray(wo.vendor_data) 
        ? wo.vendor_data[0]?.name 
        : (wo.vendor_data?.name || "Unknown");

  // ═══ MOCK RADIUS CoA/MAB DISPATCH ═══════════════════════════════════
  const coaPayload = {
    action: "RADIUS_COA",
    type: "MAB_AUTHORIZE",
    timestamp: new Date().toISOString(),
    work_order_id: wo.id,
    target_ci: wo.target_ci_id,
    vendor_company: supplierName,
    mac_address: wo.vendor_mac_address,
    mab_limit_hours: wo.mad_limit_minutes / 60,
    sponsor_user_id: caller.id,
    switch_command: {
      interface: "GigabitEthernet1/0/24",
      action: "mab_enable",
      vlan: "MAINTENANCE_VLAN_99",
      acl: "ACL_VENDOR_RESTRICTED",
      session_timeout: wo.mad_limit_minutes * 60,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentWo } = await (supabase.from as any)("maintenance_work_orders")
    .select("id, target_ci_id, vendor_mac_address, vendor_data:suppliers(name)")
    .eq("id", woId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("maintenance_work_orders")
    .update({
      status: "revoked",
      authorized_by: caller.id,
      completed_at: new Date().toISOString(),
    })
    .eq("id", woId)
    .in("status", ["scheduled", "active"]); // Allow revoking either scheduled or active

  if (error) return { success: false, error: error.message };

  const supplierName = Array.isArray(currentWo?.vendor_data) 
        ? currentWo?.vendor_data[0]?.name 
        : (currentWo?.vendor_data?.name || "Unknown");

  // ═══ MOCK RADIUS DISCONNECT DISPATCH ════════════════════════════════
  const disconnectPayload = {
    action: "RADIUS_DISCONNECT",
    type: "MAB_REVOKE",
    timestamp: new Date().toISOString(),
    work_order_id: woId,
    target_ci: currentWo?.target_ci_id,
    vendor_company: supplierName,
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
 * Mark a WO as completed.
 */
export async function completeWorkOrderAction(woId: string) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("maintenance_work_orders")
    .update({
      status: "completed",
      authorized_by: caller.id,
      completed_at: new Date().toISOString(),
    })
    .eq("id", woId)
    .eq("status", "active");

  if (error) return { success: false, error: error.message };
  revalidatePath("/management/operations/maintenance");
  return { success: true };
}

export async function fetchSelectableVendorsAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });
    
  if (error) {
    console.error("Failed to fetch vendors:", error);
    return [];
  }
  return data;
}

export async function fetchSelectableSponsorsAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_records")
    .select("id, legal_name, role")
    .eq("employment_status", "active")
    .in("role", ["internal_maintainence_crew"])
    .order("legal_name", { ascending: true });

  if (error) {
    console.error("Failed to fetch sponsors:", error);
    return [];
  }
  return data;
}

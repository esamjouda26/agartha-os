"use server";

import { createClient } from "@/lib/supabase/server";

export type WorkOrder = {
  id: string;
  status: string;
  scope: string | null;
  topology: string;
  vendor_mac_address: string | null;
  mad_limit_minutes: number;
  maintenance_start: string;
  maintenance_end: string;
  suppliers: { name: string } | null;
};

export async function getActiveWorkOrders(): Promise<WorkOrder[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("maintenance_work_orders")
    .select("id, status, scope, topology, vendor_mac_address, mad_limit_minutes, maintenance_start, maintenance_end, suppliers(name)")
    .in("status", ["active", "scheduled"])
    .order("maintenance_start");

  return (data ?? []) as WorkOrder[];
}

export async function updateVendorMac(woId: string, mac: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "internal_maintainence_crew") throw new Error("Restricted to maintenance crew.");

  const { error } = await supabase
    .from("maintenance_work_orders")
    .update({ vendor_mac_address: mac, status: "active" })
    .eq("id", woId);
  if (error) throw new Error(error.message);
}

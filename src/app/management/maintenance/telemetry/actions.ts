"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/rbac";

export async function fetchDeviceTopologyAction() {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();

  const [zonesRes, devicesRes] = await Promise.all([
    supabase.from("zones").select("id, name").order("name"),
    supabase.from("devices").select(`
      id, name, device_type, status, ip_address, mac_address, 
      firmware_version, commission_date, warranty_expiry, 
      switch_id, zone_id, spares_available
    `)
  ]);

  if (zonesRes.error) return { success: false, error: zonesRes.error.message };
  if (devicesRes.error) return { success: false, error: devicesRes.error.message };

  return { 
    success: true, 
    zones: zonesRes.data ?? [], 
    devices: devicesRes.data ?? [] 
  };
}

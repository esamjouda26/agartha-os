"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function fetchAdminZonesAction() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("zones")
    .select("id, name, locations(id, name)")
    .order("name");
  return data ?? [];
}

export async function fetchAdminDevicesAction() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("devices")
    .select(`
      id, name, serial_number, device_type, status, ip_address, mac_address, 
      zones(name), firmware_version, asset_tag_id, manufacturer, model_sku, 
      commission_date, warranty_expiry, vlan_id, switch_id, port_number, spares_available
    `)
    .order("name");
  return data ?? [];
}

export async function createDeviceAction(params: {
  name: string;
  serial_number: string;
  asset_tag_id: string;
  mac_address?: string;
  
  device_type: string;
  manufacturer?: string;
  model_sku?: string;
  firmware_version?: string;
  commission_date?: string;
  warranty_expiry?: string;
  
  vlan_id?: number | null;
  ip_address?: string;
  
  zone_id?: string;
  switch_id?: string;
  port_number?: number | null;
}) {
  const caller = await requireRole("admin");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("devices").insert({
    name: params.name,
    serial_number: params.serial_number || null,
    asset_tag_id: params.asset_tag_id || null,
    mac_address: params.mac_address || null,
    
    device_type: params.device_type,
    manufacturer: params.manufacturer || null,
    model_sku: params.model_sku || null,
    firmware_version: params.firmware_version || null,
    commission_date: params.commission_date || null,
    warranty_expiry: params.warranty_expiry || null,
    
    vlan_id: params.vlan_id || null,
    ip_address: params.ip_address || null,
    
    zone_id: params.zone_id || null,
    switch_id: params.switch_id || null,
    port_number: params.port_number || null,
    
    status: "offline", // default to offline until IoT pings
    created_by: caller.id,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/device-registry");
  return { success: true };
}

export async function updateDeviceStatusAction(id: string, status: "online" | "offline") {
  const caller = await requireRole("admin");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();
  const { error } = await supabase.from("devices").update({ status }).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/device-registry");
  return { success: true };
}

export async function editDeviceAction(id: string, params: {
  name: string;
  serial_number: string;
  asset_tag_id: string;
  mac_address?: string;
  device_type: string;
  manufacturer?: string;
  model_sku?: string;
  firmware_version?: string;
  commission_date?: string;
  warranty_expiry?: string;
  vlan_id?: number | null;
  ip_address?: string;
  zone_id?: string;
  switch_id?: string;
  port_number?: number | null;
}) {
  const caller = await requireRole("admin");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();
  const { error } = await supabase.from("devices").update({
    name: params.name,
    serial_number: params.serial_number || null,
    asset_tag_id: params.asset_tag_id || null,
    mac_address: params.mac_address || null,
    device_type: params.device_type,
    manufacturer: params.manufacturer || null,
    model_sku: params.model_sku || null,
    firmware_version: params.firmware_version || null,
    commission_date: params.commission_date || null,
    warranty_expiry: params.warranty_expiry || null,
    vlan_id: params.vlan_id || null,
    ip_address: params.ip_address || null,
    zone_id: params.zone_id || null,
    switch_id: params.switch_id || null,
    port_number: params.port_number || null,
  }).eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/device-registry");
  return { success: true };
}

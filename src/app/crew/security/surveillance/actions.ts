"use server";

import { createClient } from "@/lib/supabase/server";

export type CameraDevice = {
  id: string;
  name: string;
  status: string;
  ip_address: string | null;
  zone_id: string | null;
  last_heartbeat: string | null;
  metadata: Record<string, unknown> | null;
};

export type Zone = { id: string; name: string };

export async function getSurveillanceCameras(): Promise<{ cameras: CameraDevice[]; zones: Zone[] }> {
  const supabase = await createClient();

  const [{ data: cameras }, { data: zones }] = await Promise.all([
    supabase
      .from("devices")
      .select("id, name, status, ip_address, zone_id, last_heartbeat, metadata")
      .eq("device_type", "camera")
      .order("zone_id", { nullsFirst: false })
      .order("name"),
    supabase.from("zones").select("id, name").order("name"),
  ]);

  return {
    cameras: (cameras ?? []) as CameraDevice[],
    zones: (zones ?? []) as Zone[],
  };
}

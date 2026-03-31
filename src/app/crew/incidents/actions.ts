"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { revalidatePath } from "next/cache";

type IncidentCategory = Database["public"]["Enums"]["incident_category"];

// Allowed categories per role — enforced server-side.
const SHARED_CATEGORIES: IncidentCategory[] = ["guest_complaint", "crowd_congestion", "other"];

const ROLE_SPECIFIC_CATEGORIES: Record<string, IncidentCategory[]> = {
  fnb_crew: ["equipment", "food_waste"],
  service_crew: ["ticketing_issue"],
  giftshop_crew: ["theft", "damaged_merchandise", "pos_failure"],
  runner_crew: ["damaged_in_transit", "vehicle_issue"],
  experience_crew: ["schedule_delay", "prop_damage"],
  security_crew: ["theft", "unauthorized_access"],
  health_crew: ["medical_emergency", "heat_exhaustion"],
  cleaning_crew: ["vandalism"],
  internal_maintainence_crew: ["network_outage", "hardware_failure", "power_outage"],
};

function getAllowedCategories(role: string): IncidentCategory[] {
  return [...SHARED_CATEGORIES, ...(ROLE_SPECIFIC_CATEGORIES[role] ?? [])];
}

export async function submitIncident(payload: {
  category: string;
  description: string;
  zone_id: string;
  attachment_url?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // JWT claim is authoritative — profiles.staff_role is not guaranteed to be synced
  const staffRole = user.app_metadata?.staff_role as string | undefined;
  if (!staffRole) throw new Error("No role assigned.");

  const allowed = getAllowedCategories(staffRole);
  if (!allowed.includes(payload.category as IncidentCategory)) {
    throw new Error(`Category '${payload.category}' not permitted for role '${staffRole}'.`);
  }

  const { error } = await supabase.from("incidents").insert({
    category: payload.category as IncidentCategory,
    description: payload.description,
    zone_id: payload.zone_id || null,
    attachment_url: payload.attachment_url ?? null,
    metadata: (payload.metadata ?? {}) as Database["public"]["Tables"]["incidents"]["Insert"]["metadata"],
    status: "open",
    logged_by: user.id,
  });

  if (error) throw new Error("DB Insert Failed: " + error.message);

  revalidatePath("/crew/incidents");
  return { success: true };
}

export async function getIncidentFormData(role: string) {
  const supabase = await createClient();

  const [zonesRes, assetsRes, vehiclesRes, vlansRes] = await Promise.all([
    supabase.from("zones").select("id, name").eq("is_active", true).order("name"),
    supabase.from("assets").select("id, name, asset_type").eq("status", "operational").order("name"),
    supabase.from("vehicles").select("id, name, vehicle_type, plate").eq("status", "active").order("name"),
    supabase.from("vlans").select("id, vlan_id, name").order("vlan_id"),
  ]);

  // Role-conditional lookups — avoid unnecessary queries
  const needsFnbItems = role === "fnb_crew";
  const needsRetailItems = ["giftshop_crew", "runner_crew", "security_crew"].includes(role);
  const needsBookings = role === "service_crew";
  const needsPosTerminals = role === "giftshop_crew";
  const needsTimeSlots = role === "experience_crew";

  const [fnbItemsRes, retailItemsRes, bookingsRes, posTerminalsRes, timeSlotsRes] = await Promise.all([
    needsFnbItems
      ? supabase.from("fnb_menu_items").select("id, name, linked_product_id").order("name")
      : Promise.resolve({ data: [] as { id: string; name: string; linked_product_id: string | null }[] }),
    needsRetailItems
      ? supabase.from("retail_catalog").select("id, linked_product_id").order("id")
      : Promise.resolve({ data: [] as { id: string; linked_product_id: string }[] }),
    needsBookings
      ? supabase.from("bookings").select("id, booking_ref, booker_email").order("created_at", { ascending: false }).limit(200)
      : Promise.resolve({ data: [] as { id: string; booking_ref: string | null; booker_email: string | null }[] }),
    needsPosTerminals
      ? supabase.from("devices").select("id, name").eq("device_type", "pos_terminal").eq("status", "online").order("name")
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    needsTimeSlots
      ? supabase.from("time_slots").select("id, start_time, end_time").order("start_time")
      : Promise.resolve({ data: [] as { id: string; start_time: string; end_time: string }[] }),
  ]);

  return {
    allowedCategories: getAllowedCategories(role),
    zones: zonesRes.data ?? [],
    assets: assetsRes.data ?? [],
    vehicles: vehiclesRes.data ?? [],
    vlans: vlansRes.data ?? [],
    fnbItems: fnbItemsRes.data ?? [],
    retailItems: retailItemsRes.data ?? [],
    bookings: bookingsRes.data ?? [],
    posTerminals: posTerminalsRes.data ?? [],
    timeSlots: timeSlotsRes.data ?? [],
  };
}

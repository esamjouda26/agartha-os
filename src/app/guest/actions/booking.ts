"use server";

import { createAdminClient } from "@/lib/supabase/admin";

// ── Types ───────────────────────────────────────────────────────────────────

export interface CreateBookingPayload {
  experienceId: string;
  timeSlotId: string;
  tierName: string;
  bookerName: string;
  bookerEmail: string;
  adultCount: number;
  childCount: number;
  facePay?: boolean;
  autoCapture?: boolean;
  promoCode?: string;
}

export interface BookingResult {
  booking_id: string;
  booking_ref: string;
  qr_code_ref: string;
  tier_name: string;
  total_price: number;
  adult_count: number;
  child_count: number;
  booker_name: string;
  booker_email: string;
  slot_date: string;
  start_time: string;
  discount_applied: number;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Create Booking ──────────────────────────────────────────────────────────

export async function createBookingAction(
  payload: CreateBookingPayload
): Promise<ActionResult<BookingResult>> {
  // Validation
  if (!payload.bookerEmail || !payload.bookerEmail.includes("@")) {
    return { success: false, error: "A valid email address is required." };
  }
  if (!payload.bookerName || payload.bookerName.trim().length < 2) {
    return { success: false, error: "Please enter a valid name." };
  }
  if (payload.adultCount < 1 || payload.adultCount > 10) {
    return { success: false, error: "Adult count must be between 1 and 10." };
  }
  if (payload.childCount < 0 || payload.childCount > 10) {
    return { success: false, error: "Child count must be between 0 and 10." };
  }

  try {
    const supabase = createAdminClient();
    // RPC not yet in generated types — cast until migration is applied and types regenerated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("rpc_create_booking", {
      p_experience_id: payload.experienceId,
      p_time_slot_id: payload.timeSlotId,
      p_tier_name: payload.tierName,
      p_booker_name: payload.bookerName.trim(),
      p_booker_email: payload.bookerEmail.trim().toLowerCase(),
      p_adult_count: payload.adultCount,
      p_child_count: payload.childCount,
      p_face_pay: payload.facePay ?? false,
      p_auto_capture: payload.autoCapture ?? false,
      p_promo_code: payload.promoCode ?? null,
    });

    if (error) {
      // Parse RPC error messages
      const msg = (error as { message: string }).message;
      if (msg.includes("SLOT_FULL")) return { success: false, error: "This time slot is fully booked. Please select another." };
      if (msg.includes("TIME_SLOT_NOT_FOUND")) return { success: false, error: "The selected time slot is no longer available." };
      if (msg.includes("TIER_NOT_FOUND")) return { success: false, error: "The selected experience tier was not found." };
      if (msg.includes("FACILITY_AT_CAPACITY")) return { success: false, error: "The facility has reached maximum safe occupancy for this timeframe. Please select a different time." };
      if (msg.includes("EXPERIENCE_NOT_FOUND")) return { success: false, error: "The selected experience was not found." };
      return { success: false, error: "Booking failed. Please try again." };
    }

    return { success: true, data: data as BookingResult };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ── Fetch Experiences + Tiers (Public) ──────────────────────────────────────

interface ExperienceRow {
  id: string;
  name: string;
  description: string;
  capacity_per_slot: number;
  is_active: boolean;
}

interface TierRow {
  id: string;
  experience_id: string;
  tier_name: string;
  price: number;
  duration_minutes: number;
  perks: string[];
}

export async function fetchExperiencesAction(): Promise<{
  experiences: ExperienceRow[];
  tiers: TierRow[];
}> {
  const supabase = createAdminClient();

  const { data: experiences } = await supabase
    .from("experiences")
    .select("id, name, description, capacity_per_slot, is_active")
    .eq("is_active", true) as { data: ExperienceRow[] | null };

  const { data: tiers } = await supabase
    .from("experience_tiers")
    .select("id, experience_id, tier_name, price, duration_minutes, perks") as { data: TierRow[] | null };

  return {
    experiences: experiences ?? [],
    tiers: tiers ?? [],
  };
}

// ── Fetch Time Slots (Public) ───────────────────────────────────────────────

interface RawSlotRow {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  booked_count: number;
  is_active: boolean;
  override_capacity: number | null;
}

interface SlotRow extends RawSlotRow {
  available: number;
  capacity: number;
}

export async function fetchTimeSlotsAction(experienceId: string, date: string): Promise<SlotRow[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("time_slots")
    .select("id, slot_date, start_time, end_time, booked_count, is_active, override_capacity")
    .eq("experience_id", experienceId)
    .eq("slot_date", date)
    .eq("is_active", true)
    .order("start_time") as { data: RawSlotRow[] | null };

  // Get experience capacity
  const { data: exp } = await supabase
    .from("experiences")
    .select("capacity_per_slot")
    .eq("id", experienceId)
    .single() as { data: { capacity_per_slot: number } | null };

  const capacity = exp?.capacity_per_slot ?? 30;

  return (data ?? []).map((slot) => ({
    ...slot,
    available: (slot.override_capacity ?? capacity) - slot.booked_count,
    capacity: slot.override_capacity ?? capacity,
  }));
}

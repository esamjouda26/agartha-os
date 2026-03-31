"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Booking result shape ───────────────────────────────────────────────
export type BookingResult = {
  id: string;
  booking_ref: string | null;
  booker_name: string | null;
  booker_email: string | null;
  status: string;
  is_used: boolean;
  checked_in_at: string | null;
  tier_name: string;
  adult_count: number;
  child_count: number;
  special_requests: string | null;
  face_pay_enabled: boolean;
  slot: { slot_date: string; start_time: string; end_time: string } | null;
};

const BOOKING_SELECT = `
  id, booking_ref, booker_name, booker_email, status, is_used,
  checked_in_at, tier_name, adult_count, child_count,
  special_requests, face_pay_enabled,
  time_slots ( slot_date, start_time, end_time )
`;

function mapBooking(raw: Record<string, unknown>): BookingResult {
  return {
    id: raw.id as string,
    booking_ref: raw.booking_ref as string | null,
    booker_name: raw.booker_name as string | null,
    booker_email: raw.booker_email as string | null,
    status: raw.status as string,
    is_used: raw.is_used as boolean,
    checked_in_at: raw.checked_in_at as string | null,
    tier_name: raw.tier_name as string,
    adult_count: raw.adult_count as number,
    child_count: raw.child_count as number,
    special_requests: raw.special_requests as string | null,
    face_pay_enabled: raw.face_pay_enabled as boolean,
    slot: (raw.time_slots as { slot_date: string; start_time: string; end_time: string } | null) ?? null,
  };
}

// ── Search by booking reference ────────────────────────────────────────
export async function searchByRef(ref: string): Promise<BookingResult | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .ilike("booking_ref", ref.trim())
    .maybeSingle();
  return data ? mapBooking(data as Record<string, unknown>) : null;
}

// ── Search by email (latest 5) ─────────────────────────────────────────
export async function searchByEmail(email: string): Promise<BookingResult[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .ilike("booker_email", email.trim())
    .order("created_at", { ascending: false })
    .limit(5);
  return (data ?? []).map((r) => mapBooking(r as Record<string, unknown>));
}

// ── Search by QR code ref ──────────────────────────────────────────────
export async function searchByQr(qrValue: string): Promise<BookingResult | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("qr_code_ref", qrValue.trim())
    .maybeSingle();
  return data ? mapBooking(data as Record<string, unknown>) : null;
}

// ── Check-in action ────────────────────────────────────────────────────
export async function checkInBooking(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "service_crew") return { success: false, error: "Restricted to service_crew." };

  // Guard: only allow check-in on confirmed bookings
  const { data: booking } = await supabase
    .from("bookings")
    .select("status, is_used")
    .eq("id", bookingId)
    .single();

  if (!booking) return { success: false, error: "Booking not found." };
  if (booking.is_used) return { success: false, error: "Booking has already been used." };
  if (booking.status === "cancelled") return { success: false, error: "Booking is cancelled." };
  if (booking.status === "checked_in") return { success: false, error: "Already checked in." };
  if (booking.status !== "confirmed") return { success: false, error: `Cannot check in — status is '${booking.status}'.` };

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "checked_in",
      checked_in_at: new Date().toISOString(),
      is_used: true,
    })
    .eq("id", bookingId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/crew/service/entry-validation");
  return { success: true };
}

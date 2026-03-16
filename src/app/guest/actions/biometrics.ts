"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

/**
 * Extracts the booking_ref from the agartha_guest_session cookie.
 * NEVER trust client-provided booking references.
 */
async function getAuthenticatedBookingRef(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("agartha_guest_session")?.value;
  if (!sessionCookie) return null;

  try {
    const secret = new TextEncoder().encode(process.env.GUEST_SESSION_SECRET!);
    const { payload } = await jwtVerify(sessionCookie, secret);
    return (payload.booking_ref as string) || null;
  } catch {
    return null;
  }
}

/**
 * Check if a biometric vector exists for the authenticated guest's booking.
 */
export async function checkBiometricStatusAction(): Promise<{
  enrolled: boolean;
  created_at: string | null;
  error?: string;
}> {
  const bookingRef = await getAuthenticatedBookingRef();
  if (!bookingRef) return { enrolled: false, created_at: null, error: "NOT_AUTHENTICATED" };

  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from as any)("biometric_vectors")
    .select("id, created_at")
    .eq("booking_ref", bookingRef)
    .maybeSingle();

  return { enrolled: !!data, created_at: data?.created_at ?? null };
}

/**
 * Opt-in: Insert a mock biometric hash for the authenticated guest's booking.
 * In production, this would receive a real vector from hardware enrollment.
 */
export async function biometricOptInAction(): Promise<{ success: boolean; error?: string }> {
  const bookingRef = await getAuthenticatedBookingRef();
  if (!bookingRef) return { success: false, error: "NOT_AUTHENTICATED" };

  // Generate a mock cryptographic hash (simulates hardware enrollment)
  const mockVector = crypto
    .createHash("sha256")
    .update(`biometric-${bookingRef}-${Date.now()}`)
    .digest("hex");

  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("biometric_vectors").insert({
    booking_ref: bookingRef,
    vector_hash: mockVector,
  });

  if (error) {
    if (error.message?.includes("duplicate")) {
      return { success: false, error: "ALREADY_ENROLLED" };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/guest/manage/biometrics");
  return { success: true };
}

/**
 * Revoke & Purge: Forcefully delete all biometric data for the authenticated guest.
 * Invokes rpc_wipe_biometric_data which is SECURITY DEFINER and audit-logged.
 */
export async function biometricRevokeAction(): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> {
  const bookingRef = await getAuthenticatedBookingRef();
  if (!bookingRef) return { success: false, error: "NOT_AUTHENTICATED" };

  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("rpc_wipe_biometric_data", {
    p_booking_ref: bookingRef,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/guest/manage/biometrics");
  return { success: true, status: data?.status ?? "PURGED" };
}

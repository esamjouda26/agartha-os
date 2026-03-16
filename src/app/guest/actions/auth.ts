"use server";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "./booking";

// ── Request OTP ─────────────────────────────────────────────────────────────

export interface OtpRequestResult {
  masked_email: string;
  booking_ref: string;
  // otp_code is returned in dev for toast display; in production strip this
  otp_code?: string;
}

export async function requestOtpAction(
  bookingRef: string
): Promise<ActionResult<OtpRequestResult>> {
  if (!bookingRef || bookingRef.trim().length < 4) {
    return { success: false, error: "Please enter a valid booking reference." };
  }

  try {
    const supabase = createAdminClient();
    // RPC not yet in generated types — cast until migration is applied
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("rpc_get_booking_identity", {
      p_booking_ref: bookingRef.trim().toUpperCase(),
    });

    if (error) {
      if ((error as { message: string }).message.includes("BOOKING_NOT_FOUND")) {
        return { success: false, error: "No active booking found with that reference." };
      }
      return { success: false, error: "Failed to process your request." };
    }

    // In production: send OTP via email service here, don't return otp_code
    return { success: true, data: data as OtpRequestResult };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ── Verify OTP & Set Session Cookie ─────────────────────────────────────────

export async function verifyOtpAction(
  bookingRef: string,
  otpCode: string
): Promise<ActionResult<{ booking_ref: string }>> {
  if (!otpCode || otpCode.length !== 6) {
    return { success: false, error: "Please enter the complete 6-digit code." };
  }

  try {
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("rpc_verify_otp", {
      p_booking_ref: bookingRef.trim().toUpperCase(),
      p_otp_code: otpCode,
    });

    if (error) {
      const msg = (error as { message: string }).message;
      if (msg.includes("OTP_EXPIRED")) {
        return { success: false, error: "Your code has expired. Please request a new one." };
      }
      if (msg.includes("OTP_LOCKED")) {
        return { success: false, error: "Too many failed attempts. Please request a new code." };
      }
      if (msg.includes("OTP_INVALID")) {
        return { success: false, error: "Incorrect verification code." };
      }
      return { success: false, error: "Verification failed." };
    }

    const result = data as { verified: boolean; booking_ref: string };

    if (result.verified) {
      // Mint an encrypted JWT for the guest session cookie
      const secret = new TextEncoder().encode(process.env.GUEST_SESSION_SECRET!);
      const jwt = await new SignJWT({ booking_ref: result.booking_ref })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(secret);

      // Set HTTP-only cookie
      const cookieStore = await cookies();
      cookieStore.set("agartha_guest_session", jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });

      return { success: true, data: { booking_ref: result.booking_ref } };
    }

    return { success: false, error: "Verification failed." };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ── Fetch Dashboard Data (IDOR-safe: booking_ref from JWT only) ─────────────

export async function fetchGuestDashboardAction(): Promise<ActionResult<Record<string, unknown>>> {
  // SECURITY: Extract booking_ref from the encrypted HTTP-only cookie.
  // NEVER trust a client-provided booking reference.
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("agartha_guest_session")?.value;
  if (!sessionCookie) {
    return { success: false, error: "NOT_AUTHENTICATED" };
  }

  let bookingRef: string;
  try {
    const secret = new TextEncoder().encode(process.env.GUEST_SESSION_SECRET!);
    const { payload } = await jwtVerify(sessionCookie, secret);
    bookingRef = payload.booking_ref as string;
    if (!bookingRef) {
      return { success: false, error: "NOT_AUTHENTICATED" };
    }
  } catch {
    return { success: false, error: "Session expired. Please log in again." };
  }

  try {
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("rpc_get_booking_by_ref", {
      p_booking_ref: bookingRef,
    });

    if (error) {
      return { success: false, error: "Failed to load booking data." };
    }

    return { success: true, data: data as Record<string, unknown> };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ── Sign Out (Clear Cookie) ─────────────────────────────────────────────────

export async function guestSignOutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("agartha_guest_session");
}

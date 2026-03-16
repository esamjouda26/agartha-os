import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { fetchGuestDashboardAction } from "../actions/auth";
import { GuestDashboardClient } from "./dashboard-client";

export default async function GuestManagePage() {
  // Read the booking_ref from the encrypted session cookie
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("agartha_guest_session")?.value;

  if (!sessionCookie) {
    redirect("/guest/login");
  }

  let bookingRef: string;
  try {
    const secret = new TextEncoder().encode(process.env.GUEST_SESSION_SECRET!);
    const { payload } = await jwtVerify(sessionCookie, secret);
    bookingRef = payload.booking_ref as string;
  } catch {
    redirect("/guest/login");
  }

  // Fetch booking data via Server Action (uses admin.ts)
  const result = await fetchGuestDashboardAction(bookingRef);

  if (!result.success || !result.data) {
    redirect("/guest/login");
  }

  return <GuestDashboardClient booking={result.data} />;
}

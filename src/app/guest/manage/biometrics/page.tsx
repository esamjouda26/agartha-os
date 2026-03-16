import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { BiometricsClient } from "./biometrics-client";
import { checkBiometricStatusAction } from "../../actions/biometrics";

export default async function BiometricsPage() {
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

  const status = await checkBiometricStatusAction();

  return <BiometricsClient bookingRef={bookingRef} initialStatus={status} />;
}

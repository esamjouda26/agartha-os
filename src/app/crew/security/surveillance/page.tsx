import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSurveillanceCameras } from "./actions";
import SurveillanceClient from "./surveillance-client";

export const metadata = { title: "Zone Surveillance | AgarthaOS Crew" };

export default async function SurveillancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "security_crew") redirect("/crew/check-in");

  const { cameras, zones } = await getSurveillanceCameras();
  return <SurveillanceClient cameras={cameras} zones={zones} />;
}

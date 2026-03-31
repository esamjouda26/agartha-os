import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkOrders } from "./actions";
import WoClient from "./wo-client";

export const metadata = { title: "Maintenance WO | AgarthaOS Crew" };

export default async function MaintenanceWoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "internal_maintainence_crew") redirect("/crew/check-in");

  const workOrders = await getActiveWorkOrders();
  return <WoClient workOrders={workOrders} />;
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrders } from "../actions";
import KitchenClient from "./kitchen-client";

export const metadata = { title: "Prep Batches | AgarthaOS Crew" };

export default async function ActiveOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "fnb_crew") redirect("/crew/check-in");

  const orders = await getActiveOrders();
  return <KitchenClient initialOrders={orders} />;
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSentPurchaseOrders } from "../actions";
import PoReceivingClient from "./po-receiving-client";

export const metadata = { title: "PO Receiving | AgarthaOS Crew" };

export default async function PoReceivingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "runner_crew") redirect("/crew/check-in");

  const orders = await getSentPurchaseOrders();
  return <PoReceivingClient orders={orders} />;
}

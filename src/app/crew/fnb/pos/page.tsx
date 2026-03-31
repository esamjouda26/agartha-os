import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFnbMenuItems } from "../actions";
import PosClient from "./pos-client";

export const metadata = { title: "Walk-Up Terminal | AgarthaOS Crew" };

export default async function FnbPosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "fnb_crew") redirect("/crew/check-in");

  const menuItems = await getFnbMenuItems();
  return <PosClient menuItems={menuItems} />;
}

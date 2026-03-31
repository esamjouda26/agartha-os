import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyRestockTasks, getRestockableProducts } from "../actions";
import RestockClient from "./restock-client";

export const metadata = { title: "Restock Request | AgarthaOS Crew" };

export default async function FnbRestockPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "fnb_crew") redirect("/crew/check-in");

  const [tasks, menuItems] = await Promise.all([
    getMyRestockTasks(),
    getRestockableProducts(),
  ]);

  return <RestockClient tasks={tasks} menuItems={menuItems} />;
}

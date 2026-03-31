import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyRetailRestockTasks, getRetailRestockableProducts } from "../actions";
import RetailRestockClient from "./restock-client";

export const metadata = { title: "Restock Request | AgarthaOS Crew" };

export default async function RetailRestockPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "giftshop_crew") redirect("/crew/check-in");

  const [tasks, products] = await Promise.all([
    getMyRetailRestockTasks(),
    getRetailRestockableProducts(),
  ]);

  return <RetailRestockClient tasks={tasks} products={products} />;
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRetailCatalogItems } from "../actions";
import RetailPosClient from "./pos-client";

export const metadata = { title: "Retail POS | AgarthaOS Crew" };

export default async function RetailPosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "giftshop_crew") redirect("/crew/check-in");

  const catalogItems = await getRetailCatalogItems();

  return <RetailPosClient catalogItems={catalogItems} />;
}

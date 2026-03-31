import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRetailCatalogItems } from "../actions";
import RetailReturnsClient from "./returns-client";

export const metadata = { title: "Returns & Refunds | AgarthaOS Crew" };

export default async function RetailReturnsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "giftshop_crew") redirect("/crew/check-in");

  const catalogItems = await getRetailCatalogItems();

  return <RetailReturnsClient catalogItems={catalogItems} />;
}

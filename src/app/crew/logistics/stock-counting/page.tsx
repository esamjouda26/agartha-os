import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyAuditTasks } from "../actions";
import StockCountingClient from "./stock-counting-client";

export const metadata = { title: "Stock Counting | AgarthaOS Crew" };

export default async function StockCountingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "runner_crew") redirect("/crew/check-in");

  const audits = await getMyAuditTasks();
  return <StockCountingClient audits={audits} />;
}

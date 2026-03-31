import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPendingRestockTasks } from "../actions";
import RestockQueueClient from "./restock-queue-client";

export const metadata = { title: "Restock Queue | AgarthaOS Crew" };

export default async function RestockQueuePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.app_metadata?.staff_role as string | undefined;
  const allowed = ["runner_crew", "health_crew", "cleaning_crew"];
  if (!role || !allowed.includes(role)) redirect("/crew/check-in");

  const tasks = await getPendingRestockTasks();
  return <RestockQueueClient tasks={tasks} />;
}

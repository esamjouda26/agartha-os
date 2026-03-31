import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EntryValidationClient from "./entry-validation-client";

export const metadata = { title: "Entry Validation | AgarthaOS Crew" };

export default async function EntryValidationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "service_crew") redirect("/crew/check-in");

  return <EntryValidationClient />;
}

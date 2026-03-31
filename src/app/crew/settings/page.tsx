import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getStaffProfile } from "./actions";
import SettingsClient from "./settings-client";

export const metadata = { title: "Settings | AgarthaOS Crew" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getStaffProfile();

  return <SettingsClient profile={profile} userEmail={user.email ?? ""} />;
}

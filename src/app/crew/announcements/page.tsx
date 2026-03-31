import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnnouncementsClient from "./announcements-client";

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("staff_role")
    .eq("id", user.id)
    .single();

  const role = profile?.staff_role as string | null;

  // Fetch announcements targeting this role or broadcast (target_roles IS NULL)
  // Filter out expired announcements
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, priority, created_at, profiles(display_name)")
    .or(`target_roles.is.null,target_roles.cs.{${role}}`)
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
    .order("priority", { ascending: false })  // critical > urgent > normal
    .order("created_at", { ascending: false });

  const formatted = (announcements ?? []).map((a: any) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    priority: a.priority as "normal" | "urgent" | "critical",
    created_at: a.created_at,
    created_by_name: a.profiles?.display_name ?? null,
  }));

  return (
    <div className="max-w-2xl mx-auto">
      <AnnouncementsClient announcements={formatted} />
    </div>
  );
}

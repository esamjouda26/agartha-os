import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import CrewLayoutClient from "./crew-layout-client";

export const metadata: Metadata = {
  title: "Crew Operations — AgarthaOS",
  description: "Frontline crew operations: ticket scanning, F&B POS, zone check-ins, and tools.",
};

export default async function CrewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const staffRole = (user?.app_metadata?.staff_role as string | undefined) ?? null;
  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? "Crew";

  return (
    <CrewLayoutClient staffRole={staffRole} displayName={displayName}>
      {children}
    </CrewLayoutClient>
  );
}

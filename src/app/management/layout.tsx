import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ManagementLayoutClient from "./management-layout-client";

export const metadata: Metadata = {
  title: "Management Portal — AgarthaOS",
  description: "Operations management: inventory, HR, scheduling, F&B, Merch, Marketing, and more.",
};

export default async function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const staffRole = (user?.app_metadata?.staff_role as string | undefined) ?? null;
  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? "Manager";

  return (
    <ManagementLayoutClient staffRole={staffRole} displayName={displayName}>
      {children}
    </ManagementLayoutClient>
  );
}

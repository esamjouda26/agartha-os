import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AdminLayoutClient from "./admin-layout-client";

export const metadata: Metadata = {
  title: "Admin Terminal — AgarthaOS",
  description: "System administration: IAM, zone configuration, device management, and audit logs.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const staffRole = (user?.app_metadata?.staff_role as string | undefined) ?? null;

  return <AdminLayoutClient staffRole={staffRole}>{children}</AdminLayoutClient>;
}

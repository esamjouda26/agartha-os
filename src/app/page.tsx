import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ROLE_PORTAL_ACCESS } from "@/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If authenticated staff, redirect to their highest-privilege portal
  if (user) {
    const staffRole = user.app_metadata?.staff_role as string | undefined;
    if (staffRole) {
      const portals = ROLE_PORTAL_ACCESS[staffRole] ?? [];
      if (portals.includes("admin")) redirect("/admin/access-control");
      if (portals.includes("management")) redirect("/management/inventory");
      redirect("/crew/check-in");
    }
  }

  // Unauthenticated: render landing page
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="glass rounded-xl p-12 text-center max-w-lg">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-gradient">AgarthaOS</span>
        </h1>
        <p className="text-muted-foreground mb-8">
          Unified Operational Platform — Agartha World
        </p>
        <div className="grid gap-3">
          <Link
            href="/login"
            className="block rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium transition-all hover:opacity-90 hover:scale-[1.02]"
          >
            Staff Login
          </Link>
          <Link
            href="/guest/booking"
            className="block rounded-lg bg-secondary px-6 py-3 text-secondary-foreground font-medium border border-border transition-all hover:bg-muted hover:scale-[1.02]"
          >
            Guest Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import IncidentsClient from "./waste-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface HydratedIncident {
  id: string;
  category: string;
  status: string;
  description: string;
  attachment_url: string | null;
  created_at: string;
  metadata: any;
  logged_by: string;
  reporter_name: string;
  reporter_role: string;
}

/* ── Page (Server Component) ──────────────────────────────────────── */
export default async function FnbWasteIncidentsPage() {
  const supabase = await createClient();

  // 1. Fetch all incidents broadly
  const { data: rawIncidents, error: incError } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false });

  if (incError) {
    console.error("Incidents fetch error:", incError);
  }

  // 2. Fetch specific profiles (F&B / Giftshop)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, staff_role")
    .in("staff_role", ["fnb_crew", "giftshop_crew", "fnb_manager"]);

  const profileLookup: Record<string, any> = {};
  (profiles || []).forEach(p => {
    profileLookup[p.id] = p;
  });

  // 3. Hydrate and filter to ONLY incidents logged by these target profiles
  const relevantIncidents: HydratedIncident[] = (rawIncidents || [])
    .filter(inc => profileLookup[inc.logged_by] !== undefined)
    .map(inc => ({
      id: inc.id,
      category: inc.category,
      status: inc.status,
      description: inc.description || "No description provided.",
      attachment_url: inc.attachment_url,
      created_at: inc.created_at,
      metadata: inc.metadata || {},
      logged_by: inc.logged_by,
      reporter_name: profileLookup[inc.logged_by].display_name,
      reporter_role: profileLookup[inc.logged_by].staff_role,
    }));

  return <IncidentsClient incidents={relevantIncidents} />;
}

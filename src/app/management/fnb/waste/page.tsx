import { createClient } from "@/lib/supabase/server";
import WasteClient from "./waste-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface WasteRow {
  id: string;
  item_name: string;
  category: string | null;
  location: string | null;
  supplier_name: string | null;
  reason: string;
  quantity: number;
  unit: string | null;
  cost_impact: number;
  logged_at: string;
}

/* ── Page (Server Component) ──────────────────────────────────────── */
export default async function FnBWastePrepPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("waste_logs")
    .select("id, item_name, category, location, supplier_name, reason, quantity, unit, cost_impact, logged_at")
    .order("logged_at", { ascending: false })
    .limit(100) as { data: WasteRow[] | null };

  return <WasteClient wasteLogs={data ?? []} />;
}

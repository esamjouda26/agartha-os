import { createClient } from "@/lib/supabase/server";
import MarginClient from "./margin-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface MarginRow {
  id: string;
  name: string;
  category: string;
  unit_price: number | null;
  cost_price: number | null;
  location: string | null;
}

/* ── Page (Server Component) ──────────────────────────────────────── */
export default async function FnBMarginPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("fnb_menu_items")
    .select("id, name, category, unit_price, cost_price, location")
    .eq("status", "available")
    .order("name") as { data: MarginRow[] | null };

  return <MarginClient items={items ?? []} />;
}

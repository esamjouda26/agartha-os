import { createClient } from "@/lib/supabase/server";
import MarginClient from "./margin-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface MarginRow {
  id: string;
  name: string;
  menu_category: string;
  unit_price: number | null;
  cost_price: number | null;
}

/* ── Page (Server Component) ──────────────────────────────────────── */
export default async function FnBMarginPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("fnb_menu_items")
    .select("id, name, menu_category, unit_price, cost_price")
    .eq("status", "available")
    .order("name") as { data: MarginRow[] | null };

  return <MarginClient items={items ?? []} />;
}

import { createClient } from "@/lib/supabase/server";
import MenuClient from "./menu-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface MenuItemRow {
  id: string;
  name: string;
  category: string;
  status: string;
  unit_price: number | null;
  cost_price: number | null;
  allergens: string[] | null;
  location: string | null;
}

/* ── Page (Server Component) ──────────────────────────────────────── */
export default async function FnBMenuPricingPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("fnb_menu_items")
    .select("id, name, category, status, unit_price, cost_price, allergens, location")
    .order("name") as { data: MenuItemRow[] | null };

  const { data: products } = await supabase
    .from("products")
    .select("id, name, cost_price, suppliers(name)")
    .order("name") as { data: { id: string; name: string; cost_price: number | null; suppliers: { name: string } | null }[] | null };

  return <MenuClient items={items ?? []} ingredients={products ?? []} />;
}

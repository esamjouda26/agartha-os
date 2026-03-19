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
export default async function FnBMenuPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const page = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;
  const pageSize = 50;
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: items, count } = await supabase
    .from("fnb_menu_items")
    .select("id, name, category, status, unit_price, cost_price, allergens, location", { count: 'exact' })
    .order("name")
    .range(from, to) as { data: MenuItemRow[] | null, count: number | null };

  const { data: products } = await supabase
    .from("products")
    .select("id, name, cost_price, suppliers(name)")
    .in("category", ["Raw Ingredient", "Consumable"])
    .order("name") as { data: { id: string; name: string; cost_price: number | null; suppliers: { name: string } | null }[] | null };

  return <MenuClient items={items ?? []} ingredients={products ?? []} count={count ?? 0} initialPage={page} />;
}

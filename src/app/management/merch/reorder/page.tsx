import { createClient } from "@/lib/supabase/server";
import ReorderPointsClient from "./reorder-points-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface ReorderRow {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  unit: string;
  reorder_point: number;
  product_stock_levels: { current_qty: number; max_qty: number }[];
  suppliers: { id: string; name: string } | null;
}

/* ── Page (Server Component) ──────────────────────────────────────── */
export default async function MerchReorderPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, sku, category, unit, reorder_point, product_stock_levels(current_qty, max_qty), suppliers(id, name)")
    .order("name") as { data: ReorderRow[] | null };

  return <ReorderPointsClient products={data ?? []} />;
}

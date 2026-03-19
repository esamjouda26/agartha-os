import { createClient } from "@/lib/supabase/server";
import ReorderPointsClient from "./reorder-points-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface ReorderRow {
  id: string;
  name: string;
  sku: string | null;
  product_category: string;
  unit_of_measure: string;
  reorder_point: number;
  product_stock_levels: { current_qty: number; max_qty: number }[];
  suppliers: { id: string; name: string } | null;
  purchase_order_items: {
    expected_qty: number;
    received_qty: number;
    purchase_orders: { status: string } | null;
  }[];
}

/* ── Page (Server Component) ──────────────────────────────────────── */
export default async function MerchReorderPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(`
      id, name, sku, product_category, unit_of_measure, reorder_point, 
      product_stock_levels(current_qty, max_qty), 
      suppliers(id, name),
      purchase_order_items(expected_qty, received_qty, purchase_orders(status))
    `)
    .order("name") as { data: ReorderRow[] | null };

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name")
    .order("name") as { data: { id: string; name: string }[] | null };

  return <ReorderPointsClient products={data ?? []} suppliers={suppliers ?? []} />;
}

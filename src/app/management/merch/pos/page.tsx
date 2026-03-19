import { createClient } from "@/lib/supabase/server";
import SupplierPOsClient from "./supplier-pos-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface PurchaseOrderRow {
  id: string;
  supplier_id: string | null;
  status: string;
  total_amount: number | null;
  created_at: string;
  suppliers: { id: string; name: string; contact_email: string | null } | null;
  purchase_order_items: {
    id: string;
    expected_qty: number;
    received_qty: number;
    item_name: string;
    products: { id: string; name: string; cost_price: number | null } | null;
  }[];
}

/* ── Page (Server Component) ──────────────────────────────────────── */
export default async function MerchPOSPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_orders")
    .select(`
      id, supplier_id, status, total_amount, created_at,
      suppliers(id, name, contact_email),
      purchase_order_items(id, expected_qty, received_qty, item_name, products(id, name, cost_price))
    `)
    .order("created_at", { ascending: false }) as { data: PurchaseOrderRow[] | null };

  return <SupplierPOsClient purchaseOrders={data ?? []} />;
}

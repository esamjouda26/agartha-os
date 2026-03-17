import { createClient } from "@/lib/supabase/server";
import SupplierPOsClient from "./supplier-pos-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface PurchaseOrderRow {
  id: string;
  po_number: string | null;
  supplier_id: string | null;
  status: string;
  total_amount: number | null;
  created_at: string;
  suppliers: { id: string; name: string; contact_email: string | null } | null;
  purchase_order_items: {
    id: string;
    quantity: number;
    unit_cost: number;
    products: { id: string; name: string } | null;
  }[];
}

/* ── Page (Server Component) ──────────────────────────────────────── */
export default async function MerchPOSPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_orders")
    .select(`
      id, po_number, supplier_id, status, total_amount, created_at,
      suppliers(id, name, contact_email),
      purchase_order_items(id, quantity, unit_cost, products(id, name))
    `)
    .order("created_at", { ascending: false }) as { data: PurchaseOrderRow[] | null };

  return <SupplierPOsClient purchaseOrders={data ?? []} />;
}

import { Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import CatalogClient from "./catalog-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface CatalogProduct {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  unit: string;
  cost_price: number | null;
  reorder_point: number;
  status: string | null;
  suppliers: { id: string; name: string } | null;
}

/* ── Page (Server Component) ──────────────────────────────────────── */
export default async function MerchCatalogPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, sku, category, unit, cost_price, reorder_point, status, suppliers(id, name)")
    .order("name") as { data: CatalogProduct[] | null };

  const { data: supplierList } = await supabase
    .from("suppliers")
    .select("id, name")
    .order("name") as { data: { id: string; name: string }[] | null };

  return <CatalogClient products={products ?? []} suppliers={supplierList ?? []} />;
}

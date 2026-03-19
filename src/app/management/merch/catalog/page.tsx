import { Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import CatalogClient from "./catalog-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface CatalogProduct {
  id: string;
  name: string;
  sku: string | null;
  product_category: string;
  unit_of_measure: string;
  cost_price: number | null;
  reorder_point: number;
  is_active: boolean;
}

/* ── Page (Server Component) ──────────────────────────────────────── */
export default async function MerchCatalogPage({
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

  // Paginated Primary Fetch
  const { data: products, count } = await supabase
    .from("products")
    .select("id, name, sku, product_category, unit_of_measure, cost_price, reorder_point, is_active", { count: 'exact' })
    .order("name")
    .range(from, to) as { data: CatalogProduct[] | null, count: number | null };

  return <CatalogClient products={products ?? []} count={count ?? 0} initialPage={page} />;
}

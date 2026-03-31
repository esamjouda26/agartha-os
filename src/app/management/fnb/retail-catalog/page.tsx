import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RetailCatalogClient, { RetailItemRow, RetailEligibleProduct } from "./retail-client";

export default async function RetailCatalogPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const pageSize = 50;
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // Fetch paginated catalog with joined product cost_price
  const { data: rawCatalog, count } = await (supabase
    .from("retail_catalog")
    .select(`
      id, name, selling_price, category, is_active, linked_product_id, description,
      products ( cost_price )
    `, { count: "exact" })
    .order("name")
    .range(from, to) as any);

  // Fetch all eligible active prepakaged/retail merch products
  const { data: rawProducts } = await supabase
    .from("products")
    .select("id, name, cost_price")
    .in("product_category", ["retail_merch", "prepackaged_fnb"])
    .eq("is_active", true);

  // Transformation for Client Component Type Safety
  const catalogList: RetailItemRow[] = (rawCatalog || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    is_active: row.is_active,
    description: row.description || null,
    selling_price: Number(row.selling_price || 0),
    cost_price: Number(row.products?.cost_price || 0),
    linked_product_id: row.linked_product_id,
  }));

  const eligibleProducts: RetailEligibleProduct[] = (rawProducts || []).map((p) => ({
    id: p.id,
    name: p.name,
    cost_price: Number(p.cost_price || 0),
  }));

  const items = [...catalogList].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <RetailCatalogClient 
      items={items} 
      products={eligibleProducts} 
      count={count ?? 0} 
      initialPage={page} 
    />
  );
}

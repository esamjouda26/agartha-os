import { createClient } from "@/lib/supabase/server";
import RestockClient from "./restock-client";

export default async function FnBRestockPage() {
  const supabase = await createClient();
  
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, product_category, barcode")
    .eq("is_active", true);

  if (error) {
    console.error("AUDIT ERROR: Failed to fetch products for restock:", error.message);
  }

  const formattedProducts = (products || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    category: item.product_category || "Uncategorized",
    barcode: item.barcode
  }));

  // Generic lookup for user's active zone logic skipped for UI scaffolding
  const mockedLocationId = "eb4a8635-f581-429b-ac5a-5f5f551e6490"; // Replaced with valid "Cafe" location UUID

  return <RestockClient products={formattedProducts} locationId={mockedLocationId} />;
}

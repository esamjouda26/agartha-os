import { createClient } from "@/lib/supabase/server";
import PosClient from "./pos-client";

export default async function FnBPosPage() {
  const supabase = await createClient();
  
  const [
    { data: menuItems },
    { data: recipes },
    { data: loc }
  ] = await Promise.all([
    supabase.from("fnb_menu_items").select("id, name, menu_category, unit_price, linked_product_id, products(barcode)").eq("is_active", true),
    supabase.from("fnb_recipes").select("menu_item_id, product_id, quantity_required"),
    supabase.from("locations").select("id").eq("is_fnb_default", true).single()
  ]);

  let stockMap: Record<string, number> = {};
  if (loc?.id) {
    const { data: stocks } = await supabase.from("product_stock_levels").select("product_id, current_qty").eq("location_id", loc.id);
    if (stocks) {
      stocks.forEach(s => stockMap[s.product_id] = s.current_qty);
    }
  }

  const formattedItems = (menuItems || []).map((item: any) => {
    let inStock = true;

    if (item.linked_product_id) {
      inStock = (stockMap[item.linked_product_id] || 0) >= 1;
    } else {
      const itemRecipes = (recipes || []).filter(r => r.menu_item_id === item.id);
      if (itemRecipes.length > 0) {
        for (const r of itemRecipes) {
          if ((stockMap[r.product_id] || 0) < r.quantity_required) {
            inStock = false;
            break;
          }
        }
      }
    }

    return {
      id: item.id,
      name: item.name,
      category: item.menu_category || "Uncategorized",
      price: item.unit_price,
      barcode: item.products?.barcode || null,
      inStock,
      raw: {
        linked_product_id: item.linked_product_id,
        menu_category: item.menu_category
      }
    };
  });

  return <PosClient menuItems={formattedItems} />;
}

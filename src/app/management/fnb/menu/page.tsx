import { createClient } from "@/lib/supabase/server";
import MenuClient from "./menu-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface MenuItemRow {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
  unit_price: number | null;
  cost_price: number | null;
  description: string | null;
  image_url: string | null;
  allergens: string[] | null;
  menu_category: string | null;
  linked_product_id: string | null;
  isVirtualDraft?: boolean;
  recipeItems?: { ingredientId: string; qty: number }[];
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

  const { data: rawItemsData, count } = await supabase
    .from("fnb_menu_items")
    .select("id, name, is_active, unit_price, menu_category, linked_product_id, description, image_url, allergens", { count: 'exact' })
    .order("name")
    .range(from, to) as { data: any[] | null, count: number | null };

  const { data: recipesData } = await supabase
    .from("fnb_recipes")
    .select("menu_item_id, product_id, quantity_required, products(cost_price)");

  const { data: productsData } = await supabase
    .from("products")
    .select("id, name, cost_price, product_category, unit_of_measure, suppliers(name)")
    .in("product_category", ["raw_ingredient", "consumable", "prepackaged_fnb"])
    .order("name") as { data: { id: string; name: string; cost_price: number | null; product_category: string; unit_of_measure: string | null; suppliers: { name: string } | null }[] | null };

  const itemsData: MenuItemRow[] | null = rawItemsData ? rawItemsData.map((item) => {
    // Determine Base Cost (COGS)
    let cogs = 0;
    if (item.linked_product_id) {
       // If it is directly linked, fetch from its parent product
       const p = productsData ? productsData.find(pd => pd.id === item.linked_product_id) : null;
       cogs = p?.cost_price || 0;
    } else if (recipesData) {
       // Otherwise, sum BOM line items
       const boms = recipesData.filter(r => r.menu_item_id === item.id);
       cogs = boms.reduce((sum, current) => sum + (current.quantity_required * ((current.products as any)?.cost_price || 0)), 0);
    }

    return {
      id: item.id,
      name: item.name,
      is_active: item.is_active,
      unit_price: item.unit_price,
      menu_category: item.menu_category,
      linked_product_id: item.linked_product_id,
      description: item.description,
      image_url: item.image_url,
      allergens: item.allergens,
      category: item.linked_product_id ? "prepackaged" : "prepared_item",
      cost_price: cogs,
      recipeItems: recipesData?.filter(r => r.menu_item_id === item.id).map(r => ({ ingredientId: r.product_id, qty: r.quantity_required })) || [],
    };
  }) : null;

  let items = itemsData ?? [];
  const products = productsData ?? [];

  // Identify Prepackaged items from products that are missing from fnb_menu_items
  const prepackagedProducts = products.filter(p => p.product_category === "prepackaged_fnb");
  const linkedProductIds = new Set(items.map(item => item.linked_product_id).filter(Boolean));

  const virtualDrafts: MenuItemRow[] = prepackagedProducts
    .filter(p => !linkedProductIds.has(p.id))
    .map(p => ({
      id: `virtual-${p.id}`,
      name: p.name,
      category: "prepackaged",
      is_active: false,
      unit_price: null,
      cost_price: p.cost_price,
      description: null,
      image_url: null,
      allergens: null,
      menu_category: null,
      linked_product_id: p.id,
      isVirtualDraft: true,
    }));

  items = [...items, ...virtualDrafts].sort((a, b) => a.name.localeCompare(b.name));

  return <MenuClient items={items} ingredients={products} count={(count ?? 0) + virtualDrafts.length} initialPage={page} />;
}

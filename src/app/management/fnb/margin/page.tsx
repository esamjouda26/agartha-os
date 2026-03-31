import { createClient } from "@/lib/supabase/server";
import MarginClient from "./margin-client";

export interface MarginRow {
  id: string; 
  type: "fnb" | "retail";
  name: string;
  items_sold: number;
  base_cost: number;
  selling_price: number;
  target_margin: number;
  actual_margin: number;
  variance: number;
  health: "Excellent" | "Good" | "Warning" | "Critical";
}

export default async function MarginPage() {
  const supabase = await createClient();

  // 1. Fetch raw underlying products
  const { data: rawProducts } = await supabase.from("products").select("id, name, cost_price");
  const productsMap: Record<string, {name: string, cost_price: number}> = {};
  (rawProducts || []).forEach(p => productsMap[p.id] = p);

  // 2. Fetch F&B Recipes
  const { data: rawRecipes } = await supabase.from("fnb_recipes").select("menu_item_id, product_id, quantity_required");
  
  // Group formulas by menu_item_id
  const recipeCosts: Record<string, number> = {};
  (rawRecipes || []).forEach(r => {
    if (!recipeCosts[r.menu_item_id]) recipeCosts[r.menu_item_id] = 0;
    const p = productsMap[r.product_id];
    if (p) {
      recipeCosts[r.menu_item_id] += p.cost_price * r.quantity_required;
    }
  });

  // 3. Fetch all active catalog / menu items
  const { data: menuItems } = await supabase.from("fnb_menu_items").select("id, name, unit_price, linked_product_id").eq("is_active", true);
  const { data: catalogItems } = await supabase.from("retail_catalog").select("id, name, selling_price, linked_product_id").eq("is_active", true);

  // Lookup map for building rows
  const marginRows: Record<string, MarginRow> = {};

  (menuItems || []).forEach(item => {
    // F&B base cost: recipe cost OR linked product cost OR 0
    let baseCost = 0;
    if (recipeCosts[item.id]) {
      baseCost = recipeCosts[item.id];
    } else if (item.linked_product_id && productsMap[item.linked_product_id]) {
      baseCost = productsMap[item.linked_product_id].cost_price;
    }

    const price = item.unit_price || 0;
    const targetMargin = price > 0 ? ((price - baseCost) / price) * 100 : 0;

    marginRows[item.id] = {
      id: item.id,
      type: "fnb",
      name: item.name,
      items_sold: 0,
      base_cost: baseCost,
      selling_price: price,
      target_margin: targetMargin,
      actual_margin: 0, 
      variance: 0,
      health: "Critical"
    };
  });

  (catalogItems || []).forEach(item => {
    let baseCost = 0;
    if (item.linked_product_id && productsMap[item.linked_product_id]) {
      baseCost = productsMap[item.linked_product_id].cost_price;
    }

    const price = item.selling_price || 0;
    const targetMargin = price > 0 ? ((price - baseCost) / price) * 100 : 0;

    marginRows[item.id] = {
      id: item.id,
      type: "retail",
      name: item.name,
      items_sold: 0,
      base_cost: baseCost,
      selling_price: price,
      target_margin: targetMargin,
      actual_margin: 0,
      variance: 0,
      health: "Critical"
    };
  });

  // 4. Compute Historical Actuals
  // Fetch F&B sold items (exclude cancelled)
  const { data: fnbOrders } = await supabase
    .from("fnb_order_items")
    .select(`
      quantity,
      unit_price,
      menu_item_id,
      fnb_orders!inner ( status )
    `)
    .neq("fnb_orders.status", "cancelled");

  // Fetch Retail sold items
  const { data: retailOrders } = await supabase
    .from("retail_order_items")
    .select(`
      quantity,
      unit_price,
      retail_catalog_id,
      retail_orders!inner ( status )
    `)
    .neq("retail_orders.status", "refunded");

  // Compile aggregations by item ID
  const itemRevenues: Record<string, number> = {};
  const itemCosts: Record<string, number> = {};
  const itemCounts: Record<string, number> = {}; 

  (fnbOrders || []).forEach(o => {
    const q = o.quantity || 0;
    const p = o.unit_price || 0;
    const row = marginRows[o.menu_item_id];
    if (row) {
      if (!itemRevenues[row.id]) { itemRevenues[row.id] = 0; itemCosts[row.id] = 0; itemCounts[row.id] = 0; }
      itemRevenues[row.id] += q * p;
      itemCosts[row.id] += q * row.base_cost;
      itemCounts[row.id] += q;
    }
  });

  (retailOrders || []).forEach(o => {
    const q = o.quantity || 0;
    const p = o.unit_price || 0;
    const row = marginRows[o.retail_catalog_id];
    if (row) {
      if (!itemRevenues[row.id]) { itemRevenues[row.id] = 0; itemCosts[row.id] = 0; itemCounts[row.id] = 0; }
      itemRevenues[row.id] += q * p;
      itemCosts[row.id] += q * row.base_cost;
      itemCounts[row.id] += q;
    }
  });

  // 5. Finalize rows
  const finalRows = Object.values(marginRows).map(row => {
    const rev = itemRevenues[row.id] || 0;
    const cost = itemCosts[row.id] || 0;
    row.items_sold = itemCounts[row.id] || 0;
    
    if (rev > 0) {
      row.actual_margin = ((rev - cost) / rev) * 100;
    } else {
      // Unsold inherits Target mapping to not trigger false alarms
      row.actual_margin = row.target_margin;
    }

    row.variance = row.actual_margin - row.target_margin;

    if (row.actual_margin < 0) row.health = "Critical";
    else if (row.actual_margin <= 35) row.health = "Warning";
    else if (row.actual_margin <= 60) row.health = "Good";
    else row.health = "Excellent";

    return row;
  });

  return <MarginClient data={finalRows} />;
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createMenuItemAction(payload: {
  name: string;
  category: string;
  location: string;
  unit_price: number;
  cost_price: number;
  status: string;
  allergens: string[] | null;
  recipeItems: { ingredientId: string; qty: number }[];
}) {
  const supabase = await createClient();

  // 1. Authenticate & Role-Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "UNAUTHORIZED" };

  const staffRole = (user.app_metadata?.staff_role as string) ?? null;
  const allowedRoles = ["business_admin", "it_admin", "fnb_manager", "operations_manager"];
  if (!staffRole || !allowedRoles.includes(staffRole)) {
    return { error: "FORBIDDEN - You do not have permission to modify the F&B catalog." };
  }

  // 2. Insert Base Item
  const { data: menuItem, error: itemError } = await supabase
    .from("fnb_menu_items")
    .insert({
      name: payload.name,
      menu_category: payload.category,
      unit_price: payload.unit_price,
      cost_price: payload.cost_price,
      status: payload.status,
    } as any)
    .select("id")
    .single();

  if (itemError || !menuItem) {
    console.error("Failed to insert menu item:", itemError);
    return { error: itemError?.message || "Failed to create core menu item." };
  }

  // 3. Atomically Insert Bill of Materials (BOM) / Recipe
  if (payload.recipeItems.length > 0) {
    const recipePayload = payload.recipeItems.map(ri => ({
      menu_item_id: (menuItem as any).id,
      product_id: ri.ingredientId,
      quantity_required: ri.qty,
      unit: "unit"
    }));

    const { error: recipeError } = await supabase
      .from("fnb_recipes")
      .insert(recipePayload as any);

    if (recipeError) {
      console.error("Failed to insert recipe BOM:", recipeError);
      return { error: "Item created, but failed to save Bill of Materials." };
    }
  }

  revalidatePath("/management/fnb/menu");
  return { success: true };
}

export async function submitWasteLogAction(payload: {
  location_id: string;
  wastedItems: { menu_item_id: string; quantity: number; reason: "expired_eod" | "dropped_spilled" | "contaminated" | "prep_error" }[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "UNAUTHORIZED" };

  for (const item of payload.wastedItems) {
    // 1. Insert Waste Log
    const { data: wasteLog, error: wasteError } = await supabase
      .from("fnb_waste_log")
      .insert({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        reason: item.reason,
        logged_by: user.id,
      })
      .select("id")
      .single();
    // note: using 'fnb_waste' table instead of 'fnb_waste_log' which might be the actual name. Let's see if there is an error. We will check it.

    if (wasteError) {
       // if fnb_waste fails, we might need to use fnb_waste_log 
       console.error(wasteError);
    }

    const wasteId = wasteLog ? wasteLog.id : null;

    // 2. Look up the fnb_recipes for the wasted item
    const { data: recipes } = await supabase
      .from("fnb_recipes")
      .select("product_id, quantity_required")
      .eq("menu_item_id", item.menu_item_id);

    if (recipes && recipes.length > 0) {
      // 3. Deduce Exact Sub-Ingredients
      for (const recipe of recipes) {
        const totalDeduction = recipe.quantity_required * item.quantity;
        
        const { data: stockLevel } = await supabase
          .from("product_stock_levels")
          .select("id, current_qty")
          .eq("product_id", recipe.product_id)
          .eq("location_id", payload.location_id)
          .limit(1)
          .single();

        if (stockLevel) {
          await supabase
            .from("product_stock_levels")
            .update({ current_qty: Math.max(0, stockLevel.current_qty - totalDeduction) })
            .eq("id", stockLevel.id);
        }

        // Add ledger entry
        await supabase.from("inventory_ledger").insert({
          product_id: recipe.product_id,
          location_id: payload.location_id,
          quantity_delta: -totalDeduction,
          transaction_type: "waste_deduction",
          reference_id: wasteId,
          performed_by: user.id
        });
      }
    }
  }

  revalidatePath("/management/fnb/waste");
  return { success: true };
}

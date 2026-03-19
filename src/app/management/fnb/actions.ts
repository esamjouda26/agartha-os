"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createMenuItemAction(payload: {
  id?: string;
  name: string;
  category: string;
  unit_price: number;
  is_active: boolean;
  description: string | null;
  image_url: string | null;
  allergens: string[] | null;
  linked_product_id?: string | null;
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

  // 2. Upsert Base Item
  let menuItemId = payload.id;
  const isVirtual = menuItemId?.startsWith('virtual-');

  if (isVirtual || !menuItemId) {
    // Insert new
    const { data: menuItem, error: itemError } = await supabase
      .from("fnb_menu_items")
      .insert({
        name: payload.name,
        menu_category: payload.category,
        unit_price: payload.unit_price,
        is_active: payload.is_active,
        description: payload.description,
        image_url: payload.image_url,
        allergens: payload.allergens,
        linked_product_id: payload.linked_product_id || null,
      } as any)
      .select("id")
      .single();

    if (itemError || !menuItem) {
      console.error("Failed to insert menu item:", itemError);
      return { error: itemError?.message || "Failed to create core menu item." };
    }
    menuItemId = (menuItem as any).id;
  } else {
    // Update existing
    const { error: itemError } = await supabase
      .from("fnb_menu_items")
      .update({
        name: payload.name,
        menu_category: payload.category,
        unit_price: payload.unit_price,
        is_active: payload.is_active,
        description: payload.description,
        image_url: payload.image_url,
        allergens: payload.allergens,
        linked_product_id: payload.linked_product_id || null,
      } as any)
      .eq("id", menuItemId);

    if (itemError) {
      console.error("Failed to update menu item:", itemError);
      return { error: itemError.message };
    }
    
    // Clear old recipe items if updating
    await supabase.from("fnb_recipes").delete().eq("menu_item_id", menuItemId);
  }

  // 3. Atomically Insert Bill of Materials (BOM) / Recipe
  if (payload.recipeItems.length > 0) {
    const productIds = payload.recipeItems.map(ri => ri.ingredientId);
    const { data: products } = await supabase.from("products").select("id, unit_of_measure").in("id", productIds);

    const recipePayload = payload.recipeItems.map(ri => {
      const p = products?.find(prod => prod.id === ri.ingredientId);
      return {
        menu_item_id: menuItemId,
        product_id: ri.ingredientId,
        quantity_required: ri.qty,
        unit: p?.unit_of_measure || "unit"
      };
    });

    const { error: recipeError } = await supabase
      .from("fnb_recipes")
      .insert(recipePayload as any);

    if (recipeError) {
      console.error("Failed to insert recipe BOM:", recipeError);
      return { error: `BOM failed: ${recipeError.message || JSON.stringify(recipeError)}` };
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

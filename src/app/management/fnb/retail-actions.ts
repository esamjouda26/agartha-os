"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Auth Check helper
async function requireRetailManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const staffRole = (user.app_metadata?.staff_role as string) ?? null;
  if (!["fnb_manager", "merch_manager", "business_admin", "it_admin"].includes(staffRole)) {
    throw new Error("FORBIDDEN - You do not have permission to manage retail catalog.");
  }
  return { supabase, user };
}

export async function createRetailCatalogItem(payload: { linked_product_id: string; selling_price: number; name: string; category: string; description?: string | null; is_active?: boolean }) {
  const { supabase, user } = await requireRetailManager();

  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("cost_price")
    .eq("id", payload.linked_product_id)
    .single();

  if (prodErr || !product) throw new Error("Product not found.");

  if (product.cost_price != null && payload.selling_price <= Number(product.cost_price)) {
    throw new Error(`Selling price must be greater than the cost price (${product.cost_price}).`);
  }

  const { error } = await supabase.from("retail_catalog").insert({
    linked_product_id: payload.linked_product_id,
    selling_price: payload.selling_price,
    name: payload.name,
    category: payload.category,
    description: payload.description || null,
    is_active: payload.is_active !== undefined ? payload.is_active : true,
    created_by: user.id
  } as any);

  if (error) throw new Error(error.message);

  revalidatePath("/management/fnb/retail-catalog");
  return { success: true };
}

export async function updateRetailCatalogItem(catalog_id: string, payload: { selling_price?: number; is_active?: boolean; name?: string; category?: string; description?: string | null }) {
  const { supabase } = await requireRetailManager();

  const updates: any = {};
  
  if (payload.selling_price !== undefined) {
    const { data: catalogItem } = await supabase
      .from("retail_catalog")
      .select("linked_product_id")
      .eq("id", catalog_id)
      .single();
      
    if (catalogItem?.linked_product_id) {
       const { data: product } = await supabase
        .from("products")
        .select("cost_price")
        .eq("id", catalogItem.linked_product_id)
        .single();
        
       if (product?.cost_price != null && payload.selling_price <= Number(product.cost_price)) {
         throw new Error(`Selling price must be greater than the cost price (${product.cost_price}).`);
       }
    }
    updates.selling_price = payload.selling_price;
  }
  
  if (payload.is_active !== undefined) {
    updates.is_active = payload.is_active;
  }
  if (payload.name !== undefined) {
    updates.name = payload.name;
  }
  if (payload.category !== undefined) {
    updates.category = payload.category;
  }
  if (payload.description !== undefined) {
    updates.description = payload.description;
  }

  const { error } = await supabase.from("retail_catalog").update(updates).eq("id", catalog_id);
  if (error) throw new Error(error.message);

  revalidatePath("/management/fnb/retail-catalog");
  revalidatePath("/management/fnb/retail-catalog/page");
  return { success: true };
}

export async function getRetailMetrics() {
  const { supabase } = await requireRetailManager();

  const { data: orders } = await supabase
    .from("retail_orders")
    .select("total_amount")
    .eq("status", "completed");

  const totalVolume = (orders || []).reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const totalOrders = orders?.length || 0;

  const { data: retailLocation } = await supabase
    .from("locations")
    .select("id")
    .eq("is_retail_default", true)
    .single();

  let restockCount = 0;
  if (retailLocation) {
    const { count } = await supabase
      .from("restock_tasks")
      .select("id", { count: "exact", head: true })
      .eq("location_id", retailLocation.id);
    restockCount = count || 0;
  }

  return {
    totalVolume,
    totalOrders,
    restockCount
  };
}

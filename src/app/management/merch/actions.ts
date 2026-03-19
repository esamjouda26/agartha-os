"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProductAction(payload: {
  name: string;
  sku: string | null;
  category: string;
  unit: string;
  cost_price: number | null;
  supplier: string | null;
}) {
  const supabase = await createClient();

  // 1. Authenticate & Role-Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "UNAUTHORIZED" };

  const staffRole = (user.app_metadata?.staff_role as string) ?? null;
  const allowedRoles = ["business_admin", "it_admin", "merch_manager", "inventory_manager"];
  if (!staffRole || !allowedRoles.includes(staffRole)) {
    return { error: "FORBIDDEN - You do not have permission to modify the Product Catalog." };
  }

  // 2. Insert Product
  const { error: insertError } = await supabase
    .from("products")
    .insert({
      name: payload.name,
      sku: payload.sku,
      product_category: payload.category,
      unit_of_measure: payload.unit,
      cost_price: payload.cost_price,
      supplier_id: payload.supplier,
      reorder_point: 10, // System-defaulted 
    } as any);

  if (insertError) {
    console.error("Failed to insert product:", insertError);
    return { error: insertError?.message || "Failed to create product in registry." };
  }

  revalidatePath("/management/merch/catalog");
  return { success: true };
}

export async function createSupplierAction(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "UNAUTHORIZED" };

  const staffRole = (user.app_metadata?.staff_role as string) ?? null;
  const allowedRoles = ["business_admin", "it_admin", "merch_manager", "inventory_manager"];
  if (!staffRole || !allowedRoles.includes(staffRole)) {
    return { error: "FORBIDDEN - You do not have permission to modify Suppliers." };
  }

  const name = formData.get("name") as string;
  const contact_email = formData.get("contact_email") as string;
  const contact_phone = formData.get("contact_phone") as string;
  const address = formData.get("address") as string;
  const category = formData.get("category") as string;

  const { error } = await supabase.from("suppliers").insert({
    name, contact_email, contact_phone, address, category, rating: 4.5
  } as any);

  if (error) return { error: error.message };

  revalidatePath("/management/merch/suppliers");
  revalidatePath("/management/fnb/supplier");
  return { success: true };
}

export async function updatePOStatusAction(poId: string, newStatus: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "UNAUTHORIZED" };

  const staffRole = (user.app_metadata?.staff_role as string) ?? null;
  if (!["business_admin", "it_admin", "merch_manager", "inventory_manager"].includes(staffRole)) {
    return { error: "FORBIDDEN" };
  }

  // Look up warehouse location
  const { data: locations } = await supabase
    .from("locations")
    .select("id")
    .ilike("name", "%Warehouse%")
    .limit(1);
    
  let warehouseId: string | null = locations?.[0]?.id || null;

  if (!warehouseId) {
     // fallback just in case
     const { data: anyLoc } = await supabase.from("locations").select("id").limit(1);
     warehouseId = anyLoc?.[0]?.id || null;
  }

  if (newStatus === "completed" || newStatus === "partially_received") {
    // Fetch PO items
    const { data: poItems, error: itemsError } = await supabase
      .from("purchase_order_items")
      .select("product_id, expected_qty, received_qty")
      .eq("po_id", poId);

    if (itemsError) return { error: itemsError.message };

    // Increment stock physically
    if (poItems && poItems.length > 0 && warehouseId) {
      for (const item of poItems) {
        if (!item.product_id) continue;
        
        // Use received_qty if > 0, else assume expected_qty for full reconciliation
        const qtyToAdd = (item.received_qty && item.received_qty > 0) 
            ? item.received_qty 
            : item.expected_qty;

        if (qtyToAdd > 0) {
          // Check existing stock level
          const { data: existingStock } = await supabase
            .from("product_stock_levels")
            .select("id, current_qty")
            .eq("product_id", item.product_id)
            .eq("location_id", warehouseId)
            .limit(1)
            .single();

          if (existingStock) {
            await supabase
              .from("product_stock_levels")
              .update({ current_qty: existingStock.current_qty + qtyToAdd })
              .eq("id", existingStock.id);
          } else {
            await supabase
              .from("product_stock_levels")
              .insert({
                product_id: item.product_id,
                location_id: warehouseId,
                current_qty: qtyToAdd,
                max_qty: qtyToAdd * 2 // Default assignment
              });
          }

          // Insert into ledger for audit
          await supabase
            .from("inventory_ledger")
            .insert({
              product_id: item.product_id,
              location_id: warehouseId,
              quantity_delta: qtyToAdd,
              transaction_type: "po_receipt",
              reference_id: poId,
              performed_by: user.id
            });
        }
      }
    }
  }

  const { error } = await supabase.from("purchase_orders").update({ status: newStatus as any }).eq("id", poId);

  revalidatePath("/management/merch/pos");
  if (error) return { error: error.message };
  return { success: true };
}

export async function generateDraftPOsAction(payload: { supplierId: string, items: { productId: string, name: string, qty: number }[] }[]) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "UNAUTHORIZED" };

  const staffRole = (user.app_metadata?.staff_role as string) ?? null;
  if (!["business_admin", "it_admin", "merch_manager", "inventory_manager"].includes(staffRole)) {
    return { error: "FORBIDDEN" };
  }

  for (const bundle of payload) {
    if (!bundle.supplierId) continue; // Exclude products with no assigned supplier
    
    // 1. Create a Draft PO for this supplier
    const { data: po, error: poError } = await (supabase.from as any)("purchase_orders")
      .insert({
        supplier_id: bundle.supplierId,
        status: "pending",
        created_by: user.id
      }).select("id").single();

    if (poError || !po) {
      console.error("Draft PO Insert Error:", poError);
      return { error: `PO Insert Error: ${JSON.stringify(poError)}` };
    }

    // 2. Map items into PO line items
    const lineItems = bundle.items.map(item => ({
      po_id: po.id,
      product_id: item.productId,
      item_name: item.name,
      expected_qty: item.qty,
      received_qty: 0,
    }));

    await (supabase.from as any)("purchase_order_items").insert(lineItems);
  }

  revalidatePath("/management/merch/pos");
  revalidatePath("/management/merch/reorder");
  return { success: true };
}

export async function updateReorderPointAction(productId: string, newPoint: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "UNAUTHORIZED" };

  const { error } = await supabase.from("products").update({ reorder_point: newPoint }).eq("id", productId);
  if (error) return { error: error.message };

  revalidatePath("/management/merch/reorder");
  return { success: true };
}
export async function updateProductSupplierAction(productId: string, supplierId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "UNAUTHORIZED" };

  const { error } = await supabase.from("products").update({ supplier_id: supplierId }).eq("id", productId);
  if (error) return { error: error.message };

  revalidatePath("/management/merch/reorder");
  revalidatePath("/management/merch/catalog");
  return { success: true };
}

export async function updateProductAction(productId: string, payload: {
  name?: string;
  sku?: string | null;
  category?: string;
  unit?: string;
  cost_price?: number | null;
  is_active?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "UNAUTHORIZED" };

  const updates: any = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.sku !== undefined) updates.sku = payload.sku;
  if (payload.category !== undefined) updates.product_category = payload.category;
  if (payload.unit !== undefined) updates.unit_of_measure = payload.unit;
  if (payload.cost_price !== undefined) updates.cost_price = payload.cost_price;
  if (payload.is_active !== undefined) updates.is_active = payload.is_active;

  const { error } = await supabase.from("products").update(updates).eq("id", productId);
  if (error) return { error: error.message };

  revalidatePath("/management/merch/catalog");
  return { success: true };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitFnbOrder(cartItems: { menu_item_id: string; quantity: number; unit_price: number; linked_product_id: string | null }[], totalAmount: number, promoCodeId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  if (promoCodeId) {
    const { data: promo, error: promoErr } = await supabase.from("promo_codes").select("current_uses, max_uses, status").eq("id", promoCodeId).single();
    if (promoErr || !promo || promo.status !== 'active') throw new Error("Promo code invalid or exhausted.");
    if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) throw new Error("Promo code usage limit exceeded.");
    
    const { error: promoUpdateErr } = await supabase.from("promo_codes").update({ current_uses: (promo.current_uses || 0) + 1 }).eq("id", promoCodeId);
    if (promoUpdateErr) throw new Error("Failed to process promo tracking.");
  }

  const { data: order, error: orderErr } = await supabase
    .from("fnb_orders")
    .insert({
      status: "preparing", // Structural constraint to bypass insert race-condition
      total_amount: totalAmount,
      created_by: user.id
    })
    .select()
    .single();

  if (orderErr) throw new Error("Failed to create order: " + orderErr.message);

  const mappedItems = cartItems.map(item => ({
    order_id: order.id,
    menu_item_id: item.menu_item_id,
    quantity: item.quantity,
    unit_price: item.unit_price
  }));

  const { error: itemsErr } = await supabase.from("fnb_order_items").insert(mappedItems);
  if (itemsErr) throw new Error("Failed to create order items: " + itemsErr.message);

  revalidatePath("/crew/fnb/pos");
  revalidatePath("/crew/fnb/active-orders");

  return { success: true, orderId: order.id };
}

export async function completeFnbOrder(orderId: string) {
  const supabase = await createClient();

  // This operation mathematically fires the trg_fnb_inventory_deduction PostgreSQL Trigger inside the Cloud.
  const { error: updateErr } = await supabase
    .from("fnb_orders")
    .update({ 
      status: "completed", 
      completed_at: new Date().toISOString() 
    })
    .eq("id", orderId);

  if (updateErr) throw new Error("Failed to seal F&B Order: " + updateErr.message);

  revalidatePath("/crew/fnb/active-orders");
  return { success: true };
}

export async function validatePromoCode(code: string, subtotal: number) {
  const supabase = await createClient();
  const { data: promo, error } = await supabase.from("promo_codes").select("*").ilike("code", code).single();
  
  if (error || !promo) return { error: "Invalid Object reference or failed resolution." };
  if (promo.status !== "active") return { error: "Code inactive." };
  if (promo.max_uses && promo.current_uses >= promo.max_uses) return { error: "Exhausted utilization." };
  
  const now = new Date();
  if (promo.valid_from && new Date(promo.valid_from) > now) return { error: "Code bounds exception (Early)." };
  if (promo.valid_to && new Date(promo.valid_to) < now) return { error: "Code bounds exception (Expired)." };
  
  let discountAmount = 0;
  if (promo.discount_type === "percentage") {
    discountAmount = subtotal * ((promo.discount_value || 0) / 100);
  } else if (promo.discount_type === "fixed") {
    discountAmount = promo.discount_value || 0;
  }
  
  discountAmount = Math.min(discountAmount, subtotal); 
  
  return { 
    id: promo.id, 
    discountAmount, 
    newTotal: subtotal - discountAmount,
    description: promo.description
  };
}



export async function submitRestockTask(locationId: string, items: { product_id: string, needed_qty: number }[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const tasks = items.map(i => ({
    product_id: i.product_id,
    location_id: locationId,
    needed_qty: i.needed_qty,
    priority: "normal" as "normal" | "high" | "critical",
    status: "pending" as "pending" | "in_progress" | "completed",
    created_by: user.id
  }));

  const { error } = await supabase.from("restock_tasks").insert(tasks);
  if (error) throw new Error("Failed to submit restock task: " + error.message);

  revalidatePath("/crew/fnb/restock");
  return { success: true };
}

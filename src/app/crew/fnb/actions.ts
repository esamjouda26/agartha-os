"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database.types";
import type { SearchableItem } from "../components/item-search-select";

// ── Types ──────────────────────────────────────────────────────────────
type FnbOrderItem = {
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  linked_product_id?: string | null;
};

// ── Fetch menu items as SearchableItems ────────────────────────────────
export async function getFnbMenuItems(): Promise<SearchableItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fnb_menu_items")
    .select("id, name, unit_price, menu_category, linked_product_id, is_active")
    .eq("is_active", true)
    .order("menu_category")
    .order("name");

  return (data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    price: item.unit_price,
    category: item.menu_category,
    raw: { linked_product_id: item.linked_product_id },
  }));
}

// ── Fetch products (correct FK target for restock_tasks.product_id) ────
export async function getRestockableProducts(): Promise<SearchableItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, product_category, unit_of_measure")
    .eq("is_active", true)
    .order("product_category")
    .order("name");

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.product_category,
    raw: { unit: p.unit_of_measure },
  }));
}

// ── Promo Code Validation ──────────────────────────────────────────────
export async function validatePromoCode(
  code: string,
  subtotal: number
): Promise<{
  id?: string;
  discountAmount?: number;
  description?: string | null;
  error?: string;
}> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("promo_codes")
    .select("id, code, discount_type, discount_value, status, valid_from, valid_to, max_uses, current_uses, description")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (!data) return { error: "Invalid promo code." };
  if (data.status !== "active") return { error: "Promo code is not active." };
  if (data.valid_from > now) return { error: "Promo code not yet valid." };
  if (data.valid_to < now) return { error: "Promo code has expired." };
  if (data.max_uses !== null && data.current_uses >= data.max_uses) {
    return { error: "Usage limit reached." };
  }

  const discountAmount =
    data.discount_type === "percentage"
      ? subtotal * (data.discount_value / 100)
      : Math.min(data.discount_value, subtotal);

  return {
    id: data.id,
    discountAmount: Math.round(discountAmount * 100) / 100,
    description: data.description,
  };
}

// ── Submit FnB Order ───────────────────────────────────────────────────
export async function submitFnbOrder(
  items: FnbOrderItem[],
  totalAmount: number,
  paymentMethod: "cash" | "card" | "face_id",
  promoId?: string | null
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const staffRole = user.app_metadata?.staff_role as string | undefined;
  if (staffRole !== "fnb_crew") throw new Error("Restricted to fnb_crew.");
  if (!items.length) throw new Error("Cart is empty.");

  const { data: order, error: orderErr } = await supabase
    .from("fnb_orders")
    .insert({
      status: "preparing",
      total_amount: totalAmount,
      payment_method: paymentMethod,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (orderErr || !order) throw new Error(orderErr?.message ?? "Order insert failed.");

  const { error: itemsErr } = await supabase.from("fnb_order_items").insert(
    items.map((i) => ({
      order_id: order.id,
      menu_item_id: i.menu_item_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }))
  );

  if (itemsErr) throw new Error("Line items failed: " + itemsErr.message);

  if (promoId) {
    // Atomic increment: read current_uses then increment by 1 (fire-and-forget)
    const { data: promo } = await supabase
      .from("promo_codes")
      .select("current_uses")
      .eq("id", promoId)
      .single();
    if (promo) {
      await supabase
        .from("promo_codes")
        .update({ current_uses: promo.current_uses + 1 })
        .eq("id", promoId);
    }
  }

  revalidatePath("/crew/fnb/active-orders");
}

// ── Fetch active orders for kitchen display ────────────────────────────
export async function getActiveOrders() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("fnb_orders")
    .select(`
      id, created_at, zone_label,
      fnb_order_items (
        id, quantity, unit_price,
        fnb_menu_items ( id, name, linked_product_id )
      )
    `)
    .eq("status", "preparing")
    .order("created_at", { ascending: true });

  return data ?? [];
}

// ── Mark order complete (kitchen) ─────────────────────────────────────
export async function markOrderComplete(orderId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("fnb_orders")
    .update({ status: "completed", completed_at: new Date().toISOString(), prepared_by: user.id })
    .eq("id", orderId)
    .eq("status", "preparing"); // guard: only transition from preparing

  if (error) throw new Error(error.message);
  revalidatePath("/crew/fnb/active-orders");
}

// ── Restock: fetch last 10 tasks ───────────────────────────────────────
export async function getMyRestockTasks() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("restock_tasks")
    .select("id, status, priority, needed_qty, created_at, product_id, products(name)")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return data ?? [];
}

// ── Restock: submit request (one row per product) ─────────────────────
export async function submitRestockRequest(
  cartItems: { product_id: string; needed_qty: number }[]
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const role = user.app_metadata?.staff_role as string | undefined;
  const allowed = ["fnb_crew", "giftshop_crew", "health_crew", "cleaning_crew"];
  if (!role || !allowed.includes(role)) throw new Error("Not authorized to submit restock.");

  if (!cartItems.length) throw new Error("Restock cart is empty.");

  // Resolve FnB default location — same source of truth used for ingredient deduction on order completion
  const { data: fnbLocation } = await supabase
    .from("locations")
    .select("id")
    .eq("is_fnb_default", true)
    .limit(1)
    .maybeSingle();

  if (!fnbLocation) throw new Error("FnB default location is not configured. Contact your administrator.");

  const { error } = await supabase.from("restock_tasks").insert(
    cartItems.map((item) => ({
      product_id: item.product_id,
      needed_qty: item.needed_qty,
      location_id: fnbLocation.id,
      priority: "normal" as Database["public"]["Enums"]["restock_priority"],
      created_by: user.id,
    }))
  );

  if (error) throw new Error(error.message);
  revalidatePath("/crew/fnb/restock");
}

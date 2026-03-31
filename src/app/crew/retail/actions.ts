"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SearchableItem } from "@/app/crew/components/item-search-select";

// ── Retail Catalog → SearchableItem (for POS) ──────────────────────────
export async function getRetailCatalogItems(): Promise<SearchableItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("retail_catalog")
    .select("id, selling_price, status, products(id, name, product_category, barcode)")
    .eq("status", "active")
    .order("id");

  return (data ?? []).map((row) => {
    const p = row.products as { id: string; name: string; product_category: string | null; barcode: string | null } | null;
    return {
      id: row.id,                        // retail_catalog.id — correct FK for order items
      name: p?.name ?? "Unknown Item",
      price: row.selling_price,
      category: p?.product_category ?? null,
      raw: {
        linked_product_id: p?.id ?? null,
        barcode: p?.barcode ?? null,
        selling_price: row.selling_price,
      },
    };
  });
}

// ── Restockable Products (products table — per user spec) ───────────────
export async function getRetailRestockableProducts(): Promise<SearchableItem[]> {
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

// ── My Restock Tasks (for history list) ────────────────────────────────
export async function getMyRetailRestockTasks() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("restock_tasks")
    .select("id, status, priority, needed_qty, created_at, product_id, products(name)")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(15);

  return (data ?? []) as {
    id: string;
    status: string;
    priority: string;
    needed_qty: number;
    created_at: string;
    product_id: string;
    products: { name: string } | null;
  }[];
}

// ── Submit Retail Order ─────────────────────────────────────────────────
export async function submitRetailOrder(
  cart: { catalog_id: string; quantity: number; unit_price: number }[],
  paymentMethod: "cash" | "card" | "face_id"
): Promise<{ orderId: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "giftshop_crew") throw new Error("Restricted to giftshop_crew.");

  if (!cart.length) throw new Error("Cart is empty.");

  const total = cart.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  const { data: order, error: orderErr } = await supabase
    .from("retail_orders")
    .insert({ status: "paid", total_amount: total, created_by: user.id })
    .select("id")
    .single();

  if (orderErr || !order) throw new Error(orderErr?.message ?? "Order creation failed.");

  const { error: itemsErr } = await supabase.from("retail_order_items").insert(
    cart.map((i) => ({
      order_id: order.id,
      retail_catalog_id: i.catalog_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }))
  );

  if (itemsErr) throw new Error(itemsErr.message);

  // Payment method is UI-only — no column on retail_orders, consistent with retail schema
  void paymentMethod;

  revalidatePath("/crew/retail/pos");
  return { orderId: order.id };
}

// ── Submit Retail Restock ───────────────────────────────────────────────
export async function submitRetailRestockRequest(
  cartItems: { product_id: string; needed_qty: number }[]
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "giftshop_crew") throw new Error("Restricted to giftshop_crew.");

  if (!cartItems.length) throw new Error("Restock cart is empty.");

  const { data: retailLocation } = await supabase
    .from("locations")
    .select("id")
    .eq("is_retail_default", true)
    .limit(1)
    .maybeSingle();

  if (!retailLocation) throw new Error("Retail default location not configured. Contact your administrator.");

  const { error } = await supabase.from("restock_tasks").insert(
    cartItems.map((item) => ({
      product_id: item.product_id,
      needed_qty: item.needed_qty,
      location_id: retailLocation.id,
      priority: "normal" as const,
      created_by: user.id,
    }))
  );

  if (error) throw new Error(error.message);
  revalidatePath("/crew/retail/restock");
}

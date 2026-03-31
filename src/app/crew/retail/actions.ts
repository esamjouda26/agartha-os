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
  paymentMethod: "cash" | "card" | "face_id",
  bookingId?: string | null,
  promoCode?: string | null
): Promise<{ orderId: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "giftshop_crew" && role !== "fnb_manager") throw new Error("Restricted to retail authorized roles.");

  if (!cart.length) throw new Error("Cart is empty.");

  const catalogIds = cart.map((i) => i.catalog_id);

  // Query retail_catalog strictly on the server to retrieve the immutable selling_price.
  const { data: serverCatalog, error: catErr } = await supabase
    .from("retail_catalog")
    .select("id, selling_price")
    .in("id", catalogIds)
    .eq("is_active", true);

  if (catErr || !serverCatalog) throw new Error("Catalog fetch error.");

  const verifiedItems: { catalog_id: string; quantity: number }[] = [];

  for (const item of cart) {
    const catalogEntry = serverCatalog.find(c => c.id === item.catalog_id);
    if (!catalogEntry) throw new Error(`Invalid or inactive catalog item: ${item.catalog_id}`);
    
    verifiedItems.push({
      catalog_id: item.catalog_id,
      quantity: item.quantity
    });
  }

  // Enforce transaction atomicity when inserting into retail_orders and retail_order_items.
  const { data: orderId, error: rpcErr } = await supabase.rpc("submit_retail_order", {
     p_items: verifiedItems,
     p_payment_method: paymentMethod,
     p_user_id: user.id,
     p_booking_id: bookingId || null,
     p_promo_code: promoCode || null
  });

  if (rpcErr || !orderId) throw new Error(rpcErr?.message ?? "Order creation failed during transaction.");

  revalidatePath("/crew/retail/pos");
  return { orderId: orderId as string };
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

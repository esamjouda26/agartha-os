"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

// ── Stock Locations ─────────────────────────────────────────────────────────

export async function fetchStockLocationsAction() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stock_locations")
    .select("id, name, is_sink")
    .order("name");
  return data ?? [];
}

// ── Products with per-location stock levels ──────────────────────────────────

export async function fetchProductsWithStockAction(search?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id, name, sku, barcode, category, unit, reorder_point, is_active, product_stock_levels(id, location_id, current_qty, max_qty)")
    .eq("is_active", true)
    .order("name");

  if (search) query = query.ilike("name", `%${search}%`);

  const { data } = await query;
  return data ?? [];
}

// ── Inventory Transfers ─────────────────────────────────────────────────────

export async function fetchTransfersAction() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_transfers")
    .select(`
      id, source_location_id, dest_location_id, assigned_runner_id, status, notes, created_at, updated_at, created_by,
      inventory_transfer_items(id, product_id, quantity, products:product_id(name)),
      source:source_location_id(name, is_sink),
      dest:dest_location_id(name, is_sink)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

export async function createTransferAction(params: {
  source_location_id: string;
  dest_location_id: string;
  assigned_runner_id: string | null;
  notes: string | null;
  items: { product_id: string; quantity: number }[];
}) {
  const caller = await requireRole("management");
  if (!caller) return { success: false, error: "FORBIDDEN" };

  const supabase = await createClient();

  // 1. Create the transfer header
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: transfer, error: transferError } = await (supabase.from as any)("inventory_transfers").insert({
    source_location_id: params.source_location_id,
    dest_location_id: params.dest_location_id,
    assigned_runner_id: params.assigned_runner_id,
    status: params.assigned_runner_id ? "pending" : "completed",
    notes: params.notes,
    created_by: caller.id,
  }).select("id").single();

  if (transferError) return { success: false, error: transferError.message };

  // 2. Insert transfer items
  const items = params.items.map((item) => ({
    transfer_id: transfer.id,
    product_id: item.product_id,
    quantity: item.quantity,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsError } = await (supabase.from as any)("inventory_transfer_items").insert(items);
  if (itemsError) return { success: false, error: itemsError.message };

  revalidatePath("/management/inventory/transfers");
  return { success: true, transferId: transfer.id };
}

// ── Item Ledger ─────────────────────────────────────────────────────────────

export async function fetchItemLedgerAction(productId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_ledger")
    .select("id, product_id, location_id, quantity_delta, transaction_type, reference_id, performed_by, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(30);

  return data ?? [];
}

// ── Runners (staff with runner_crew role) ────────────────────────────────────

export async function fetchRunnersAction() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff_records")
    .select("id, employee_id, legal_name")
    .eq("role", "runner_crew")
    .eq("employment_status", "active")
    .order("legal_name");

  return data ?? [];
}

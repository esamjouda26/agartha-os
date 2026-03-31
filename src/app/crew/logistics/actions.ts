"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database.types";

type RestockStatus = Database["public"]["Enums"]["restock_status"];
type PoStatus = Database["public"]["Enums"]["po_status"];

// ── Auth helper ──────────────────────────────────────────────────────────
async function requireRunnerCrew() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const role = user.app_metadata?.staff_role as string | undefined;
  if (role !== "runner_crew") throw new Error("Restricted to runner_crew.");
  return { supabase, user };
}

// ════════════════════════════════════════════════════════════════════════
// RESTOCK QUEUE
// ════════════════════════════════════════════════════════════════════════

export async function getPendingRestockTasks() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restock_tasks")
    .select(`
      id, status, priority, needed_qty, created_at,
      product_id, products(name, unit_of_measure),
      location_id, locations(name)
    `)
    .in("status", ["pending", "in_progress"])
    .order("priority", { ascending: false })
    .order("created_at");

  return (data ?? []) as {
    id: string;
    status: RestockStatus;
    priority: string;
    needed_qty: number;
    created_at: string;
    product_id: string;
    products: { name: string; unit_of_measure: string | null } | null;
    location_id: string;
    locations: { name: string } | null;
  }[];
}

export async function acceptRestockTask(taskId: string): Promise<void> {
  const { supabase, user } = await requireRunnerCrew();
  const { error } = await supabase
    .from("restock_tasks")
    .update({ status: "in_progress", assigned_to: user.id })
    .eq("id", taskId)
    .eq("status", "pending"); // optimistic concurrency — only accept if still pending
  if (error) throw new Error(error.message);
  revalidatePath("/crew/logistics/restock-queue");
}

export async function completeRestockTask(
  taskId: string,
  deliveryPhotoUrl: string | null,
  zoneScanProof: string | null
): Promise<void> {
  const { supabase } = await requireRunnerCrew();

  // Fetch task details to update product_stock_levels
  const { data: task } = await supabase
    .from("restock_tasks")
    .select("product_id, location_id, needed_qty")
    .eq("id", taskId)
    .single();

  if (!task) throw new Error("Task not found.");

  const { error } = await supabase
    .from("restock_tasks")
    .update({
      status: "completed",
      delivery_photo_url: deliveryPhotoUrl,
      zone_scan_proof: zoneScanProof,
    })
    .eq("id", taskId);

  if (error) throw new Error(error.message);

  // Update product_stock_levels at delivery location
  const { data: stockLevel } = await supabase
    .from("product_stock_levels")
    .select("id, current_qty")
    .eq("product_id", task.product_id)
    .eq("location_id", task.location_id)
    .maybeSingle();

  if (stockLevel) {
    await supabase
      .from("product_stock_levels")
      .update({ current_qty: stockLevel.current_qty + task.needed_qty })
      .eq("id", stockLevel.id);
  } else {
    await supabase.from("product_stock_levels").insert({
      product_id: task.product_id,
      location_id: task.location_id,
      current_qty: task.needed_qty,
    });
  }

  revalidatePath("/crew/logistics/restock-queue");
}

// ════════════════════════════════════════════════════════════════════════
// PO RECEIVING
// ════════════════════════════════════════════════════════════════════════

export async function getSentPurchaseOrders() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_orders")
    .select(`
      id, status, notes, created_at, total_amount,
      suppliers(name),
      purchase_order_items(id, item_name, expected_qty, received_qty, unit, barcode, product_id)
    `)
    .eq("status", "sent")
    .order("created_at", { ascending: false });

  return (data ?? []) as {
    id: string;
    status: PoStatus;
    notes: string | null;
    created_at: string;
    total_amount: number | null;
    suppliers: { name: string } | null;
    purchase_order_items: {
      id: string;
      item_name: string;
      expected_qty: number;
      received_qty: number;
      unit: string | null;
      barcode: string | null;
      product_id: string | null;
    }[];
  }[];
}

export async function submitPoReceiving(
  poId: string,
  lines: { itemId: string; received_qty: number }[]
): Promise<void> {
  const { supabase } = await requireRunnerCrew();

  // Update each line
  for (const line of lines) {
    await supabase
      .from("purchase_order_items")
      .update({ received_qty: line.received_qty })
      .eq("id", line.itemId);
  }

  // Determine new PO status: all received → completed, partial → partially_received
  const { data: items } = await supabase
    .from("purchase_order_items")
    .select("expected_qty, received_qty")
    .eq("po_id", poId);

  const allReceived = (items ?? []).every((i) => i.received_qty >= i.expected_qty);
  const newStatus: PoStatus = allReceived ? "completed" : "partially_received";

  await supabase.from("purchase_orders").update({ status: newStatus }).eq("id", poId);
  revalidatePath("/crew/logistics/po-receiving");
}

// ════════════════════════════════════════════════════════════════════════
// STOCK COUNTING (BLIND AUDIT)
// ════════════════════════════════════════════════════════════════════════

export async function getMyAuditTasks() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("inventory_audits")
    .select(`
      id, status, scheduled_date, notes,
      locations(name),
      inventory_audit_items(id, product_id, actual_qty, status, products(name, unit_of_measure))
    `)
    .in("status", ["pending", "in_progress"])
    .order("scheduled_date");

  return (data ?? []) as {
    id: string;
    status: string;
    scheduled_date: string;
    notes: string | null;
    locations: { name: string } | null;
    inventory_audit_items: {
      id: string;
      product_id: string;
      actual_qty: number | null;
      status: string;
      products: { name: string; unit_of_measure: string | null } | null;
    }[];
  }[];
}

export async function submitAuditCount(
  auditItemId: string,
  actualQty: number
): Promise<void> {
  const { supabase, user } = await requireRunnerCrew();

  const { error } = await supabase
    .from("inventory_audit_items")
    .update({
      actual_qty: actualQty,
      status: "completed",
      counted_by: user.id,
    })
    .eq("id", auditItemId);

  if (error) throw new Error(error.message);
  revalidatePath("/crew/logistics/stock-counting");
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

// ── Stock Locations ─────────────────────────────────────────────────────────

export async function fetchStockLocationsAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("id, name, can_hold_inventory, allowed_categories")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("fetchStockLocationsAction error:", error);
    return [];
  }

  return (data || []).map((loc: any) => ({
    id: loc.id,
    name: loc.name,
    can_hold_inventory: loc.can_hold_inventory,
    allowed_categories: loc.allowed_categories || [],
    is_sink: !loc.can_hold_inventory
  }));
}

// ── Products with per-location stock levels ──────────────────────────────────

export async function fetchProductsWithStockAction(search?: string, page: number = 1, limit: number = 50) {
  const supabase = await createClient();
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("products")
    .select("id, name, sku, barcode, product_category, unit_of_measure, reorder_point, is_active, product_stock_levels(id, location_id, current_qty, max_qty)", { count: "exact" })
    .eq("is_active", true)
    .order("name")
    .range(from, to);

  if (search) query = query.ilike("name", `%${search}%`);

  const { data, count } = await query;
  return { products: data ?? [], count: count ?? 0 };
}

// ── Update Stock Policies ───────────────────────────────────────────────────

export async function updateStockPolicyAction(payload: { productId: string; locationId: string; maxQty: number | null }[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "UNAUTHORIZED" };

  const staffRole = (user.app_metadata?.staff_role as string) ?? null;
  if (!['it_admin', 'business_admin', 'inventory_manager', 'operations_manager'].includes(staffRole)) {
    return { success: false, error: "FORBIDDEN: Invalid operational domain" };
  }

  // Update logic using upsert (since there's a constraint on product_id and location_id)
  // Assuming the primary key or unique constraint can handle this. Usually we just update or insert.
  // We first fetch existing levels to determine IDs for updates, or just use raw SQL if needed.
  // Since we rely on standard Supabase schema, a safe approach is mapping UPSERT explicitly:
  // Using an RPC or multiple requests if `upsert` isn't fully configured. For this refactor, we can map upserts.
  
  // Actually, we can just upsert the `product_stock_levels` directly:
  const upsertData = payload.map(item => ({
    // If ID is missing, we might need it for upsert, or the unique combo (product_id, location_id) must be configured in DB
    product_id: item.productId,
    location_id: item.locationId,
    max_qty: item.maxQty
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("product_stock_levels")
    .upsert(upsertData, { onConflict: "product_id, location_id" });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/management/inventory");
  return { success: true };
}

// ── Inventory Transfers ─────────────────────────────────────────────────────

export async function fetchTransfersAction() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_transfers")
    .select(`
      id, source_location_id, dest_location_id, assigned_runner_id, status, notes, created_at, updated_at, created_by,
      inventory_transfer_items(id, product_id, quantity, products:product_id(name)),
      source:locations!source_location_id(name, can_hold_inventory),
      dest:locations!dest_location_id(name, can_hold_inventory)
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "UNAUTHORIZED" };
  
  const staffRole = (user.app_metadata?.staff_role as string) ?? null;
  if (!['it_admin', 'business_admin', 'inventory_manager', 'operations_manager'].includes(staffRole)) {
    return { success: false, error: "FORBIDDEN: Invalid operational domain" };
  }
  const callerId = user.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: transfer, error: transferError } = await (supabase.from as any)("inventory_transfers").insert({
    source_location_id: params.source_location_id,
    dest_location_id: params.dest_location_id,
    assigned_runner_id: params.assigned_runner_id,
    status: params.assigned_runner_id ? "pending" : "completed",
    notes: params.notes,
    created_by: callerId,
  }).select("id").single();

  if (transferError) return { success: false, error: transferError.message };

  // 2. Insert transfer items
  const items = params.items.map((item) => ({
    transfer_id: transfer.id,
    product_id: item.product_id,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase.from("inventory_transfer_items").insert(items);
  if (itemsError) return { success: false, error: itemsError.message };

  if (!params.assigned_runner_id) {
    // Immediate completion - deduce stock physically
    for (const item of params.items) {
      // 1. Deduct from source
      const { data: sourceStock } = await supabase
        .from("product_stock_levels")
        .select("id, current_qty")
        .eq("product_id", item.product_id)
        .eq("location_id", params.source_location_id)
        .limit(1)
        .single();
      
      if (sourceStock) {
        await supabase
          .from("product_stock_levels")
          .update({ current_qty: Math.max(0, sourceStock.current_qty - item.quantity) })
          .eq("id", sourceStock.id);
      }

      // Record ledger out
      await supabase.from("inventory_ledger").insert({
        product_id: item.product_id,
        location_id: params.source_location_id,
        quantity_delta: -item.quantity,
        transaction_type: "transfer_out",
        reference_id: transfer.id,
        performed_by: callerId
      });

      // 2. Add to dest if it's not a sink
      const { data: destLoc } = await supabase.from("locations").select("can_hold_inventory").eq("id", params.dest_location_id).single();
      if (destLoc?.can_hold_inventory) {
        const { data: destStock } = await supabase
          .from("product_stock_levels")
          .select("id, current_qty")
          .eq("product_id", item.product_id)
          .eq("location_id", params.dest_location_id)
          .limit(1)
          .single();

        if (destStock) {
          await supabase
            .from("product_stock_levels")
            .update({ current_qty: destStock.current_qty + item.quantity })
            .eq("id", destStock.id);
        } else {
          await supabase
            .from("product_stock_levels")
            .insert({
              product_id: item.product_id,
              location_id: params.dest_location_id,
              current_qty: item.quantity,
              max_qty: item.quantity * 2 // Default max
            });
        }
        
        // Record ledger in
        await supabase.from("inventory_ledger").insert({
          product_id: item.product_id,
          location_id: params.dest_location_id,
          quantity_delta: item.quantity,
          transaction_type: "transfer_in",
          reference_id: transfer.id,
          performed_by: callerId
        });
      }
    }
  }

  revalidatePath("/management/inventory/transfers");
  return { success: true, transferId: transfer.id };
}

export async function completeTransferAction(transferId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "UNAUTHORIZED" };

  const { data: transfer, error: err } = await supabase
    .from("inventory_transfers")
    .select("status, source_location_id, dest_location_id")
    .eq("id", transferId)
    .single();

  if (err || !transfer) return { success: false, error: "Transfer not found." };
  if (transfer.status === "completed") return { success: false, error: "Already completed." };

  const { data: items } = await supabase
    .from("inventory_transfer_items")
    .select("product_id, quantity")
    .eq("transfer_id", transferId);

  if (items && items.length > 0) {
    for (const item of items) {
      // Deduct source
      const { data: sourceStock } = await supabase.from("product_stock_levels")
        .select("id, current_qty").eq("product_id", item.product_id).eq("location_id", transfer.source_location_id).single();
      if (sourceStock) {
        await supabase.from("product_stock_levels").update({ current_qty: Math.max(0, sourceStock.current_qty - item.quantity) }).eq("id", sourceStock.id);
      }
      await supabase.from("inventory_ledger").insert({
        product_id: item.product_id, location_id: transfer.source_location_id, quantity_delta: -item.quantity, transaction_type: "transfer_out", reference_id: transferId, performed_by: user.id
      });

      // Add to dest
      const { data: destLoc } = await supabase.from("locations").select("can_hold_inventory").eq("id", transfer.dest_location_id).single();
      if (destLoc?.can_hold_inventory) {
        const { data: destStock } = await supabase.from("product_stock_levels")
          .select("id, current_qty").eq("product_id", item.product_id).eq("location_id", transfer.dest_location_id).single();
        if (destStock) {
          await supabase.from("product_stock_levels").update({ current_qty: destStock.current_qty + item.quantity }).eq("id", destStock.id);
        } else {
          await supabase.from("product_stock_levels").insert({ product_id: item.product_id, location_id: transfer.dest_location_id, current_qty: item.quantity, max_qty: item.quantity * 2 });
        }
        await supabase.from("inventory_ledger").insert({
          product_id: item.product_id, location_id: transfer.dest_location_id, quantity_delta: item.quantity, transaction_type: "transfer_in", reference_id: transferId, performed_by: user.id
        });
      }
    }
  }

  await supabase.from("inventory_transfers").update({ status: "completed" }).eq("id", transferId);
  revalidatePath("/management/inventory/transfers");
  return { success: true };
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

// ── Audits & Reconciliations ────────────────────────────────────────────────

export async function fetchAuditsAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_audits")
    .select(`
      id,
      scheduled_date,
      status,
      notes,
      location:locations(name),
      runner:staff_records!inventory_audits_created_by_fkey(legal_name),
      items:inventory_audit_items(expected_qty, actual_qty)
    `)
    .order("scheduled_date", { ascending: false });

  if (error) {
    console.error("fetchAuditsAction error:", error);
    return [];
  }

  // Transform the response into the UI shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((audit: any) => {
    // Calculate variance
    let expectedSum: number | null = null;
    let countedSum: number | null = null;
    let varianceRm: number | null = null; // We'd need actual cost for real RM variance. We mock the structure here based on DB items.
    let hasVariance = false;

    if (audit.items && audit.items.length > 0) {
      expectedSum = 0;
      countedSum = 0;
      varianceRm = 0;
      audit.items.forEach((item: any) => {
        if (item.expected_qty !== null) expectedSum = (expectedSum || 0) + item.expected_qty;
        if (item.actual_qty !== null) {
          countedSum = (countedSum || 0) + item.actual_qty;
          const diff = item.actual_qty - (item.expected_qty || 0);
          varianceRm = (varianceRm || 0) + (diff * 15.50); // Mock average unit cost for demo display since cost isn't in DB yet
          if (diff !== 0) hasVariance = true;
        }
      });
    }

    return {
      id: audit.id,
      date: new Date(audit.scheduled_date).toLocaleDateString(),
      location: audit.location?.name || "Unknown",
      scope: audit.notes || "Full Location Count",
      runner: audit.runner?.legal_name || "Auto-Assign",
      expectedQty: expectedSum,
      countedQty: countedSum,
      varianceRm: varianceRm,
      status: audit.status === "scheduled" ? "Scheduled" :
              audit.status === "in_progress" ? "Active" :
              audit.status === "completed" && hasVariance ? "Needs Reconciliation" :
              audit.status === "completed" ? "Closed" : "Scheduled",
      hasVariance
    };
  });
}

export async function fetchAuditItemsAction(auditId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_audit_items")
    .select(`
      id,
      expected_qty,
      actual_qty,
      product:products(id, name)
    `)
    .eq("audit_id", auditId);

  if (error) {
    console.error("fetchAuditItemsAction error:", error);
    return [];
  }

  // Transform into the UI ReconItem shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((item: any) => ({
    id: item.product?.id || "unknown",
    name: item.product?.name || "Unknown Product",
    expected: item.expected_qty || 0,
    counted: item.actual_qty || 0,
    costPerUnit: 15.50 // Mocking cost as it doesn't exist on product table directly
  }));
}

export async function reconcileAuditAction(auditId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "UNAUTHORIZED" };

  const { data: audit, error: auditErr } = await supabase.from("inventory_audits").select("location_id, status").eq("id", auditId).single();
  if (auditErr || !audit) return { success: false, error: "Audit not found." };
  
  if (audit.status === "completed") {
      return { success: false, error: "Audit is already reconciled." };
  }

  const { data: items } = await supabase.from("inventory_audit_items").select("product_id, expected_qty, actual_qty").eq("audit_id", auditId);

  if (items && items.length > 0) {
    for (const item of items) {
      if (item.actual_qty !== null && item.expected_qty !== null) {
        const diff = item.actual_qty - item.expected_qty;
        if (diff !== 0) {
          // fetch current
          const { data: stockLevel } = await supabase
            .from("product_stock_levels")
            .select("id, current_qty")
            .eq("product_id", item.product_id)
            .eq("location_id", audit.location_id)
            .limit(1)
            .single();

          if (stockLevel) {
            await supabase
              .from("product_stock_levels")
              .update({ current_qty: Math.max(0, stockLevel.current_qty + diff) })
              .eq("id", stockLevel.id);
          } else {
            // Edge case
            await supabase.from("product_stock_levels").insert({
              product_id: item.product_id,
              location_id: audit.location_id,
              current_qty: Math.max(0, diff),
              max_qty: Math.max(0, diff) * 2 // defaulting
            });
          }

          await supabase.from("inventory_ledger").insert({
            product_id: item.product_id,
            location_id: audit.location_id,
            quantity_delta: diff,
            transaction_type: "audit_adjustment",
            reference_id: auditId,
            performed_by: user.id
          });
        }
      }
    }
  }

  await supabase.from("inventory_audits").update({ status: "completed" }).eq("id", auditId);
  revalidatePath("/management/inventory/audits");
  return { success: true };
}

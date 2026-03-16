"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Types ───────────────────────────────────────────────────────────────────

export interface ScanResult {
  booking_ref: string;
  booker_name: string;
  tier_name: string;
  adult_count: number;
  child_count: number;
  total_guests: number;
  checked_in_at: string;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Scan Ticket ─────────────────────────────────────────────────────────────

export async function scanTicketAction(
  qrCodeRef: string
): Promise<ActionResult<ScanResult>> {
  if (!qrCodeRef || qrCodeRef.trim().length < 5) {
    return { success: false, error: "Invalid QR code." };
  }

  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("rpc_scan_ticket", {
      p_qr_code_ref: qrCodeRef.trim(),
    });

    if (error) {
      const msg = (error as { message: string }).message;
      if (msg.includes("TICKET_NOT_FOUND")) return { success: false, error: "Ticket not found. Invalid QR code." };
      if (msg.includes("TICKET_ALREADY_USED")) return { success: false, error: "This ticket has already been scanned." };
      if (msg.includes("BOOKING_CANCELLED")) return { success: false, error: "This booking has been cancelled." };
      return { success: false, error: "Scan failed. Please try again." };
    }

    revalidatePath("/crew/check-in");
    return { success: true, data: data as ScanResult };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ── F&B POS ─────────────────────────────────────────────────────────────────

export interface PosOrderItem {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
}

export interface PosResult {
  order_id: string;
  total_amount: number;
  items_count: number;
}

export async function completePosOrderAction(
  items: PosOrderItem[],
  bookingId?: string,
  zoneLabel?: string
): Promise<ActionResult<PosResult>> {
  if (!items || items.length === 0) {
    return { success: false, error: "Cart is empty." };
  }

  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("rpc_complete_pos_order", {
      p_items: JSON.stringify(items.map((i) => ({
        menu_item_id: i.menuItemId,
        quantity: i.quantity,
        unit_price: i.unitPrice,
      }))),
      p_booking_id: bookingId ?? null,
      p_zone_label: zoneLabel ?? "Main Counter",
    });

    if (error) {
      const msg = (error as { message: string }).message;
      if (msg.includes("INSUFFICIENT_STOCK")) return { success: false, error: "Insufficient stock for one or more items." };
      if (msg.includes("MENU_ITEM_UNAVAILABLE")) return { success: false, error: "One or more menu items are unavailable." };
      return { success: false, error: "Order failed. Please try again." };
    }

    revalidatePath("/crew/fnb-pos");
    return { success: true, data: data as PosResult };
  } catch {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// ── Fetch F&B Menu ──────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  name: string;
  category: string;
  status: string;
  unit_price: number;
  linked_product_id: string | null;
}

export async function fetchMenuItemsAction(): Promise<MenuItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fnb_menu_items")
    .select("id, name, category, status, unit_price, linked_product_id")
    .eq("status", "available")
    .order("category") as { data: MenuItem[] | null };

  return data ?? [];
}

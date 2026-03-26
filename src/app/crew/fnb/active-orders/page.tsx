import { createClient } from "@/lib/supabase/server";
import ActiveOrdersClient from "./active-orders-client";

export default async function ActiveOrdersPage() {
  const supabase = await createClient();
  
  const { data: orders, error } = await supabase
    .from("fnb_orders")
    .select(`
      id,
      status,
      created_at,
      zone_label,
      notes,
      fnb_order_items (
        quantity,
        fnb_menu_items ( name )
      )
    `)
    .eq("status", "preparing")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("AUDIT ERROR: Failed to fetch active F&B orders:", error.message);
  }

  // Format the payload natively to bypass deeply nested TS complexity in the client
  const formattedOrders = (orders || []).map((o: any) => ({
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    zone_label: o.zone_label,
    notes: o.notes,
    items: o.fnb_order_items.map((item: any) => ({
      name: item.fnb_menu_items?.name || "Unknown Item",
      quantity: item.quantity
    }))
  }));

  return <ActiveOrdersClient orders={formattedOrders} />;
}

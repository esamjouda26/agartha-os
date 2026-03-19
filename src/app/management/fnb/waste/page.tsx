import { createClient } from "@/lib/supabase/server";
import WasteClient from "./waste-client";

/* ── Types ─────────────────────────────────────────────────────────── */
export interface WasteRow {
  id: string;
  item_name: string;
  category: string | null;
  location: string | null;
  supplier_name: string | null;
  reason: string;
  quantity: number;
  unit: string | null;
  cost_impact: number;
  logged_at: string;
}

/* ── Page (Server Component) ──────────────────────────────────────── */
export default async function FnBWastePrepPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fnb_waste_log")
    .select(`
      id, 
      quantity, 
      reason, 
      notes,
      created_at,
      fnb_menu_items (
        name,
        menu_category,
        unit_price
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Waste Log Error:", error);
  }

  const formattedLogs: WasteRow[] = (data || []).map((row: any) => {
    const item = row.fnb_menu_items || {};
    const cost = item.unit_price || 0;
    
    return {
      id: row.id,
      item_name: item.name || "Unknown Item",
      category: item.menu_category || "Prepared Item",
      location: null, // Sink locations aren't directly tracked per item in waste context purely here
      supplier_name: null, // Assembled 
      reason: row.reason,
      quantity: row.quantity,
      unit: "units", // Default assumptions based on schema
      cost_impact: cost * row.quantity,
      logged_at: row.created_at,
    };
  });
  const { data: menuData } = await supabase
    .from("fnb_menu_items")
    .select("id, name, menu_category, unit_price")
    .eq("status", "available");

  const menuItems: any[] = (menuData || []).map((m: any) => ({
    id: m.id,
    name: m.name,
    category: m.menu_category,
    price: m.unit_price,
  }));

  const { data: locData } = await supabase.from("locations").select("id, name");
  const locations = locData || [];

  return <WasteClient wasteLogs={formattedLogs} menuItems={menuItems} locations={locations} />;
}

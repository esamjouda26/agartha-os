import { createClient } from "@/lib/supabase/server";
import IncidentFormClient from "./incident-form-client";

export default async function IncidentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.app_metadata?.staff_role as string | undefined) ?? "service_crew";

  // Pre-fetch items to enable Standardized Item Selection UI in incident reporting
  const { data: menuItems } = await supabase
    .from("fnb_menu_items")
    .select(`
      id,
      name,
      menu_category,
      products ( barcode )
    `)
    .eq("is_active", true);

  const formattedItems = (menuItems || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    category: item.menu_category || "Uncategorized",
    barcode: item.products?.barcode || null,
  }));

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="glass-panel-gold p-6 rounded-2xl shadow-lg border border-[#d4af37]/30">
        <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold mb-2">Log Incident</h1>
        <p className="text-sm text-gray-400 mb-6">Select a category to report an issue dynamically routed to Operations.</p>
        
        <IncidentFormClient role={role} searchableItems={formattedItems} />
      </div>
    </div>
  );
}

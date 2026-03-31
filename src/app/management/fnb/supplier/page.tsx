import { createClient } from "@/lib/supabase/server";
import SupplierPerfClient from "./supplier-perf-client";

export interface EnrichedSupplierData {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
  volumeReceived: number;
  rejectionWaste: number;
  yield: number;
  status: "optimal" | "warning" | "critical";
  unit: string;
}

export default async function FnBSupplierPage() {
  const supabase = await createClient();

  // 1. Fetch all active suppliers
  const { data: rawSuppliers } = await supabase
    .from("suppliers")
    .select("id, name, category, is_active")
    .order("name");

  if (!rawSuppliers) {
    return <SupplierPerfClient suppliers={[]} />;
  }

  // 2. Fetch all products to map product -> supplier_id
  const { data: rawProducts } = await supabase
    .from("products")
    .select("id, supplier_id, unit_of_measure");

  // product_id -> supplier_id map
  const productSupplierMap: Record<string, string> = {};
  const productUnitMap: Record<string, string> = {};
  (rawProducts || []).forEach(p => {
    if (p.supplier_id) {
      productSupplierMap[p.id] = p.supplier_id;
      productUnitMap[p.id] = p.unit_of_measure || "units";
    }
  });

  // 3. Aggregate Total Received Volume per Supplier from POs
  const { data: poItems } = await supabase
    .from("purchase_order_items")
    .select("product_id, received_qty");
    
  const supplierVolumes: Record<string, number> = {};
  const supplierUnits: Record<string, string> = {}; // Track primary unit

  (poItems || []).forEach(item => {
    const sId = productSupplierMap[item.product_id];
    if (sId) {
      if (!supplierVolumes[sId]) supplierVolumes[sId] = 0;
      supplierVolumes[sId] += (item.received_qty || 0);
      supplierUnits[sId] = productUnitMap[item.product_id] || "units"; // optimistic unit inherit
    }
  });

  // 4. Aggregate Rejection / Waste from Incidents
  // food_waste, damaged_merchandise are standard identifiers
  const { data: incidents } = await supabase
    .from("incidents")
    .select("category, metadata")
    .in("category", ["food_waste", "damaged_merchandise", "spill", "quality_rejection"]);

  const supplierWaste: Record<string, number> = {};

  (incidents || []).forEach(inc => {
    // Check if metadata contains a valid linked product_id and quantity
    if (inc.metadata && typeof inc.metadata === 'object' && !Array.isArray(inc.metadata)) {
      const pid = inc.metadata.product_id;
      const qty = parseFloat(inc.metadata.quantity) || 0;
      
      if (pid && qty > 0) {
        const sId = productSupplierMap[pid];
        if (sId) {
          if (!supplierWaste[sId]) supplierWaste[sId] = 0;
          supplierWaste[sId] += qty;
        }
      }
    }
  });

  // 5. Connect the data into the structured supplier objects
  const finalSuppliers: EnrichedSupplierData[] = rawSuppliers.map(s => {
    const recv = supplierVolumes[s.id] || 0;
    const waste = supplierWaste[s.id] || 0;
    const unit = supplierUnits[s.id] || "units";

    let yieldPct = 100; // Perfect yield by default
    if (recv > 0) {
      // It's technically possible for waste to be discovered from an older PO shipment, yielding > recv for a single timeframe.
      // Use Max to bound the floor to 0%
      yieldPct = Math.max(0, ((recv - waste) / recv) * 100);
    } else if (waste > 0 && recv === 0) {
      // Had waste but 0 received in this query window (or lifetime if total)
      yieldPct = 0;
    }

    const health: "optimal" | "warning" | "critical" = 
      yieldPct >= 95 ? "optimal" : 
      yieldPct >= 85 ? "warning" : 
      "critical";

    return {
      id: s.id,
      name: s.name,
      category: s.category || "General",
      is_active: s.is_active,
      volumeReceived: recv,
      rejectionWaste: waste,
      yield: Math.round(yieldPct * 10) / 10,
      status: health,
      unit: unit
    };
  });

  return <SupplierPerfClient suppliers={finalSuppliers} />;
}

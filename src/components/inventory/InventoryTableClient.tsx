"use client";

import { useState, useTransition } from "react";
import { Search, Layers, AlertTriangle, CheckCircle2, Database, X, CopyCheck, Boxes, ChevronLeft, ChevronRight } from "lucide-react";
import { updateStockPolicyAction } from "@/app/management/inventory/actions";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import DomainAuditTable from "@/components/DomainAuditTable";

interface StockLevel { id: string; location_id: string; current_qty: number; max_qty: number | null }
interface Product {
  id: string; name: string; sku: string | null; barcode: string | null;
  product_category: string | null; unit_of_measure: string; reorder_point: number; is_active: boolean;
  product_stock_levels: StockLevel[];
}
interface StockLocation { id: string; name: string; is_sink: boolean; can_hold_inventory: boolean; allowed_categories: string[] }

function formatCategory(cat: string) {
  return cat.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function typeBadge(cat: string | null) {
  if (!cat) return <span className="text-gray-400 text-[10px]">—</span>;
  const formatted = formatCategory(cat);
  const m: Record<string, string> = {
    "Prepackaged Fnb": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Raw Ingredient": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Consumable": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "Retail Merch": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  const cls = m[formatted] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";
  return <span className={`px-2 py-0.5 rounded text-[10px] border font-sans ${cls}`}>{formatted}</span>;
}

export default function InventoryTableClient({
  products, locations, count, initialPage, search
}: { products: Product[], locations: StockLocation[], count: number, initialPage: number, search: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [localSearch, setLocalSearch] = useState(search);
  const [typeFilter, setTypeFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);
  const [bulkModal, setBulkModal] = useState(false);
  
  const [isPending, startTransition] = useTransition();

  const trackable = locations.filter((l) => !l.is_sink);

  const filtered = typeFilter === "all"
    ? products
    : products.filter((p) => p.product_category === typeFilter);

  const totalPages = Math.ceil(count / 50);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const configuredCount = products.filter((p) => p.product_stock_levels.some((sl) => sl.max_qty !== null)).length;
  const missingCount = products.filter((p) => !p.product_stock_levels.some((sl) => sl.max_qty !== null)).length;
  const totalGlobalMax = products.reduce((sum, p) => sum + p.product_stock_levels.reduce((s, sl) => s + (sl.max_qty ?? 0), 0), 0);

  function getMaxForLocation(p: Product, locId: string): number | null {
    return p.product_stock_levels.find((sl) => sl.location_id === locId)?.max_qty ?? null;
  }

  function isNA(p: Product, loc: StockLocation): boolean {
    if (!loc.can_hold_inventory) return true;
    if (!p.product_category) return false;
    return !loc.allowed_categories.includes(p.product_category);
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (localSearch) params.set("query", localSearch);
    else params.delete("query");
    params.set("page", "1");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const [bulkValues, setBulkValues] = useState<Record<string, string>>({});

  const applyBulkUpdate = () => {
    setBulkModal(false);
    
    const payload: { productId: string; locationId: string; maxQty: number | null }[] = [];
    
    filtered.forEach(p => {
      trackable.forEach(loc => {
        if (!isNA(p, loc) && bulkValues[loc.id] !== undefined && bulkValues[loc.id] !== "") {
          payload.push({
            productId: p.id,
            locationId: loc.id,
            maxQty: parseInt(bulkValues[loc.id])
          });
        }
      });
    });

    if (payload.length === 0) {
      showToast("No valid items to update");
      return;
    }

    startTransition(async () => {
      const res = await updateStockPolicyAction(payload);
      if (res.success) {
        showToast(`Bulk update applied to ${payload.length} policies.`);
        setBulkValues({});
      } else {
        showToast(`Failed: ${res.error}`);
      }
    });
  };

  const handleInlineUpdate = (product: Product, location: StockLocation, val: string) => {
    const maxQty = val === "" ? null : parseInt(val);
    startTransition(async () => {
      const res = await updateStockPolicyAction([{ productId: product.id, locationId: location.id, maxQty }]);
      if (res.success) showToast("Policy updated");
      else showToast(`Error updating metric`);
    });
  };

  const categories = [...new Set(products.map((p) => p.product_category).filter(Boolean))] as string[];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider">
            <Layers className="w-5 h-5 mr-2" /> Global Stock Policies
          </h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Master Configuration for Physical Capacity Ceilings</p>
        </div>
        <button onClick={() => setBulkModal(true)} disabled={isPending}
          className="bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold px-5 py-2.5 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all flex items-center text-sm uppercase tracking-widest disabled:opacity-50">
          <CopyCheck className="w-4 h-4 mr-2" /> {isPending ? "Syncing..." : "Bulk Policy Update"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tracked SKUs", value: count, icon: Boxes, color: "blue", val: "text-white" },
          { label: "Configured (Page)", value: configuredCount, icon: CheckCircle2, color: "green", val: "text-green-400" },
          { label: "Missing (Page)", value: missingCount, icon: AlertTriangle, color: "yellow", val: "text-yellow-400" },
          { label: "Total Global Max", value: totalGlobalMax.toLocaleString(), icon: Database, color: "gold", val: "text-[#d4af37]" },
        ].map((k) => {
          const Icon = k.icon;
          const border = k.color === "gold" ? "border-[#d4af37]/50" : `border-${k.color}-500/50`;
          const bg = k.color === "gold" ? "bg-[#d4af37]/10 border-[#d4af37]/20" : `bg-${k.color}-500/10 border-${k.color}-500/20`;
          const ic = k.color === "gold" ? "text-[#d4af37]" : `text-${k.color}-400`;
          return (
            <div key={k.label} className={`glass-panel rounded-lg p-4 border-l-2 ${border}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded border flex items-center justify-center ${bg}`}>
                  <Icon className={`w-4 h-4 ${ic}`} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{k.label}</p>
                  <p className={`text-xl font-orbitron font-bold ${k.val}`}>{k.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
          <form className="relative flex-1 max-w-md flex" onSubmit={handleSearch}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search by name, SKU, or Barcode..."
              value={localSearch} onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] transition-all" />
            <button type="submit" disabled={isPending} className="ml-2 bg-white/10 px-3 py-2 text-sm text-gray-200 rounded hover:bg-white/20 transition disabled:opacity-50">Go</button>
          </form>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[rgba(212,175,55,0.5)] cursor-pointer appearance-none">
            <option value="all">Type: All Items</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className={`overflow-x-auto flex-1 transition-opacity ${isPending ? "opacity-50" : "opacity-100"}`}>
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-16 text-sm">No products found.</p>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
                <tr>
                  <th className="px-4 py-4 font-semibold">Product Name</th>
                  <th className="px-4 py-4 font-semibold">SKU / Barcode</th>
                  <th className="px-4 py-4 font-semibold">Item Type</th>
                  <th className="px-4 py-4 font-semibold">UOM</th>
                  {trackable.map((loc) => (
                    <th key={loc.id} className="px-4 py-4 font-semibold text-center border-l border-white/5">Max {loc.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-4">
                      <p className="text-gray-200 font-bold font-sans tracking-wide">{p.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{p.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-4 text-gray-400">{p.sku || p.barcode || <span className="italic text-gray-600">N/A</span>}</td>
                    <td className="px-4 py-4">{typeBadge(p.product_category)}</td>
                    <td className="px-4 py-4 text-gray-400 font-sans">{p.unit_of_measure}</td>
                    {trackable.map((loc) => {
                      if (isNA(p, loc)) {
                        return <td key={loc.id} className="px-4 py-4 text-center border-l border-white/5"><span className="text-gray-600 text-xs italic">N/A</span></td>;
                      }
                      const maxQty = getMaxForLocation(p, loc.id);
                      return (
                        <td key={loc.id} className="px-4 py-4 text-center border-l border-white/5">
                          <input
                            type="number"
                            className="bg-transparent border border-transparent hover:border-[rgba(212,175,55,0.3)] hover:bg-[rgba(2,4,8,0.5)] focus:border-[rgba(212,175,55,0.5)] focus:bg-[#020408] focus:text-[#d4af37] focus:outline-none w-[70px] text-center px-2 py-1 rounded font-mono text-[13px] text-gray-200 transition-all"
                            defaultValue={maxQty ?? ""}
                            onBlur={(e) => {
                              if (e.target.value !== (maxQty?.toString() ?? "") && !(e.target.value === "" && maxQty === null)) {
                                handleInlineUpdate(p, loc, e.target.value);
                              }
                            }}
                            placeholder="—"
                            disabled={isPending}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 bg-[#020408] flex items-center justify-between text-sm">
            <span className="text-gray-500">Page {initialPage} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(initialPage - 1)} disabled={initialPage <= 1 || isPending}
                className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-50 transition">
                <ChevronLeft className="w-5 h-5 text-gray-300" />
              </button>
              <button 
                onClick={() => handlePageChange(initialPage + 1)} disabled={initialPage >= totalPages || isPending}
                className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-50 transition">
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      <DomainAuditTable entityTypes={["product"]} title="Inventory Audit Trail" />

      {/* ═══ BULK POLICY UPDATE MODAL ═══ */}
      {bulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm overflow-y-auto pt-10 pb-10" onClick={() => setBulkModal(false)}>
          <div className="glass-panel rounded-lg w-full max-w-lg border-[#d4af37]/30 shadow-[0_10px_40px_rgba(212,175,55,0.15)] flex flex-col my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider"><CopyCheck className="w-5 h-5 mr-2" /> Bulk Policy Update</h3>
              <button onClick={() => setBulkModal(false)} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded flex items-start gap-3">
                <span className="text-blue-400 text-sm mt-0.5">ℹ</span>
                <p className="text-xs text-blue-300">This will apply the specified max capacity limits to <strong>all items currently matching your active search/filter</strong>. Leave a field blank to skip updating it.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {trackable.map((loc) => (
                  <div key={loc.id} className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Max {loc.name} Qty</label>
                    <input type="number" placeholder="No Change"
                      value={bulkValues[loc.id] ?? ""}
                      onChange={(e) => setBulkValues({...bulkValues, [loc.id]: e.target.value})}
                      className="w-full bg-[#020408] border border-white/10 text-sm font-mono text-white rounded-md px-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] transition-all" />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 border-t border-white/10 bg-[#020408]/80 rounded-b-lg flex justify-end gap-3">
              <button onClick={() => setBulkModal(false)} className="px-4 py-2 text-sm font-medium rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={applyBulkUpdate} disabled={isPending}
                className="px-6 py-2 text-sm font-bold rounded bg-[rgba(212,175,55,0.2)] text-[#d4af37] border border-[rgba(212,175,55,0.5)] hover:bg-[#d4af37] hover:text-[#020408] transition-all shadow-[0_0_10px_rgba(212,175,55,0.2)] disabled:opacity-50">
                {isPending ? "Applying..." : "Apply Bulk Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 right-8 bg-green-500/20 border border-green-500/40 text-green-400 px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm text-sm font-semibold flex items-center gap-2 z-50 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" /><span>{toast}</span>
        </div>
      )}
    </div>
  );
}

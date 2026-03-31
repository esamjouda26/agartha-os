"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Package, Plus, Edit2, CheckCircle2, X } from "lucide-react";
import { createRetailCatalogItem, updateRetailCatalogItem } from "../retail-actions";

export interface RetailItemRow {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
  selling_price: number;
  cost_price: number;
  linked_product_id: string;
  description?: string | null;
}

export interface RetailEligibleProduct {
  id: string;
  name: string;
  cost_price: number;
}

function ProductSearch({
  value,
  onChange,
  products
}: {
  value: string;
  onChange: (id: string) => void;
  products: RetailEligibleProduct[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const selectedProd = products.find(p => p.id === value);
  const displayValue = selectedProd ? selectedProd.name : "";

  const filtered = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  return (
    <div className={`relative flex-1 text-xs ${open ? "z-50" : "z-10"}`}>
      {open && <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(""); }} />}
      <div 
        className="flex items-center bg-[#020408] border border-white/10 rounded px-3 py-2 cursor-pointer h-[42px] relative z-40"
        onClick={() => setOpen(!open)}
      >
        <span className={value ? "text-gray-300 truncate font-semibold" : "text-gray-500"}>
          {value ? displayValue : "-- Select Eligible Product --"}
        </span>
      </div>
      
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#020408] border border-white/10 rounded shadow-xl max-h-60 flex flex-col">
          <div className="p-2 border-b border-white/10">
            <input 
              autoFocus
              type="text" 
              placeholder="Search merchandise..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#010204] border border-white/10 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-[#d4af37]/50"
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1 custom-scrollbar max-h-48">
            {filtered.length === 0 ? (
              <div className="p-2 text-gray-500 text-xs text-center">No matches</div>
            ) : filtered.map(p => (
              <div 
                key={p.id}
                className="px-3 py-2 text-xs text-gray-300 hover:bg-[#d4af37]/10 hover:text-[#d4af37] cursor-pointer border-l-2 border-transparent hover:border-[#d4af37]"
                onClick={() => {
                  onChange(p.id);
                  setOpen(false);
                  setSearch("");
                }}
              >
                {p.name} <span className="text-gray-500">({p.cost_price ? `RM ${p.cost_price.toFixed(2)}` : 'N/A'})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function RetailCatalogClient({ 
  items, 
  products, 
  count, 
  initialPage 
}: { 
  items: RetailItemRow[]; 
  products: RetailEligibleProduct[];
  count: number;
  initialPage: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<RetailItemRow | null>(null);
  const [linkedProductId, setLinkedProductId] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState(0);
  const [publishToggle, setPublishToggle] = useState(true);
  const [itemCategory, setItemCategory] = useState("souvenirs");
  
  const [toast, setToast] = useState<string | null>(null);

  const openEditor = (item?: RetailItemRow) => {
    if (item) {
      setEditingItem(item);
      setLinkedProductId(item.linked_product_id);
      setSellingPrice(item.selling_price);
      setPublishToggle(item.is_active);
      setItemCategory(item.category || "souvenirs");
    } else {
      setEditingItem(null);
      setLinkedProductId("");
      setSellingPrice(0);
      setPublishToggle(true);
      setItemCategory("souvenirs");
    }
    setModalOpen(true);
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  /* Pagination Logic */
  const totalPages = Math.max(1, Math.ceil(count / 50));
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch = !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || (statusFilter === "available" && item.is_active) || (statusFilter === "archived" && !item.is_active);
      return matchSearch && matchStatus;
    });
  }, [items, search, statusFilter]);

  const activeCostPrice = editingItem?.cost_price ?? (products.find(p => p.id === linkedProductId)?.cost_price || 0);
  const activeMargin = sellingPrice > 0 ? ((sellingPrice - activeCostPrice) / sellingPrice) * 100 : 0;

  return (
    <div className="space-y-8 pb-10">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-end">
        <button onClick={() => openEditor()} className="bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold px-5 py-2.5 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all flex items-center text-sm uppercase tracking-widest">
          <Plus className="w-4 h-4 mr-2" /> Assign Catalog Item
        </button>
      </div>

      {/* ═══ Menu Table ═══ */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[600px]">
          {/* Toolbar */}
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Search retail catalog..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" />
            </div>
            <div className="flex items-center space-x-3">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                <option value="all">Status: All</option>
                <option value="available">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Item Name</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Base Cost (COGS)</th>
                  <th className="px-6 py-4 font-semibold">Margin %</th>
                  <th className="px-6 py-4 font-semibold text-[#d4af37]">Selling Price</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500 text-xs">No catalog items found.</td></tr>
                ) : filtered.map((item) => {
                  const sell = item.selling_price ?? 0;
                  const cost = item.cost_price ?? 0;
                  const margin = sell > 0 ? ((sell - cost) / sell) * 100 : 0;
                  const isArchived = !item.is_active;

                  return (
                    <tr key={item.id} className={`hover:bg-white/[0.02] transition-colors group ${isArchived ? "opacity-60" : ""}`}>
                      <td className="px-6 py-4">
                        <p className="text-gray-200 font-bold font-sans tracking-wide">{item.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-[#020408] px-2 py-1 rounded border border-white/10 text-xs text-gray-400 capitalize">
                          {item.category?.replace(/_/g, " ") || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">RM {cost.toFixed(2)}</td>
                      <td className="px-6 py-4 text-gray-400">{margin.toFixed(0)}%</td>
                      <td className="px-6 py-4 text-[#d4af37] font-bold text-sm">RM {sell.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={isArchived ? "text-red-400 bg-red-400/10 px-2 py-1 rounded border border-red-500/20" : "text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-500/20"}>
                          {isArchived ? "Archived" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEditor(item)} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded" title="Edit Item"><Edit2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/10 bg-[#020408]/40 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Page {initialPage} of {totalPages}
              </span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(initialPage - 1)}
                  disabled={initialPage === 1}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-xs disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(initialPage + 1)}
                  disabled={initialPage === totalPages}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-xs disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══ Create/Edit Modal ═══ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel rounded-lg w-full max-w-xl border-[#d4af37]/30 shadow-[0_10px_40px_rgba(212,175,55,0.15)] flex flex-col my-auto relative">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider">
                {editingItem ? <Edit2 className="w-5 h-5 mr-2" /> : <Package className="w-5 h-5 mr-2" />} 
                {editingItem ? "Edit Catalog Pricing" : "Assign Catalog Item"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form action={(formData) => {
              startTransition(async () => {
                try {
                  const name = formData.get("name") as string;
                  const category = formData.get("category") as string;
                  const description = formData.get("description") as string;

                  if (!linkedProductId) throw new Error("Please select a valid product.");

                  let res;
                  if (editingItem) {
                    res = await updateRetailCatalogItem(editingItem.id, {
                      selling_price: sellingPrice,
                      is_active: publishToggle,
                      name,
                      category,
                      description: description || null
                    });
                  } else {
                    res = await createRetailCatalogItem({
                      linked_product_id: linkedProductId,
                      selling_price: sellingPrice,
                      name,
                      category,
                      description: description || null,
                      is_active: publishToggle
                    });
                  }

                  showToast("Catalog updated successfully.");
                  setModalOpen(false);
                  router.refresh(); // Refresh page data

                } catch (e: any) {
                  showToast(e.message || "Operation failed.");
                }
              });
            }} className="flex flex-col">
              <div className="p-6 space-y-6">
                
                {/* Product Selection */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold flex items-center"><Package className="w-4 h-4 mr-2" /> Merch Product Mapping</label>
                  {editingItem ? (
                    <div className="bg-[#020408] border border-white/10 text-white p-3 rounded-md text-sm font-semibold selection:bg-none">
                      {editingItem.name} 
                      <span className="text-xs text-gray-500 font-normal ml-2">(Fixed after assignment)</span>
                    </div>
                  ) : (
                    <ProductSearch 
                      value={linkedProductId} 
                      products={products} 
                      onChange={(val) => setLinkedProductId(val)} 
                    />
                  )}
                </div>

                {/* Item Name */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Item Name</label>
                  <input name="name" type="text" required defaultValue={editingItem?.name || ""} placeholder="e.g. Agartha Classic Cap" className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" />
                </div>
                
                {/* Category */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Catalog Category</label>
                  <select name="category" value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className="w-full bg-[#020408] border border-white/10 text-sm text-[#d4af37] font-semibold tracking-wide rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                    <option value="souvenirs">Souvenirs</option>
                    <option value="drinks">Drinks</option>
                  </select>
                </div>

                {/* Description Input */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold flex items-center justify-between">
                    Description 
                    <span className="text-[9px] text-gray-500 font-normal normal-case">Optional POS Details</span>
                  </label>
                  <textarea name="description" rows={2} defaultValue={editingItem?.description || ""} placeholder="Premium merch material, sizing availability..." className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all custom-scrollbar" />
                </div>

                {/* Pricing Block */}
                <div className="bg-gradient-to-r from-[#d4af37]/5 to-transparent p-5 rounded border border-[#d4af37]/20">
                  <div className="grid grid-cols-2 gap-6 items-end">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest">Base Cost</label>
                      <div className="text-lg font-mono text-gray-300 bg-[#020408] border border-white/5 rounded px-3 py-1.5 flex justify-between">
                         <span className="text-gray-500 text-sm font-sans my-auto">RM</span>
                         {activeCostPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest">Target Margin</label>
                      <div className="text-lg font-mono text-gray-400 bg-[#020408] border border-white/5 rounded px-3 py-1.5 flex justify-between">
                         <span className="text-gray-500 text-sm font-sans my-auto">%</span>
                         {activeMargin.toFixed(1)}
                      </div>
                    </div>
                    <div className="col-span-2 space-y-1 pt-2">
                       <label className="text-[10px] text-[#d4af37] uppercase tracking-widest font-bold">Selling Price (Must EXCEED Base Cost)</label>
                       <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#d4af37] font-orbitron font-bold text-lg">RM</span>
                         <input type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)} className="w-full bg-[#020408] border border-[#d4af37]/30 shadow-inner text-[#d4af37] font-orbitron font-bold text-2xl rounded px-3 py-2 pl-12 focus:outline-none focus:border-[#d4af37] transition-all" />
                       </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-5 border-t border-white/10 bg-[#020408]/80 rounded-b-lg flex items-center justify-between">
                <div className="flex items-center space-x-4 bg-[#010204] px-4 py-2 rounded border border-white/5">
                  <label className="relative inline-block w-10 h-5 cursor-pointer">
                    <input type="checkbox" checked={publishToggle} onChange={(e) => setPublishToggle(e.target.checked)} className="sr-only peer" />
                    <div className="w-10 h-5 bg-[#020408] border border-white/10 rounded-full peer-checked:bg-green-500 transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                  </label>
                  <div>
                    <p className={`text-sm font-bold tracking-wide ${publishToggle ? "text-green-400" : "text-gray-400"}`}>{publishToggle ? "Active" : "Archived"}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Visibility in Retail POS</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                  <button type="submit" disabled={isPending} className="px-6 py-2 text-sm font-bold rounded bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50 hover:bg-[#d4af37] hover:text-[#020408] transition-all shadow-[0_0_10px_rgba(212,175,55,0.2)] disabled:opacity-50">
                    {isPending ? "Saving..." : "Save Pricing"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 right-8 bg-[#020408] border border-[#d4af37]/40 text-[#d4af37] px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

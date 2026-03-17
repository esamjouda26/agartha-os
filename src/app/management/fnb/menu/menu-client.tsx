"use client";

import { useState, useMemo } from "react";
import { Utensils, Search, Plus, X, ChefHat, Calculator, Edit2, Trash2 } from "lucide-react";
import type { MenuItemRow } from "./page";

/* ── Helpers ────────────────────────────────────────────────────────── */
const typeBadge = (cat: string) => {
  const map: Record<string, { cls: string; label: string }> = {
    prepared_item: { cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Recipe" },
    drink:         { cls: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "Recipe" },
    prepackaged:   { cls: "bg-purple-500/10 text-purple-400 border-purple-500/20", label: "Retail" },
  };
  const m = map[cat] ?? { cls: "bg-gray-500/10 text-gray-400 border-gray-500/20", label: cat };
  return <span className={`px-2 py-0.5 rounded text-[10px] border font-semibold ${m.cls}`}>{m.label}</span>;
};

const allergenBadge = (tag: string) => {
  const colorMap: Record<string, string> = {
    "Contains Nuts":  "bg-red-500/10 text-red-400 border-red-500/20",
    "Contains Dairy": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    "Gluten-Free":    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  const cls = colorMap[tag] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";
  return <span key={tag} className={`px-1.5 py-0.5 rounded text-[9px] border ${cls}`}>{tag}</span>;
};

const locBadge = (loc: string) => (
  <span className="bg-[#020408] px-2 py-1 rounded border border-white/10 text-xs text-gray-400 mr-1">{loc}</span>
);

/* ── Component ──────────────────────────────────────────────────────── */
interface Ingredient { id: string; name: string; cost_price: number | null; suppliers: { name: string } | null; }

export default function MenuClient({ items, ingredients }: { items: MenuItemRow[]; ingredients: Ingredient[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [publishToggle, setPublishToggle] = useState(false);
  const [recipeItems, setRecipeItems] = useState<{ ingredientId: string; qty: number }[]>([{ ingredientId: ingredients[0]?.id ?? "", qty: 1 }]);
  const [sellingPrice, setSellingPrice] = useState(5.20);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch = !q || item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
      const matchType = typeFilter === "all" || (typeFilter === "recipe" && item.category !== "prepackaged") || (typeFilter === "retail" && item.category === "prepackaged");
      const matchStatus = statusFilter === "all" || (statusFilter === "active" && item.status === "available") || (statusFilter === "draft" && item.status === "draft");
      return matchSearch && matchType && matchStatus;
    });
  }, [items, search, typeFilter, statusFilter]);

  /* Recipe cost calculation */
  const baseCost = recipeItems.reduce((sum, ri) => {
    const ing = ingredients.find((p) => p.id === ri.ingredientId);
    return sum + (ing?.cost_price ?? 0) * ri.qty;
  }, 0);
  const targetMargin = sellingPrice > 0 ? ((sellingPrice - baseCost) / sellingPrice) * 100 : 0;

  return (
    <div className="space-y-8 pb-10">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-cinzel text-xl text-[#d4af37] flex items-center tracking-wider">
            <Utensils className="w-6 h-6 mr-3" /> Menu &amp; Pricing Engine
          </h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Master Control for Café &amp; Vending Deployments</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold px-5 py-2.5 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all flex items-center text-sm uppercase tracking-widest">
          <Plus className="w-4 h-4 mr-2" /> Add Menu Item
        </button>
      </div>

      {/* ═══ Menu Table ═══ */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[600px]">
          {/* Toolbar */}
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Search menu items..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" />
            </div>
            <div className="flex items-center space-x-3">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                <option value="all">Item Type: All</option>
                <option value="recipe">Recipe / Assembled</option>
                <option value="retail">Retail / Pre-packaged</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                <option value="all">Status: All</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Item Name</th>
                  <th className="px-6 py-4 font-semibold">Item Type</th>
                  <th className="px-6 py-4 font-semibold">Location</th>
                  <th className="px-6 py-4 font-semibold">Base Cost (COGS)</th>
                  <th className="px-6 py-4 font-semibold">Target Margin %</th>
                  <th className="px-6 py-4 font-semibold text-[#d4af37]">Final Selling Price</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-500 text-xs">No menu items found.</td></tr>
                ) : filtered.map((item) => {
                  const sell = item.unit_price ?? 0;
                  const cost = item.cost_price ?? 0;
                  const margin = sell > 0 ? ((sell - cost) / sell) * 100 : 0;
                  const isDraft = item.status === "draft";
                  const locations = (item.location ?? "Café").split(",").map((l) => l.trim());
                  return (
                    <tr key={item.id} className={`hover:bg-white/[0.02] transition-colors group ${isDraft ? "opacity-75" : ""}`}>
                      <td className="px-6 py-4">
                        <p className="text-gray-200 font-bold font-sans tracking-wide">{item.name}</p>
                        {item.allergens && item.allergens.length > 0 && (
                          <div className="flex space-x-1 mt-1">{item.allergens.map((a) => allergenBadge(a))}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400">{typeBadge(item.category)}</td>
                      <td className="px-6 py-4">{locations.map((l) => locBadge(l))}</td>
                      <td className="px-6 py-4 text-gray-400">RM {cost.toFixed(2)}</td>
                      <td className="px-6 py-4 text-gray-400">{margin.toFixed(0)}%</td>
                      <td className="px-6 py-4 text-[#d4af37] font-bold text-sm">RM {sell.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={isDraft ? "text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/10" : "text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-500/20"}>
                          {isDraft ? "Draft" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded" title="Edit Item"><Edit2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ Create Menu Item Modal ═══ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm overflow-y-auto pt-20 pb-10">
          <div className="glass-panel rounded-lg w-full max-w-3xl border-[#d4af37]/30 shadow-[0_10px_40px_rgba(212,175,55,0.15)] flex flex-col my-auto relative">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider">
                <Plus className="w-5 h-5 mr-2" /> Create Menu Item
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Item Name */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Item Name</label>
                <input type="text" placeholder="e.g. Glowing Nachos" className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" />
              </div>

              {/* Recipe Builder */}
              <div className="p-5 rounded border border-white/5 bg-[#010204] space-y-4">
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <div>
                    <p className="text-sm font-bold text-white tracking-wide flex items-center"><ChefHat className="w-4 h-4 mr-2 text-[#d4af37]" /> Recipe Builder</p>
                    <p className="text-[10px] text-gray-500">Build items using Raw Ingredients OR Prepackaged Items from the Merch catalog.</p>
                  </div>
                  <button type="button" onClick={() => setRecipeItems([...recipeItems, { ingredientId: ingredients[0]?.id ?? "", qty: 1 }])} className="text-[10px] uppercase tracking-widest text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/10 px-3 py-1 rounded transition-colors">+ Add Item</button>
                </div>
                <div className="space-y-3">
                  {recipeItems.map((ri, idx) => {
                    const ing = ingredients.find((p) => p.id === ri.ingredientId);
                    const lineCost = (ing?.cost_price ?? 0) * ri.qty;
                    return (
                      <div key={idx} className="flex items-center space-x-3 text-xs">
                        <select value={ri.ingredientId} onChange={(e) => { const next = [...recipeItems]; next[idx].ingredientId = e.target.value; setRecipeItems(next); }} className="flex-1 bg-[#020408] border border-white/10 text-gray-300 rounded px-3 py-2 cursor-pointer">
                          {ingredients.map((p) => <option key={p.id} value={p.id}>{p.name}{p.suppliers ? ` (${p.suppliers.name})` : ""} - RM {(p.cost_price ?? 0).toFixed(2)}/ea</option>)}
                        </select>
                        <input type="number" min={1} value={ri.qty} onChange={(e) => { const next = [...recipeItems]; next[idx].qty = parseInt(e.target.value) || 1; setRecipeItems(next); }} className="w-20 bg-[#020408] border border-white/10 text-white rounded px-3 py-2" />
                        <span className="w-24 text-right text-gray-400 font-mono border-l border-white/10 pl-3">RM {lineCost.toFixed(2)}</span>
                        <button type="button" onClick={() => setRecipeItems(recipeItems.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    );
                  })}
                </div>
                {/* Allergen Tagging */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold flex items-center">Allergen Tagging</label>
                  <div className="flex space-x-4 text-sm text-gray-300">
                    {["Contains Nuts", "Contains Dairy", "Gluten-Free"].map((tag) => (
                      <label key={tag} className="flex items-center cursor-pointer"><input type="checkbox" className="mr-2 accent-[#d4af37]" /> {tag}</label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing Engine */}
              <div className="bg-gradient-to-r from-[#d4af37]/5 to-transparent p-5 rounded border border-[#d4af37]/20">
                <p className="text-sm font-bold text-[#d4af37] tracking-wide flex items-center mb-4"><Calculator className="w-4 h-4 mr-2" /> Pricing Engine</p>
                <div className="grid grid-cols-3 gap-6 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest">Base Cost (Auto)</label>
                    <div className="text-lg font-mono text-gray-300 bg-[#020408] border border-white/5 rounded px-3 py-1.5">RM {baseCost.toFixed(2)}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest">Target Margin %</label>
                    <div className="text-lg font-mono text-gray-400 bg-[#020408] border border-white/5 rounded-md px-3 py-1.5 text-right">{targetMargin.toFixed(1)}%</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#d4af37] uppercase tracking-widest font-bold">Final Selling Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#d4af37] font-orbitron font-bold text-lg">RM</span>
                      <input type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)} className="w-full bg-[#020408] border border-[#d4af37]/30 shadow-inner text-[#d4af37] font-orbitron font-bold text-2xl rounded px-3 py-1 pl-12 text-right focus:outline-none focus:border-[#d4af37] transition-all" />
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
                  <p className={`text-sm font-bold tracking-wide ${publishToggle ? "text-green-400" : "text-white"}`}>{publishToggle ? "Active / Published" : "Draft Status"}</p>
                  <p className="text-[10px] text-gray-500 uppercase">Toggle to publish to POS / Vending</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-2 text-sm font-bold rounded bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50 hover:bg-[#d4af37] hover:text-[#020408] transition-all shadow-[0_0_10px_rgba(212,175,55,0.2)]">Save Item</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

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

import { useState, useMemo, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Utensils, Search, Package, ChefHat, Plus, Edit2, Archive, DollarSign, Calculator, UtensilsCrossed, Settings2, Trash2, X, CheckCircle2 } from "lucide-react";
import { createMenuItemAction } from "../actions";

export interface Ingredient { id: string; name: string; cost_price: number | null; product_category: string; unit_of_measure: string | null; suppliers: { name: string } | null; }

function IngredientSearch({
  value,
  onChange,
  ingredients
}: {
  value: string;
  onChange: (id: string) => void;
  ingredients: Ingredient[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const selectedIng = ingredients.find(i => i.id === value);
  const displayValue = selectedIng ? selectedIng.name : "";

  const filtered = useMemo(() => {
    return ingredients.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  }, [ingredients, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Ingredient[]>();
    filtered.forEach(item => {
      const cat = item.product_category || "uncategorized";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const formatCategory = (cat: string) => cat.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className={`relative flex-1 text-xs ${open ? "z-50" : "z-10"}`}>
      {open && <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(""); }} />}
      <div 
        className="flex items-center bg-[#020408] border border-white/10 rounded px-3 py-2 cursor-pointer h-[34px] relative z-40"
        onClick={() => setOpen(!open)}
      >
        <span className={value ? "text-gray-300 truncate" : "text-gray-500"}>
          {value ? displayValue : "-- Select Product --"}
        </span>
      </div>
      
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#020408] border border-white/10 rounded shadow-xl max-h-60 flex flex-col">
          <div className="p-2 border-b border-white/10">
            <input 
              autoFocus
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#010204] border border-white/10 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-[#d4af37]/50"
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1 custom-scrollbar max-h-48">
            {filtered.length === 0 ? (
              <div className="p-2 text-gray-500 text-xs text-center">No matches</div>
            ) : grouped.map(([cat, items]) => (
              <div key={cat} className="mb-2">
                <div className="px-2 py-1 text-[10px] font-bold text-[#d4af37] uppercase bg-white/5 sticky top-0">{formatCategory(cat)}</div>
                {items.map(p => (
                  <div 
                    key={p.id}
                    className="px-3 py-2 text-xs text-gray-300 hover:bg-[#d4af37]/10 hover:text-[#d4af37] cursor-pointer border-l-2 border-transparent hover:border-[#d4af37]"
                    onClick={() => {
                      onChange(p.id);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MenuClient({ 
  items, 
  ingredients, 
  count, 
  initialPage 
}: { 
  items: MenuItemRow[]; 
  ingredients: Ingredient[];
  count: number;
  initialPage: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemRow | null>(null);
  const [publishToggle, setPublishToggle] = useState(false);
  const [recipeItems, setRecipeItems] = useState<{ ingredientId: string; qty: number }[]>([{ ingredientId: ingredients[0]?.id ?? "", qty: 1 }]);
  const [sellingPrice, setSellingPrice] = useState(5.20);
  const [itemCategory, setItemCategory] = useState("hot_food");
  const [fulfillmentMode, setFulfillmentMode] = useState<"recipe" | "retail">("recipe");
  const [linkedRetailId, setLinkedRetailId] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);

  const validRecipeIngredients = useMemo(() => ingredients.filter(i => ["raw_ingredient", "prepackaged_fnb", "consumable"].includes(i.product_category)), [ingredients]);

  const openEditor = (item?: MenuItemRow) => {
    if (item) {
      setEditingItem(item);
      setSellingPrice(item.unit_price || 0);
      setPublishToggle(item.is_active);
      setItemCategory(item.menu_category || 'hot_food');
      if (item.linked_product_id) {
        setFulfillmentMode("retail");
        setLinkedRetailId(item.linked_product_id);
        setRecipeItems([]); // Clear Recipe
      } else {
        setFulfillmentMode("recipe");
        setLinkedRetailId("");
        setRecipeItems(item.recipeItems?.length ? item.recipeItems : [{ ingredientId: validRecipeIngredients[0]?.id ?? "", qty: 1 }]);
      }
    } else {
      setEditingItem(null);
      setSellingPrice(5.20);
      setPublishToggle(false);
      setItemCategory('hot_food');
      setFulfillmentMode("recipe");
      setLinkedRetailId("");
      setRecipeItems([{ ingredientId: validRecipeIngredients[0]?.id ?? "", qty: 1 }]);
    }
    setModalOpen(true);
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  /* Pagination Logic */
  const totalPages = Math.ceil(count / 50);
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch = !q || item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
      const matchType = typeFilter === "all" || (typeFilter === "recipe" && item.category !== "prepackaged") || (typeFilter === "retail" && item.category === "prepackaged");
      const matchStatus = statusFilter === "all" || (statusFilter === "available" && item.is_active) || (statusFilter === "out_of_stock" && !item.is_active);
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
      <div className="flex items-center justify-end">
        
        <button onClick={() => openEditor()} className="bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold px-5 py-2.5 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all flex items-center text-sm uppercase tracking-widest">
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
                <option value="available">Active / Available</option>
                <option value="out_of_stock">Draft / Out of Stock</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Item Name</th>
                  <th className="px-6 py-4 font-semibold">Item Type</th>
                  <th className="px-6 py-4 font-semibold">Menu Category</th>
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
                  const isDraft = !item.is_active;
                  return (
                    <tr key={item.id} className={`hover:bg-white/[0.02] transition-colors group ${isDraft ? "opacity-75" : ""}`}>
                      <td className="px-6 py-4">
                        <p className="text-gray-200 font-bold font-sans tracking-wide">{item.name}</p>
                        {item.allergens && item.allergens.length > 0 && (
                          <div className="flex space-x-1 mt-1">{item.allergens.map((a) => allergenBadge(a))}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400">{typeBadge(item.category)}</td>
                      <td className="px-6 py-4">{locBadge(item.menu_category ? item.menu_category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Not Assigned")}</td>
                      <td className="px-6 py-4 text-gray-400">RM {cost.toFixed(2)}</td>
                      <td className="px-6 py-4 text-gray-400">{margin.toFixed(0)}%</td>
                      <td className="px-6 py-4 text-[#d4af37] font-bold text-sm">RM {sell.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={isDraft ? "text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/10" : "text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-500/20"}>
                          {isDraft ? "Draft" : "Active"}
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

      {/* ═══ Create Menu Item Modal ═══ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm overflow-y-auto pt-20 pb-10">
          <div className="glass-panel rounded-lg w-full max-w-3xl border-[#d4af37]/30 shadow-[0_10px_40px_rgba(212,175,55,0.15)] flex flex-col my-auto relative">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider">
                {editingItem ? <Edit2 className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />} 
                {editingItem ? "Edit Menu Item" : "Create Menu Item"}
              </h3>
              <button 
                type="button"
                onClick={() => setModalOpen(false)} 
                className="text-gray-400 hover:text-white transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>

            <form action={(formData) => {
              startTransition(async () => {
                try {
                  const name = formData.get("name") as string;
                  const category = formData.get("category") as string;
                  
                  // Extract allergens
                  const allergens: string[] = [];
                  ['Contains Nuts', 'Contains Dairy', 'Gluten-Free'].forEach(tag => {
                    if (formData.get(`allergen_${tag}`) === 'on') allergens.push(tag);
                  });

                  const payload = {
                    id: editingItem?.id,
                    name,
                    category,
                    unit_price: sellingPrice,
                    is_active: publishToggle,
                    description: formData.get("description") as string || null,
                    image_url: editingItem?.image_url || null,
                    allergens: allergens.length > 0 ? allergens : null,
                    linked_product_id: fulfillmentMode === "retail" ? linkedRetailId : null,
                    recipeItems: fulfillmentMode === "recipe" ? recipeItems.filter(ri => ri.ingredientId !== "") : []
                  };

                  const res = await createMenuItemAction(payload);
                  if (res?.error) {
                    showToast(`Error saving item: ${res.error}`);
                  } else {
                    showToast("Menu Item successfully saved.");
                    setModalOpen(false);
                  }
                } catch (e) {
                  console.error(e);
                  showToast("Failed to submit");
                }
              });
            }} className="flex flex-col max-h-[75vh]">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Item Name */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Item Name</label>
                  <input name="name" type="text" required defaultValue={editingItem?.name || ""} placeholder="e.g. Glowing Nachos" className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" />
                </div>
                
                {/* Categorization Matrix */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Menu Category</label>
                  <select name="category" value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className="w-full bg-[#020408] border border-white/10 text-sm text-[#d4af37] font-semibold tracking-wide rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                    <option value="hot_food">Hot Food</option>
                    <option value="snacks_and_sides">Snacks & Sides</option>
                    <option value="hot_beverage">Hot Beverage</option>
                    <option value="cold_beverage">Cold Beverage</option>
                    <option value="bakery_and_dessert">Bakery & Dessert</option>
                    <option value="combos">Combos</option>
                    <option value="uncategorized">Uncategorized</option>
                  </select>
                </div>

                {/* Description Input */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold flex items-center justify-between">
                    Description 
                    <span className="text-[9px] text-gray-500 font-normal normal-case">Optional POS Details</span>
                  </label>
                  <textarea name="description" rows={2} defaultValue={editingItem?.description || ""} placeholder="Classic spicy nachos fused with house cheese..." className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all custom-scrollbar" />
                </div>

                {/* Fulfillment Strategy Toggle */}
                <div className="flex border border-white/10 rounded-lg overflow-hidden p-1 bg-[#020408]/60">
                  <button type="button" onClick={() => setFulfillmentMode("recipe")} className={`flex-1 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors rounded ${fulfillmentMode === "recipe" ? "bg-[#d4af37]/20 text-[#d4af37] border-b border-[#d4af37]" : "text-gray-500 hover:text-white"}`}>
                    <ChefHat className="w-3 h-3 inline mr-1 -mt-0.5" /> Recipe Layout
                  </button>
                  <button type="button" onClick={() => setFulfillmentMode("retail")} className={`flex-1 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors rounded ${fulfillmentMode === "retail" ? "bg-purple-500/20 text-purple-400 border-b border-purple-500" : "text-gray-500 hover:text-white"}`}>
                    <Package className="w-3 h-3 inline mr-1 -mt-0.5" /> Retail Direct Link
                  </button>
                </div>

                {/* Dynamic Configuration Form */}
                {fulfillmentMode === "retail" ? (
                  <div className="p-5 rounded border border-purple-500/10 bg-purple-900/5 space-y-4">
                     <p className="text-sm font-bold text-purple-400 tracking-wide flex items-center"><Package className="w-4 h-4 mr-2" /> Select Retail Catalog Item</p>
                     <p className="text-xs text-gray-400">Choose a Pre-packaged Catalog Product from your warehouse supply to act strictly as retail. Stock will be natively depleted upon each sale.</p>
                     <IngredientSearch 
                       value={linkedRetailId} 
                       ingredients={ingredients.filter(i => i.product_category === "prepackaged_fnb")} 
                       onChange={(val) => setLinkedRetailId(val)} 
                     />
                  </div>
                ) : (
                  <div className="p-5 rounded border border-white/5 bg-[#010204] space-y-4">
                    <div className="flex justify-between items-end border-b border-white/10 pb-2">
                      <div>
                        <p className="text-sm font-bold text-white tracking-wide flex items-center"><ChefHat className="w-4 h-4 mr-2 text-[#d4af37]" /> Recipe Builder</p>
                        <p className="text-[10px] text-gray-500">Build items using Catalog Products (Raw, Consumable, or Prepackaged).</p>
                      </div>
                      <button type="button" onClick={() => setRecipeItems([...recipeItems, { ingredientId: validRecipeIngredients[0]?.id ?? "", qty: 1 }])} className="text-[10px] uppercase tracking-widest text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/10 px-3 py-1 rounded transition-colors">+ Add Item</button>
                    </div>
                  <div className="space-y-3">
                    {recipeItems.map((ri, idx) => {
                      const ing = ingredients.find((p) => p.id === ri.ingredientId);
                      const lineCost = (ing?.cost_price ?? 0) * ri.qty;
                      const uom = ing?.unit_of_measure ? `[${ing.unit_of_measure.substring(0, 3).toUpperCase()}]` : "";
                      return (
                        <div key={`ri-${idx}`} className="flex items-center space-x-3 text-xs w-full">
                          <IngredientSearch 
                            value={ri.ingredientId} 
                            ingredients={validRecipeIngredients} 
                            onChange={(newId) => { 
                              const next = [...recipeItems]; 
                              next[idx].ingredientId = newId; 
                              setRecipeItems(next); 
                            }} 
                          />
                          <div className="relative w-28 text-white shrink-0">
                            <input type="number" min={1} step="any" value={ri.qty} onChange={(e) => { const next = [...recipeItems]; next[idx].qty = parseFloat(e.target.value) || 1; setRecipeItems(next); }} className="w-full bg-[#020408] border border-white/10 text-white rounded pl-3 pr-10 py-2" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#d4af37] font-bold pointer-events-none">{uom}</span>
                          </div>
                          <span className="w-24 text-right text-gray-400 font-mono border-l border-white/10 pl-3">RM {lineCost.toFixed(2)}</span>
                          <button type="button" onClick={() => setRecipeItems(recipeItems.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}

                {/* Allergen Tagging (Global) */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold flex items-center">Allergen Tagging</label>
                  <div className="flex space-x-4 text-sm text-gray-300">
                    {["Contains Nuts", "Contains Dairy", "Gluten-Free"].map((tag) => (
                      <label key={tag} className="flex items-center cursor-pointer">
                        <input name={`allergen_${tag}`} type="checkbox" defaultChecked={editingItem?.allergens?.includes(tag)} className="mr-2 accent-[#d4af37]" /> {tag}
                      </label>
                    ))}
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
              <div className="p-5 border-t border-white/10 bg-[#020408]/80 rounded-b-lg flex items-center justify-between mt-auto">
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
                  <button type="submit" disabled={isPending} className="px-6 py-2 text-sm font-bold rounded bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50 hover:bg-[#d4af37] hover:text-[#020408] transition-all shadow-[0_0_10px_rgba(212,175,55,0.2)] disabled:opacity-50">
                    {isPending ? "Saving..." : "Save Item"}
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

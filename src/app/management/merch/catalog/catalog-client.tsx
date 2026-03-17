"use client";

import { useState, useMemo } from "react";
import { Package, Boxes, CheckCircle, Tag, Archive, Search, Plus, X, ScanBarcode, Receipt, Edit2 } from "lucide-react";
import type { CatalogProduct } from "./page";

/* ── Helpers ────────────────────────────────────────────────────────── */
const typeBadge = (type: string) => {
  const map: Record<string, string> = {
    Prepackaged:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Raw Ingredient":"bg-amber-500/10 text-amber-400 border-amber-500/20",
    Consumable:      "bg-purple-500/10 text-purple-400 border-purple-500/20",
    merchandise:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
    food:            "bg-amber-500/10 text-amber-400 border-amber-500/20",
    beverage:        "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };
  const cls = map[type] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";
  return <span className={`px-2 py-0.5 rounded text-[10px] border font-semibold ${cls}`}>{type}</span>;
};

/* ── Component ──────────────────────────────────────────────────────── */
export default function CatalogClient({
  products,
  suppliers,
}: {
  products: CatalogProduct[];
  suppliers: { id: string; name: string }[];
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  /* Counts */
  const totalSKUs = products.length;
  const activeCount = products.filter((p) => p.status !== "discontinued").length;
  const prepackagedCount = products.filter((p) => p.category === "merchandise" || p.category === "Prepackaged").length;
  const discontinuedCount = products.filter((p) => p.status === "discontinued").length;

  /* Filtered list */
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q);
      const matchType = typeFilter === "all" || p.category === typeFilter;
      const matchStatus = statusFilter === "all" ||
        (statusFilter === "Active" && p.status !== "discontinued") ||
        (statusFilter === "Discontinued" && p.status === "discontinued");
      return matchSearch && matchType && matchStatus;
    });
  }, [products, search, typeFilter, statusFilter]);

  return (
    <div className="space-y-8 pb-10">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-cinzel text-xl text-[#d4af37] flex items-center tracking-wider">
            <Package className="w-6 h-6 mr-3" /> Product Catalog
          </h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Central Merchandise &amp; Ingredient Registry</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold px-5 py-2.5 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all flex items-center text-sm uppercase tracking-widest"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </button>
      </div>

      {/* ═══ KPI Cards ═══ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Boxes, label: "Total SKUs", value: totalSKUs, color: "blue" },
          { icon: CheckCircle, label: "Active", value: activeCount, color: "green" },
          { icon: Tag, label: "Prepackaged", value: prepackagedCount, color: "gold" },
          { icon: Archive, label: "Discontinued", value: discontinuedCount, color: "red" },
        ].map(({ icon: Icon, label, value, color }) => {
          const colorMap: Record<string, { bg: string; border: string; text: string }> = {
            blue:  { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
            green: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" },
            gold:  { bg: "bg-[#d4af37]/10", border: "border-[#d4af37]/20", text: "text-[#d4af37]" },
            red:   { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
          };
          const c = colorMap[color];
          return (
            <div key={label} className="glass-panel rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded ${c.bg} border ${c.border} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${c.text}`} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</p>
                  <p className={`text-xl font-orbitron font-bold ${color === "gold" ? "text-[#d4af37]" : c.text}`}>{value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ═══ Data Table ═══ */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[500px]">
          {/* Toolbar */}
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, SKU, or Product ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all"
              />
            </div>
            <div className="flex items-center space-x-3">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                <option value="all">Type: All</option>
                <option value="merchandise">Merchandise</option>
                <option value="food">Food</option>
                <option value="beverage">Beverage</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                <option value="all">Status: All</option>
                <option value="Active">Active</option>
                <option value="Discontinued">Discontinued</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
                <tr>
                  <th className="px-5 py-4 font-semibold">Product ID</th>
                  <th className="px-5 py-4 font-semibold">Name</th>
                  <th className="px-5 py-4 font-semibold">SKU / Barcode</th>
                  <th className="px-5 py-4 font-semibold">Item Type</th>
                  <th className="px-5 py-4 font-semibold">Base UOM</th>
                  <th className="px-5 py-4 font-semibold">Cost Price</th>
                  <th className="px-5 py-4 font-semibold">Supplier</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-500 text-xs">No products found.</td></tr>
                ) : filtered.map((p) => {
                  const isDisc = p.status === "discontinued";
                  return (
                    <tr key={p.id} className={`hover:bg-white/[0.02] transition-colors group ${isDisc ? "opacity-50" : ""}`}>
                      <td className="px-5 py-4">
                        <span className="bg-[#020408] px-2 py-1 rounded border border-white/10 text-gray-400">{p.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-200 font-bold font-sans tracking-wide">{p.name}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-400">
                        {p.sku ? <span className="font-mono">{p.sku}</span> : <span className="text-gray-600 font-sans italic">N/A</span>}
                      </td>
                      <td className="px-5 py-4">{typeBadge(p.category)}</td>
                      <td className="px-5 py-4 text-gray-400 font-sans">{p.unit}</td>
                      <td className="px-5 py-4 text-gray-400">
                        {p.cost_price != null ? `RM ${p.cost_price.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-5 py-4 text-gray-300 font-sans text-xs">
                        {p.suppliers?.name ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`ml-2 text-[10px] font-sans uppercase tracking-widest ${isDisc ? "text-gray-500" : "text-green-400"}`}>
                          {isDisc ? "Off" : "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {/* // TODO: Bind to edit modal / Server Action */}
                        <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded" title="Edit Product">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ Add Product Modal ═══ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm overflow-y-auto pt-20 pb-10">
          <div className="glass-panel rounded-lg w-full max-w-2xl border-[#d4af37]/30 shadow-[0_10px_40px_rgba(212,175,55,0.15)] flex flex-col my-auto relative">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider">
                <Plus className="w-5 h-5 mr-2" /> Add New Product
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Body */}
            <div className="p-6 space-y-6">
              <form onSubmit={(e) => { e.preventDefault(); setModalOpen(false); /* TODO: Bind to Server Action */ }} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Product Name</label>
                    <input type="text" placeholder="e.g. Mineral Water 500ml" className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Base UOM</label>
                    <select className="w-full bg-[#020408] border border-white/10 text-sm text-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                      <option>Piece</option><option>Kg</option><option>Liter</option><option>Box</option><option>Pack</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">SKU / Barcode</label>
                    <div className="relative">
                      <input type="text" placeholder="Scan or enter barcode..." className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 pr-10 focus:outline-none focus:border-[#d4af37]/50 transition-all" />
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#d4af37]/50 hover:text-[#d4af37] transition-colors" title="Scan Barcode">
                        <ScanBarcode className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Supplier</label>
                    <select className="w-full bg-[#020408] border border-white/10 text-sm text-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                      {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Item Type</label>
                  <select className="w-full bg-[#020408] border border-white/10 text-sm text-[#d4af37] font-semibold rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer">
                    <option value="merchandise">Prepackaged Retail</option>
                    <option value="food">Raw Ingredient</option>
                    <option value="beverage">Consumable</option>
                  </select>
                </div>
                <div className="p-5 rounded border border-white/5 bg-[#010204]">
                  <p className="text-sm font-bold text-white tracking-wide flex items-center mb-4">
                    <Receipt className="w-4 h-4 mr-2 text-[#d4af37]" /> Cost
                  </p>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest">Cost Price (RM)</label>
                    <input type="number" step="0.01" placeholder="0.00" className="w-full bg-[#020408] border border-white/10 text-sm font-mono text-white rounded-md px-4 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-all" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2 text-sm font-bold rounded bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50 hover:bg-[#d4af37] hover:text-[#020408] transition-all shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

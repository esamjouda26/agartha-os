"use client";

import { useState, useMemo, useTransition } from "react";
import { AlertTriangle, Package, AlertCircle, CheckCircle, Truck, FilePlus, Loader2 } from "lucide-react";
import type { ReorderRow } from "./page";
import { generateDraftPOsAction, updateReorderPointAction, updateProductSupplierAction } from "../actions";

/* ── Helpers ────────────────────────────────────────────────────────── */
const typeBadge = (type: string) => {
  const map: Record<string, string> = {
    retail_merch:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
    prepackaged_fnb:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
    raw_ingredient:   "bg-purple-500/10 text-purple-400 border-purple-500/20",
    consumable:       "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };
  const cls = map[type] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";
  return <span className={`px-2 py-0.5 rounded text-[10px] border font-semibold font-sans ${cls}`}>{type}</span>;
};

interface EnrichedRow {
  id: string;
  name: string;
  supplierId: string | null;
  supplierName: string;
  category: string;
  onHand: number;
  onOrder: number;
  effective: number;
  reorderPoint: number;
  reorderAmt: number;
  isLow: boolean;
  selected: boolean;
  sellThrough: number; // synthetic
}

/* ── Component ──────────────────────────────────────────────────────── */
export default function ReorderPointsClient({ products, suppliers }: { products: ReorderRow[], suppliers: { id: string; name: string }[] }) {
  const initial: EnrichedRow[] = products.map((p) => {
    const activeStatuses = ["pending", "sent", "partially_received"];
    const onOrder = (p.purchase_order_items ?? []).reduce((sum, item) => {
      const status = item.purchase_orders?.status;
      if (status && activeStatuses.includes(status)) {
        return sum + Math.max(0, item.expected_qty - (item.received_qty || 0));
      }
      return sum;
    }, 0);

    const onHand = p.product_stock_levels?.reduce((s, sl) => s + (sl.current_qty ?? 0), 0) ?? 0;
    const effective = onHand + onOrder;
    const maxQty = p.product_stock_levels?.[0]?.max_qty ?? p.reorder_point * 3;
    const reorderAmt = Math.max(0, maxQty - effective);
    const isLow = effective < p.reorder_point;
    // Synthetic sell-through based on stock ratio
    const sellThrough = maxQty > 0 ? Math.round(((maxQty - onHand) / maxQty) * 100) : 0;
    return {
      id: p.id,
      name: p.name,
      supplierId: p.suppliers?.id ?? null,
      supplierName: p.suppliers?.name ?? "—",
      category: p.product_category,
      onHand,
      onOrder,
      effective,
      reorderPoint: p.reorder_point,
      reorderAmt,
      isLow,
      selected: false,
      sellThrough: Math.min(100, Math.max(0, sellThrough)),
    };
  });

  const [rows, setRows] = useState(initial);
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => showLowOnly ? rows.filter((r) => r.isLow) : rows, [rows, showLowOnly]);

  /* KPIs */
  const totalTracked = rows.length;
  const belowReorder = rows.filter((r) => r.isLow).length;
  const healthyStock = totalTracked - belowReorder;
  const pipeline = rows.reduce((s, r) => s + r.onOrder, 0);
  const anySelected = rows.some((r) => r.selected);

  function toggleRow(id: string, checked: boolean) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, selected: checked } : r));
  }
  function toggleAll(checked: boolean) {
    setRows((prev) => prev.map((r) => {
      if (showLowOnly && !r.isLow) return r;
      return { ...r, selected: checked };
    }));
  }

  const [isPending, startTransition] = useTransition();

  function createDraftPOs() {
    const selected = rows.filter((r) => r.selected);
    if (selected.length === 0) return;

    // Group items by supplier_id
    const grouping: Record<string, { productId: string, name: string, qty: number }[]> = {};
    const unmapped: string[] = [];

    selected.forEach(r => {
      if (!r.supplierId) {
        unmapped.push(r.name);
        return;
      }
      if (!grouping[r.supplierId]) grouping[r.supplierId] = [];
      grouping[r.supplierId].push({ productId: r.id, name: r.name, qty: r.reorderAmt });
    });

    if (unmapped.length > 0) {
      alert(`Cannot create PO for items missing a Supplier connection:\n${unmapped.join("\\n")}`);
      if (Object.keys(grouping).length === 0) return;
    }

    const payload = Object.entries(grouping).map(([supplierId, items]) => ({ supplierId, items }));

    startTransition(async () => {
      const res = await generateDraftPOsAction(payload);
      if (res.error) {
        showToast("Error: " + res.error);
        return;
      }
      showToast(`${payload.length} Draft PO(s) created! Opening POS...`);
      // Toggle selection off visually
      setRows(prev => prev.map(r => r.selected ? { ...r, selected: false } : r));
    });
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="space-y-8 pb-10">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-cinzel text-xl text-[#d4af37] flex items-center tracking-wider">
            <AlertTriangle className="w-6 h-6 mr-3" /> Reorder Points
          </h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Stock Level Monitoring &amp; Automated PO Generation</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Low stock toggle */}
          <label className="flex items-center cursor-pointer space-x-2">
            <div className="relative inline-block w-9 h-5">
              <input type="checkbox" checked={showLowOnly} onChange={(e) => setShowLowOnly(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-white/10 border border-white/10 rounded-full peer-checked:bg-red-500/20 peer-checked:border-red-500/40 transition-all" />
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-gray-400 rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-red-500" />
            </div>
            <span className="text-xs text-gray-300 uppercase tracking-widest font-semibold">Show Low Stock Only</span>
          </label>
          <button
            onClick={createDraftPOs}
            disabled={!anySelected || isPending}
            className="bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold px-5 py-2.5 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all flex items-center text-sm uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FilePlus className="w-4 h-4 mr-2" />}
            {isPending ? "Generating..." : "Create Draft POs"}
          </button>
        </div>
      </div>

      {/* ═══ KPI Strip ═══ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Package, label: "Total Tracked", value: totalTracked, color: "blue" },
          { icon: AlertCircle, label: "Below Reorder", value: belowReorder, color: "red" },
          { icon: CheckCircle, label: "Healthy Stock", value: healthyStock, color: "green" },
          { icon: Truck, label: "On Order (Pipeline)", value: pipeline, color: "gold" },
        ].map(({ icon: Icon, label, value, color }) => {
          const colorMap: Record<string, { bg: string; border: string; text: string }> = {
            blue:  { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
            red:   { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
            green: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" },
            gold:  { bg: "bg-[#d4af37]/10", border: "border-[#d4af37]/20", text: "text-[#d4af37]" },
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
                  <p className={`text-xl font-orbitron font-bold ${c.text}`}>{value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ═══ Data Table ═══ */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[500px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
                <tr>
                  <th className="px-4 py-4 font-semibold w-10">
                    <input type="checkbox" className="accent-[#d4af37] w-4 h-4 cursor-pointer" onChange={(e) => toggleAll(e.target.checked)} />
                  </th>
                  <th className="px-4 py-4 font-semibold">Product ID</th>
                  <th className="px-4 py-4 font-semibold">Name</th>
                  <th className="px-4 py-4 font-semibold">Supplier</th>
                  <th className="px-4 py-4 font-semibold">Item Type</th>
                  <th className="px-4 py-4 font-semibold">Sell-Through (30d)</th>
                  <th className="px-4 py-4 font-semibold">On Hand</th>
                  <th className="px-4 py-4 font-semibold">On Order</th>
                  <th className="px-4 py-4 font-semibold text-[#d4af37]">Effective Stock</th>
                  <th className="px-4 py-4 font-semibold">Reorder Point</th>
                  <th className="px-4 py-4 font-semibold">Reorder Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {filtered.length === 0 ? (
                  <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-500 text-xs">No products found.</td></tr>
                ) : filtered.map((r) => {
                  const stColor = r.sellThrough >= 80 ? "bg-green-500" : r.sellThrough >= 50 ? "bg-[#d4af37]" : "bg-red-500";
                  const stTextColor = r.sellThrough >= 80 ? "text-green-400" : r.sellThrough >= 50 ? "text-[#d4af37]" : "text-red-400";
                  return (
                    <tr key={r.id} className={`hover:bg-white/[0.02] transition-colors ${r.isLow ? "bg-red-500/[0.03]" : ""}`}>
                      <td className="px-4 py-4">
                        <input type="checkbox" className="accent-[#d4af37] w-4 h-4 cursor-pointer" checked={r.selected} onChange={(e) => toggleRow(r.id, e.target.checked)} />
                      </td>
                      <td className="px-4 py-4">
                        <span className="bg-[#020408] px-2 py-1 rounded border border-white/10 text-gray-400">{r.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-4"><p className="text-gray-200 font-bold font-sans tracking-wide">{r.name}</p></td>
                      <td className="px-4 py-4 text-gray-400 font-sans">
                        <select
                          className="bg-transparent border border-transparent hover:border-white/10 focus:border-[#d4af37]/50 focus:bg-[#020408] rounded pl-1 pr-6 py-1 cursor-pointer w-full text-xs"
                          value={r.supplierId || ""}
                          onChange={async (e) => {
                            const newId = e.target.value || null;
                            const res = await updateProductSupplierAction(r.id, newId);
                            if (res?.error) {
                              showToast("Error updating supplier: " + res.error);
                            } else {
                              showToast("Supplier updated.");
                              setRows(prev => prev.map(pr => pr.id === r.id ? { ...pr, supplierId: newId, supplierName: suppliers.find(s => s.id === newId)?.name ?? "—" } : pr));
                            }
                          }}
                        >
                          <option value="">—</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-4">{typeBadge(r.category)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className={`${stColor} h-full rounded-full`} style={{ width: `${r.sellThrough}%` }} />
                          </div>
                          <span className={`${stTextColor} font-sans font-semibold`}>{r.sellThrough}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-300 font-semibold">{r.onHand}</td>
                      <td className={`px-4 py-4 ${r.onOrder > 0 ? "text-[#d4af37]" : "text-gray-600"}`}>{r.onOrder > 0 ? r.onOrder : "—"}</td>
                      <td className="px-4 py-4">
                        <span className={`font-orbitron text-sm font-bold ${r.isLow ? "text-red-400" : "text-green-400"}`}>{r.effective}</span>
                      </td>
                      <td className="px-4 py-4 text-gray-300">
                        <input
                          type="number"
                          className="w-16 bg-transparent border border-transparent hover:border-white/10 hover:bg-white/5 focus:border-[#d4af37]/50 focus:bg-[#020408] focus:outline-none rounded px-2 py-1 transition-all text-center"
                          value={r.reorderPoint}
                          onChange={(e) => setRows(prev => prev.map(pr => pr.id === r.id ? { ...pr, reorderPoint: Number(e.target.value) } : pr))}
                          onBlur={async (e) => {
                            if (Number(e.target.value) !== initial.find(pr => pr.id === r.id)?.reorderPoint) {
                              const res = await updateReorderPointAction(r.id, Number(e.target.value));
                              if (res?.error) {
                                showToast("Error: " + res.error);
                              } else {
                                showToast("Reorder point updated.");
                              }
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-4 text-gray-300">
                        <input
                          type="number"
                          className="w-16 bg-transparent border border-transparent hover:border-white/10 hover:bg-white/5 focus:border-[#d4af37]/50 focus:bg-[#020408] focus:outline-none rounded px-2 py-1 transition-all text-center"
                          value={r.reorderAmt}
                          onChange={(e) => setRows(prev => prev.map(pr => pr.id === r.id ? { ...pr, reorderAmt: Number(e.target.value) } : pr))}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ Toast ═══ */}
      {toast && (
        <div className="fixed bottom-24 right-8 bg-green-500/20 border border-green-500/40 text-green-400 px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm text-sm font-semibold flex items-center space-x-2 z-50 animate-in slide-in-from-bottom-4">
          <CheckCircle className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

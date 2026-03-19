"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  ArrowLeftRight, Search, Activity, Clock, Package, Zap, Truck, History, X, ArrowRight, ChevronLeft, ChevronRight, CheckCircle2, Eye,
} from "lucide-react";
import {
  fetchStockLocationsAction,
  fetchProductsWithStockAction,
  fetchTransfersAction,
  createTransferAction,
  completeTransferAction,
  fetchItemLedgerAction,
  fetchRunnersAction,
} from "../actions";
import DomainAuditTable from "@/components/DomainAuditTable";

// ── Types ───────────────────────────────────────────────────────────────────

interface StockLevel { id: string; location_id: string; current_qty: number; max_qty: number | null }
interface ProductWithStock {
  id: string; name: string; sku: string | null; barcode: string | null;
  product_category: string | null; unit_of_measure: string; reorder_point: number;
  product_stock_levels: StockLevel[];
}
interface StockLocation { id: string; name: string; is_sink: boolean; can_hold_inventory: boolean; allowed_categories: string[] }
interface Runner { id: string; employee_id: string; legal_name: string }

interface Transfer {
  id: string; source_location_id: string; dest_location_id: string;
  assigned_runner_id: string | null; status: string; notes: string | null;
  created_at: string; updated_at: string | null; created_by: string | null;
  inventory_transfer_items: { products?: { name: string }; quantity: number }[];
  source: { name: string; can_hold_inventory: boolean } | null;
  dest: { name: string; can_hold_inventory: boolean } | null;
}

interface LedgerEntry {
  id: string; product_id: string; location_id: string; quantity_delta: number;
  transaction_type: string; reference_id: string | null;
  performed_by: string | null; created_at: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  in_transit: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60000) return "Just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)} min ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

// ── Page Component ──────────────────────────────────────────────────────────

export default function TransfersPage() {
  const [tab, setTab] = useState<"live" | "history">("live");
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // Modal state
  const [transferModal, setTransferModal] = useState(false);
  const [ledgerModal, setLedgerModal] = useState<{ open: boolean; productId: string; productName: string } | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Transfer form
  const [tfSource, setTfSource] = useState("");
  const [tfDest, setTfDest] = useState("");
  const [tfRunner, setTfRunner] = useState("auto");
  const [tfItems, setTfItems] = useState<{ product_id: string; name: string; qty: number }[]>([]);
  const [isPending, startTransition] = useTransition();

  const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); }, []);

  const trackableLocations = locations.filter((l) => !l.is_sink);
  const sinkLocations = locations.filter((l) => l.is_sink);

  // ── Data Loading ──────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    setLoading(true);
    const [prodsRes, locs, trans, runnerList] = await Promise.all([
      fetchProductsWithStockAction(search || undefined),
      fetchStockLocationsAction(),
      fetchTransfersAction(),
      fetchRunnersAction(),
    ]);
    const typedLocs = locs as StockLocation[];
    setProducts(prodsRes.products as ProductWithStock[]);
    setLocations(typedLocs);
    setTransfers(trans as Transfer[]);
    setRunners(runnerList as Runner[]);
    if (!tfSource && typedLocs.length > 0) setTfSource(typedLocs[0].id);
    if (!tfDest && typedLocs.length > 1) setTfDest(typedLocs[1].id);
    setLoading(false);
  }, [search, tfSource, tfDest]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Helpers ─────────────────────────────────────────────────────────────

  function getStockForLocation(p: ProductWithStock, locationId: string): number | null {
    const sl = p.product_stock_levels.find((s) => s.location_id === locationId);
    return sl ? sl.current_qty : null;
  }

  function getMaxForLocation(p: ProductWithStock, locationId: string): number | null {
    const sl = p.product_stock_levels.find((s) => s.location_id === locationId);
    return sl?.max_qty ?? null;
  }

  function getReplenishments(p: ProductWithStock): { deficit: number; locationName: string }[] {
    const result: { deficit: number; locationName: string }[] = [];
    trackableLocations.forEach((loc) => {
      const current = getStockForLocation(p, loc.id);
      const max = getMaxForLocation(p, loc.id);
      if (current !== null && max !== null && current < max) {
        result.push({ deficit: max - current, locationName: loc.name });
      }
    });
    return result;
  }

  const totalReplenishments = products.filter((p) => getReplenishments(p).length > 0).length;
  const activeTickets = transfers.filter((t) => t.status === "pending" || t.status === "in_transit").length;

  // ── Selection ─────────────────────────────────────────────────────────────

  function toggleSelect(id: string) {
    setSelected((prev) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  }
  function toggleAll() {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  }

  // ── Transfer Modal ────────────────────────────────────────────────────────

  function openTransferModal(preselectId?: string) {
    const items = preselectId
      ? products.filter((p) => p.id === preselectId)
      : products.filter((p) => selected.has(p.id));
    if (items.length === 0) return;
    setTfItems(items.map((p) => ({ product_id: p.id, name: p.name, qty: 1 })));
    setTransferModal(true);
  }

  async function handleCreateTransfer() {
    if (!tfSource || !tfDest || tfItems.length === 0) return;
    const invalidQty = tfItems.some((i) => !i.qty || i.qty < 1);
    if (invalidQty) { showToast("Enter valid quantity for all items"); return; }

    startTransition(async () => {
      const runnerId = tfRunner === "auto" || tfRunner === "direct" ? null : tfRunner;
      const res = await createTransferAction({
        source_location_id: tfSource,
        dest_location_id: tfDest,
        assigned_runner_id: runnerId,
        notes: null,
        items: tfItems.map((i) => ({ product_id: i.product_id, quantity: i.qty })),
      });

      if (res?.error) {
        showToast(`Error: ${res.error}`);
      } else {
        const isDirect = tfRunner === "direct";
        showToast(isDirect ? "Items issued directly. Global stock updated." : "Transfer ticket dispatched to Runners.");
        setTransferModal(false);
        setSelected(new Set());
        refresh();
      }
    });
  }

  // ── Ledger Modal ──────────────────────────────────────────────────────────

  async function openLedger(productId: string, productName: string) {
    setLedgerModal({ open: true, productId, productName });
    setLedgerLoading(true);
    const entries = await fetchItemLedgerAction(productId);
    setLedgerEntries(entries as LedgerEntry[]);
    setLedgerLoading(false);
  }

  // ── Filtered history ──────────────────────────────────────────────────────

  const filteredHistory = transfers.filter((t) => {
    if (historyStatus !== "all" && t.status !== historyStatus) return false;
    if (historySearch) {
      const s = historySearch.toLowerCase();
      return t.id.toLowerCase().includes(s) || (t.source?.name ?? "").toLowerCase().includes(s) || (t.dest?.name ?? "").toLowerCase().includes(s);
    }
    return true;
  });

  const isSinkDest = sinkLocations.some((l) => l.id === tfDest);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-10">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider">
            <ArrowLeftRight className="w-5 h-5 mr-2" /> Transfers & Issuance
          </h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Live Logistics Hub & Operational Consumption</p>
        </div>
        <div className="flex items-center gap-3">
          {tab === "live" && (
            <button
              disabled={selected.size === 0}
              onClick={() => { showToast(`Pick-list generated for ${selected.size} items. Sent to Runner Crew.`); setSelected(new Set()); }}
              className="flex items-center gap-2 bg-[#020408] text-[#d4af37] border border-[rgba(212,175,55,0.5)] font-bold px-4 py-2 rounded shadow-[0_0_10px_rgba(212,175,55,0.2)] hover:bg-[#d4af37] hover:text-[#020408] transition-all text-xs uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#020408] disabled:hover:text-[#d4af37]"
            >
              <Zap className="w-4 h-4" /> Fulfill Suggested
            </button>
          )}
          <button
            disabled={selected.size === 0}
            onClick={() => openTransferModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold px-5 py-2.5 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all text-sm uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed disabled:from-[#020408] disabled:to-[#020408] disabled:border disabled:border-white/10 disabled:text-gray-500 disabled:shadow-none"
          >
            <Truck className="w-4 h-4" /> New Transfer Ticket
          </button>
        </div>
      </div>

      {/* ── Tabs + KPIs ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex bg-[#020408] border border-white/10 rounded-t-lg overflow-hidden w-fit">
          <button onClick={() => setTab("live")} className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 ${tab === "live" ? "text-[#d4af37] border-[#d4af37] bg-[rgba(212,175,55,0.1)]" : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"}`}>
            <Activity className="w-3.5 h-3.5" /> Live Stock Levels
          </button>
          <button onClick={() => setTab("history")} className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 ${tab === "history" ? "text-[#d4af37] border-[#d4af37] bg-[rgba(212,175,55,0.1)]" : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"}`}>
            <Clock className="w-3.5 h-3.5" /> Transfer History Log
          </button>
        </div>

        <div className="flex gap-3">
          {[
            { label: "Items Tracked", value: products.length, icon: Package, color: "text-blue-400" },
            { label: "Replenishments Needed", value: totalReplenishments, icon: Zap, color: "text-yellow-400" },
            { label: "Active Tickets", value: activeTickets, icon: Truck, color: "text-green-400" },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="glass-panel px-4 py-2 rounded flex items-center gap-3">
                <Icon className={`w-5 h-5 ${kpi.color}`} />
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest">{kpi.label}</p>
                  <p className={`text-lg font-orbitron font-bold ${kpi.color}`}>{kpi.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="glass-panel rounded-lg rounded-tl-none overflow-hidden flex flex-col min-h-[500px]">

        {/* ── TAB: LIVE STOCK LEVELS ───────────────────────────── */}
        {tab === "live" && (
          <>
            <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text" placeholder="Search product name or barcode..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : products.length === 0 ? (
                <p className="text-center text-gray-500 py-16 text-sm">No products found.</p>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
                    <tr>
                      <th className="px-4 py-4 font-semibold w-10">
                        <input type="checkbox" checked={selected.size === products.length && products.length > 0} onChange={toggleAll} className="w-4 h-4 accent-[#d4af37] cursor-pointer" />
                      </th>
                      <th className="px-4 py-4 font-semibold">Product Name & Barcode</th>
                      {trackableLocations.map((loc) => (
                        <th key={loc.id} className="px-4 py-4 font-semibold text-center border-l border-white/5">{loc.name}</th>
                      ))}
                      <th className="px-4 py-4 font-semibold text-[#d4af37]">Suggested Transfer</th>
                      <th className="px-4 py-4 font-semibold text-center">Ledger</th>
                      <th className="px-4 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-xs">
                    {products.map((p) => {
                      const replenishments = getReplenishments(p);
                      return (
                        <tr key={p.id} className={`hover:bg-white/[0.02] transition-colors ${selected.has(p.id) ? "bg-white/[0.03]" : ""}`}>
                          <td className="px-4 py-4">
                            <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="w-4 h-4 accent-[#d4af37] cursor-pointer" />
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-gray-200 font-bold font-sans tracking-wide">{p.name}</p>
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{p.sku || p.barcode || p.id.slice(0, 8)}</p>
                          </td>
                          {trackableLocations.map((loc) => {
                            const qty = getStockForLocation(p, loc.id);
                            const max = getMaxForLocation(p, loc.id);
                            const isLow = qty !== null && max !== null && qty < max;
                            return (
                              <td key={loc.id} className="px-4 py-4 text-center border-l border-white/5">
                                {qty !== null ? (
                                  <span className={`font-semibold ${isLow ? "text-yellow-400" : "text-gray-300"}`}>{qty}</span>
                                ) : (
                                  <span className="text-gray-600">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              {replenishments.length > 0 ? replenishments.map((r, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded text-[10px]">
                                  {r.deficit} → {r.locationName}
                                </span>
                              )) : (
                                <span className="text-gray-600 text-[10px] italic">Healthy</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button onClick={() => openLedger(p.id, p.name)} className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded transition-colors" title="View Item Ledger">
                              <History className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button onClick={() => openTransferModal(p.id)} className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded transition-colors" title="Transfer / Issue">
                              <ArrowLeftRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── TAB: TRANSFER HISTORY ───────────────────────────── */}
        {tab === "history" && (
          <>
            <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Search Transfer ID or Location..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] transition-all" />
              </div>
              <select value={historyStatus} onChange={(e) => setHistoryStatus(e.target.value)}
                className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[rgba(212,175,55,0.5)] cursor-pointer appearance-none">
                <option value="all">Status: All</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="in_transit">In Transit</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-16">
                  <ArrowLeftRight className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No transfers found.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
                    <tr>
                      {["Transfer ID", "Timestamp", "Source → Destination", "Items & Qty Moved", "Assigned Runner", "Status", "Actions"].map((h) => (
                        <th key={h} className={`px-5 py-4 font-semibold ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {filteredHistory.map((t) => {
                      const statusCls = STATUS_BADGE[t.status] ?? STATUS_BADGE.draft;
                      const itemsDesc = t.inventory_transfer_items?.map(
                        (item: { products?: { name: string }; quantity: number }) => `${item.products?.name ?? "Item"} (×${item.quantity})`
                      ).join(", ") || "—";
                      return (
                        <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4 text-[#d4af37] font-semibold font-mono">{t.id.slice(0, 8)}…</td>
                          <td className="px-5 py-4 text-gray-400">{timeAgo(t.created_at)}</td>
                          <td className="px-5 py-4">
                            <span className="text-gray-300">{t.source?.name ?? "—"}</span>
                            <ArrowRight className="w-3 h-3 inline mx-2 text-gray-500" />
                            <span className={t.dest && !t.dest.can_hold_inventory ? "text-blue-400" : "text-gray-300"}>{t.dest?.name ?? "—"}</span>
                          </td>
                          <td className="px-5 py-4 text-gray-300 max-w-xs truncate">{itemsDesc}</td>
                          <td className="px-5 py-4 text-gray-400">{t.assigned_runner_id ? t.assigned_runner_id.slice(0, 8) + "…" : "Direct Issue"}</td>
                          <td className="px-5 py-4">
                            <span className={`text-[10px] border px-2 py-1 rounded font-bold uppercase tracking-widest ${statusCls}`}>
                              {t.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right flex justify-end gap-2">
                            {t.status !== "completed" && t.status !== "cancelled" && (
                              <button disabled={isPending} onClick={() => {
                                startTransition(async () => {
                                  const res = await completeTransferAction(t.id);
                                  if (res?.error) showToast(res.error);
                                  else { showToast("Transfer Completed & Stock Deducted!"); refresh(); }
                                });
                              }} className="p-1.5 text-green-500 hover:text-green-400 hover:bg-green-500/20 rounded disabled:opacity-50" title="Receive / Complete Transfer">
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Audit Trail ─────────────────────────────────────────── */}
      <DomainAuditTable entityTypes={["inventory_transfer", "product"]} title="Transfer Audit Trail" />

      {/* ═══ TRANSFER MODAL ═══ */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm overflow-y-auto pt-10 pb-10" onClick={() => setTransferModal(false)}>
          <div className="glass-panel rounded-lg w-full max-w-2xl border-[#d4af37]/30 shadow-[0_10px_40px_rgba(212,175,55,0.15)] flex flex-col my-auto relative" onClick={(e) => e.stopPropagation()}>

            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <div>
                <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider">
                  <Truck className="w-5 h-5 mr-2" /> Create Transfer Ticket
                </h3>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Internal Logistics & Issuance</p>
              </div>
              <button onClick={() => setTransferModal(false)} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Source / Dest */}
              <div className="grid grid-cols-2 gap-6 relative">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#020408] border border-white/10 flex items-center justify-center z-10">
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
                <div className="space-y-2 bg-[#020408]/50 p-4 rounded border border-white/5">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold flex items-center gap-1"><Package className="w-3 h-3 text-blue-400" /> Source Location</label>
                  <select value={tfSource} onChange={(e) => setTfSource(e.target.value)} className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)]">
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2 bg-[#020408]/50 p-4 rounded border border-white/5">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold flex items-center gap-1"><ArrowLeftRight className="w-3 h-3 text-[#d4af37]" /> Destination</label>
                  <select value={tfDest} onChange={(e) => setTfDest(e.target.value)} className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)]">
                    <optgroup label="Trackable Locations">
                      {trackableLocations.map((l) => {
                        const isAllowed = tfItems.every(item => {
                          const p = products.find(prod => prod.id === item.product_id);
                          return p && p.product_category && l.allowed_categories.includes(p.product_category);
                        });
                        return <option key={l.id} value={l.id} disabled={!isAllowed}>{l.name} {!isAllowed && "(Invalid Category)"}</option>;
                      })}
                    </optgroup>
                    {sinkLocations.length > 0 && <optgroup label="Sink Locations (Issue-to-Consume)">{sinkLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</optgroup>}
                  </select>
                </div>
              </div>

              {/* Sink warning */}
              {isSinkDest && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded flex items-start gap-3">
                  <span className="text-blue-400 text-sm mt-0.5">ℹ</span>
                  <p className="text-xs text-blue-300"><strong>Issue-to-Consume Selected:</strong> Items transferred to a Sink Location will be immediately deducted from the global ledger as &quot;consumed&quot;.</p>
                </div>
              )}

              {/* Items */}
              <div className="space-y-3 border-t border-white/10 pt-4">
                <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Items to Move & Quantities</label>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                  {tfItems.map((item, i) => (
                    <div key={item.product_id} className="flex items-center justify-between bg-[#020408]/50 p-2 rounded border border-white/5">
                      <span className="text-sm text-gray-300 truncate pr-4">{item.name}</span>
                      <input type="number" placeholder="Qty" min={1} value={item.qty || ""} onChange={(e) => { const newItems = [...tfItems]; newItems[i].qty = Number(e.target.value); setTfItems(newItems); }}
                        className="w-24 bg-[#020408] border border-white/10 text-sm font-mono text-white rounded-md px-2 py-1 focus:outline-none focus:border-[rgba(212,175,55,0.5)] text-center" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Runner */}
              <div className="space-y-2 border-t border-white/10 pt-4">
                <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Assign Runner</label>
                <select value={tfRunner} onChange={(e) => setTfRunner(e.target.value)} className="w-full bg-[#020408] border border-white/10 text-sm text-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)]">
                  <option value="auto">Auto-Assign (Next Available)</option>
                  {runners.map((r) => <option key={r.id} value={r.id}>{r.legal_name} ({r.employee_id})</option>)}
                  <option value="direct">Direct Issue (Immediate / No Runner)</option>
                </select>
              </div>
            </div>

            <div className="p-5 border-t border-white/10 bg-[#020408]/80 rounded-b-lg flex justify-end gap-3">
              <button onClick={() => setTransferModal(false)} disabled={isPending} className="px-4 py-2 text-sm font-medium rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleCreateTransfer} disabled={isPending}
                className="px-6 py-2 text-sm font-bold rounded bg-[rgba(212,175,55,0.2)] text-[#d4af37] border border-[rgba(212,175,55,0.5)] hover:bg-[#d4af37] hover:text-[#020408] transition-all shadow-[0_0_10px_rgba(212,175,55,0.2)] disabled:opacity-40">
                {isPending ? "Dispatching…" : "Dispatch Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ LEDGER MODAL ═══ */}
      {ledgerModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm overflow-y-auto pt-10 pb-10" onClick={() => setLedgerModal(null)}>
          <div className="glass-panel rounded-lg w-full max-w-4xl border-[#d4af37]/30 shadow-[0_10px_40px_rgba(212,175,55,0.15)] flex flex-col my-auto relative" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <div>
                <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider">
                  <History className="w-5 h-5 mr-2" /> Ledger: {ledgerModal.productName}
                </h3>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">ID: {ledgerModal.productId.slice(0, 8)}…</p>
              </div>
              <button onClick={() => setLedgerModal(null)} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="border border-white/5 rounded overflow-hidden">
                {ledgerLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : ledgerEntries.length === 0 ? (
                  <p className="text-center text-gray-500 py-16 text-sm">No ledger entries for this product.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204]">
                      <tr>
                        {["Timestamp", "+/−", "Transaction Type", "Reference", "By"].map((h) => (
                          <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-xs">
                      {ledgerEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-white/[0.02]">
                          <td className="px-5 py-3 text-gray-400">{new Date(entry.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                          <td className={`px-5 py-3 text-center font-bold ${entry.quantity_delta > 0 ? "text-green-400" : entry.quantity_delta < 0 ? "text-red-400" : "text-gray-400"}`}>
                            {entry.quantity_delta > 0 ? `+${entry.quantity_delta}` : entry.quantity_delta}
                          </td>
                          <td className="px-5 py-3 text-gray-300">{entry.transaction_type.replace(/_/g, " ")}</td>
                          <td className="px-5 py-3 text-gray-500 text-[10px]">{entry.reference_id?.slice(0, 8) ?? "—"}</td>
                          <td className="px-5 py-3 text-gray-500">{entry.performed_by?.slice(0, 8) ?? "System"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-white/10 bg-[#020408]/80 rounded-b-lg flex justify-end">
              <button onClick={() => setLedgerModal(null)} className="px-6 py-2 text-sm font-medium rounded bg-white/5 text-gray-300 hover:bg-white/10 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 right-8 bg-green-500/20 border border-green-500/40 text-green-400 px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo, useTransition } from "react";
import { ClipboardList, FileText, Send, Clock, CheckCircle, Eye, X, Download, Mail, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import type { PurchaseOrderRow } from "./page";
import { updatePOStatusAction } from "../actions";

/* ── Status helpers ─────────────────────────────────────────────────── */
const STATUS_MAP: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  pending:    { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20", dot: "bg-gray-400", label: "Pending" },
  sent:       { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-400", label: "Sent" },
  partially_received: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", dot: "bg-yellow-400", label: "Partially Received" },
  completed:  { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", dot: "bg-green-400", label: "Completed" },
  cancelled:  { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", dot: "bg-red-400", label: "Cancelled" },
};

function statusPill(status: string) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full ${s.bg} ${s.text} ${s.border} border text-[10px] uppercase tracking-widest font-bold font-sans`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      <span>{s.label}</span>
    </span>
  );
}

function calcTotal(po: PurchaseOrderRow) {
  const dbTotal = Number(po.total_amount) || 0;
  if (dbTotal > 0) return dbTotal;
  return (po.purchase_order_items ?? []).reduce((sum, it) => {
    return sum + (it.products?.cost_price ?? 0) * it.expected_qty;
  }, 0);
}

/* ── Component ──────────────────────────────────────────────────────── */
export default function SupplierPOsClient({ purchaseOrders }: { purchaseOrders: PurchaseOrderRow[] }) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filterStatus === "all") return purchaseOrders;
    return purchaseOrders.filter((po) => po.status === filterStatus);
  }, [purchaseOrders, filterStatus]);

  /* KPIs */
  const draftCount = purchaseOrders.filter((p) => p.status === "pending").length;
  const sentCount = purchaseOrders.filter((p) => p.status === "sent").length;
  const partialCount = purchaseOrders.filter((p) => p.status === "partially_received").length;
  const completedCount = purchaseOrders.filter((p) => p.status === "completed").length;
  const cancelledCount = purchaseOrders.filter((p) => p.status === "cancelled").length;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  }

  return (
    <div className="space-y-8 pb-10">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-end">
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer"
        >
          <option value="all">Status: All</option>
          <option value="pending">⚪ Pending</option>
          <option value="sent">🔵 Sent</option>
          <option value="partially_received">🟡 Partially Received</option>
          <option value="completed">🟢 Completed</option>
          <option value="cancelled">🔴 Cancelled</option>
        </select>
      </div>

      {/* ═══ KPI Strip ═══ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: FileText, label: "Pending", value: draftCount, color: "gray" },
          { icon: Send, label: "Sent", value: sentCount, color: "blue" },
          { icon: Clock, label: "Partially Received", value: partialCount, color: "yellow" },
          { icon: CheckCircle, label: "Completed", value: completedCount, color: "green" },
          { icon: XCircle, label: "Cancelled", value: cancelledCount, color: "red" },
        ].map(({ icon: Icon, label, value, color }) => {
          const colorMap: Record<string, { bg: string; border: string; text: string }> = {
            gray:   { bg: "bg-gray-500/10", border: "border-gray-500/20", text: "text-gray-400" },
            blue:   { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
            yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" },
            green:  { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" },
            red:    { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
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
                  <p className={`text-xl font-orbitron font-bold ${color === "gray" ? "text-white" : c.text}`}>{value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ═══ PO Table ═══ */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[400px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
                <tr>
                  <th className="px-5 py-4 font-semibold">PO Number</th>
                  <th className="px-5 py-4 font-semibold">Supplier</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Total Value (RM)</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-500 text-xs">No purchase orders found.</td></tr>
                ) : filtered.map((po) => {
                  const total = calcTotal(po);
                  return (
                    <tr key={po.id} onClick={() => setSelectedPO(po)} className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                      <td className="px-5 py-4">
                        <span className="text-[#d4af37] font-semibold font-sans">{po.id.slice(0, 12)}</span>
                      </td>
                      <td className="px-5 py-4 text-gray-300 font-sans">{po.suppliers?.name ?? "—"}</td>
                      <td className="px-5 py-4 text-gray-400 font-sans">{po.created_at?.slice(0, 10) ?? "—"}</td>
                      <td className="px-5 py-4 text-gray-200 font-semibold">RM {total.toFixed(2)}</td>
                      <td className="px-5 py-4">{statusPill(po.status)}</td>
                      <td className="px-5 py-4 text-right">
                        <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded group-hover:text-[#d4af37] transition-colors" title="View PO Details">
                          <Eye className="w-4 h-4" />
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

      {/* ═══ PO Detail Modal ═══ */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
          <div className="glass-panel rounded-lg w-full max-w-4xl border-[#d4af37]/30 shadow-[0_10px_40px_rgba(212,175,55,0.15)] flex flex-col my-auto relative">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <div>
                <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider">
                  <FileText className="w-5 h-5 mr-2" /> {selectedPO.id.slice(0, 12)}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedPO.suppliers?.name ?? "—"} • {selectedPO.suppliers?.contact_email ?? ""}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {statusPill(selectedPO.status)}
                <button onClick={() => setSelectedPO(null)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="p-6">
              <div className="border border-white/5 rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Product</th>
                      <th className="px-5 py-3 font-semibold text-center">Qty Ordered</th>
                      {selectedPO.status !== "pending" && (
                        <th className="px-5 py-3 font-semibold text-center">Received Qty</th>
                      )}
                      <th className="px-5 py-3 font-semibold text-right">Unit Cost (RM)</th>
                      <th className="px-5 py-3 font-semibold text-right">Line Total (RM)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-xs">
                    {(selectedPO.purchase_order_items ?? []).map((item) => {
                      const unitCost = item.products?.cost_price ?? 0;
                      const lineTotal = unitCost * item.expected_qty;
                      return (
                        <tr key={item.id} className="hover:bg-white/[0.02]">
                          <td className="px-5 py-3 font-sans text-gray-200">
                            {item.products?.name ?? item.item_name ?? "—"}
                            <span className="text-gray-500 text-[10px] ml-1">{item.products?.id?.slice(0, 8) ?? ""}</span>
                          </td>
                          <td className="px-5 py-3 text-center text-gray-300">{item.expected_qty}</td>
                          {selectedPO.status !== "pending" && (
                            <td className="px-5 py-3 text-center text-blue-400 font-bold">{item.received_qty}</td>
                          )}
                          <td className="px-5 py-3 text-right text-gray-400">{unitCost.toFixed(2)}</td>
                          <td className="px-5 py-3 text-right text-[#d4af37] font-bold">{lineTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t border-white/10">
                    <tr>
                      <td colSpan={selectedPO.status !== "pending" ? 4 : 3} className="px-5 py-3 text-right text-xs text-gray-400 uppercase tracking-widest font-sans font-bold">Total PO Amount (RM)</td>
                      <td className="px-5 py-3 text-right text-[#d4af37] font-orbitron font-bold text-sm">RM {calcTotal(selectedPO).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Variance alert for partial */}
              {selectedPO.status === "partially_received" && (
                <div className="mt-4 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <p className="text-sm text-yellow-300 font-semibold">Variance Detected</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Some items were received short. You can keep the PO open for a future truck or close it short to clear the pipeline.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/10 bg-[#020408]/80 rounded-b-lg flex items-center justify-between">
              {selectedPO.status === "sent" && (
                <div className="text-[10px] text-gray-500 italic flex items-center">
                  <Send className="w-3 h-3 mr-1" /> This PO is pushed to the Runner Crew&apos;s &quot;Expected Deliveries&quot; queue.
                </div>
              )}
              <div className="flex space-x-3 ml-auto">
                <button onClick={() => setSelectedPO(null)} disabled={isPending} className="px-4 py-2 text-sm font-medium rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50">Close</button>
                <button onClick={() => showToast(`PDF generated for PO-${selectedPO.id.slice(0, 8)}.`)} disabled={isPending} className="px-4 py-2 text-sm font-bold rounded bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-all flex items-center space-x-2 disabled:opacity-50">
                  <Download className="w-4 h-4" /><span>Download PDF</span>
                </button>
                {selectedPO.status === "pending" && (
                  <button disabled={isPending} onClick={() => { 
                    startTransition(async () => {
                      const res = await updatePOStatusAction(selectedPO.id, "sent");
                      if (!res.error) {
                        showToast(`PO marked as Sent. Supplier ${selectedPO.suppliers?.contact_email ?? ""} notified.`);
                        setSelectedPO(null); 
                      } else {
                        showToast(res.error);
                      }
                    });
                  }} className="px-5 py-2 text-sm font-bold rounded bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/50 hover:bg-[#d4af37] hover:text-[#020408] transition-all shadow-[0_0_10px_rgba(212,175,55,0.2)] flex items-center space-x-2 disabled:opacity-50">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}<span>Approve &amp; Email PO</span>
                  </button>
                )}
                {selectedPO.status === "partially_received" && (
                  <>
                    <button disabled={isPending} onClick={() => { showToast("PO kept open."); setSelectedPO(null); }} className="px-4 py-2 text-sm font-bold rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 transition-all flex items-center space-x-2 disabled:opacity-50">
                      <Clock className="w-4 h-4" /><span>Keep Open</span>
                    </button>
                    <button disabled={isPending} onClick={() => { 
                      startTransition(async () => {
                        const res = await updatePOStatusAction(selectedPO.id, "completed");
                        if (!res.error) {
                          showToast("PO completed short. Missing units cleared."); 
                          setSelectedPO(null); 
                        } else {
                          showToast(res.error);
                        }
                      });
                    }} className="px-5 py-2 text-sm font-bold rounded bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all flex items-center space-x-2 disabled:opacity-50">
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}<span>Close PO Short</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Toast ═══ */}
      {toast && (
        <div className="fixed bottom-24 right-8 bg-green-500/20 border border-green-500/40 text-green-400 px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm text-sm font-semibold flex items-center space-x-2 z-50">
          <CheckCircle className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

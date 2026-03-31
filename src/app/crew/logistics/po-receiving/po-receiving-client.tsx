"use client";

import { useState, useTransition } from "react";
import { ClipboardCheck, CheckCircle2, Loader2, ChevronDown, ChevronRight, Package } from "lucide-react";
import { submitPoReceiving } from "../actions";

type PoItem = {
  id: string;
  item_name: string;
  expected_qty: number;
  received_qty: number;
  unit: string | null;
  barcode: string | null;
  product_id: string | null;
};

type PurchaseOrder = {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  total_amount: number | null;
  suppliers: { name: string } | null;
  purchase_order_items: PoItem[];
};

export default function PoReceivingClient({ orders }: { orders: PurchaseOrder[] }) {
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [expandedPo, setExpandedPo] = useState<string | null>(orders[0]?.id ?? null);
  const [completedPos, setCompletedPos] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function getQty(itemId: string, fallback: number) {
    return qtyMap[itemId] ?? fallback;
  }

  function handleQtyChange(itemId: string, val: string) {
    const n = parseInt(val, 10);
    setQtyMap((prev) => ({ ...prev, [itemId]: isNaN(n) ? 0 : Math.max(0, n) }));
  }

  function handleSubmit(po: PurchaseOrder) {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await submitPoReceiving(
          po.id,
          po.purchase_order_items.map((item) => ({
            itemId: item.id,
            received_qty: getQty(item.id, item.received_qty),
          }))
        );
        setCompletedPos((prev) => new Set(prev).add(po.id));
        setExpandedPo(null);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Submit failed.");
      }
    });
  }

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="glass-panel-gold p-4 rounded-2xl border border-[#d4af37]/30 flex items-center gap-3">
        <ClipboardCheck className="text-[#d4af37] shrink-0" size={24} />
        <div>
          <h2 className="text-xl font-cinzel text-[#d4af37] font-bold">PO Receiving</h2>
          <p className="text-xs text-gray-400">{orders.length} order{orders.length !== 1 ? "s" : ""} awaiting receipt</p>
        </div>
      </div>

      {errorMsg && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{errorMsg}</div>}

      {orders.length === 0 ? (
        <div className="p-12 text-center text-gray-600 text-sm bg-black/20 rounded-2xl border border-white/5">
          No purchase orders awaiting receipt
        </div>
      ) : (
        orders.map((po) => {
          const isExpanded = expandedPo === po.id;
          const isDone = completedPos.has(po.id);

          return (
            <div key={po.id} className={`bg-black/30 border rounded-2xl overflow-hidden transition ${isDone ? "border-emerald-500/30" : "border-white/8"}`}>
              {/* PO Header */}
              <button
                onClick={() => setExpandedPo(isExpanded ? null : po.id)}
                className="w-full flex items-center justify-between px-4 py-4 text-left min-h-[56px]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {isDone && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                    <p className="text-sm text-white font-semibold truncate">{po.suppliers?.name ?? "Unknown Supplier"}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {po.purchase_order_items.length} line{po.purchase_order_items.length !== 1 ? "s" : ""}
                    {po.total_amount && ` · RM ${po.total_amount.toFixed(2)}`}
                    <span className="ml-2">· {new Date(po.created_at).toLocaleDateString("en-MY", { day: "2-digit", month: "short" })}</span>
                  </p>
                </div>
                {isExpanded ? <ChevronDown size={16} className="text-gray-500 shrink-0 ml-2" /> : <ChevronRight size={16} className="text-gray-500 shrink-0 ml-2" />}
              </button>

              {/* Line items */}
              {isExpanded && (
                <div className="border-t border-white/5">
                  {po.notes && (
                    <div className="px-4 py-2 text-xs text-amber-300 bg-amber-500/5 border-b border-amber-500/10">{po.notes}</div>
                  )}
                  <div className="divide-y divide-white/5">
                    {po.purchase_order_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                        <Package size={14} className="text-gray-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{item.item_name}</p>
                          <p className="text-xs text-gray-500">Expected: {item.expected_qty} {item.unit ?? "pcs"}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-500">Rcv:</span>
                          <input
                            type="number"
                            min="0"
                            value={getQty(item.id, item.received_qty)}
                            onChange={(e) => handleQtyChange(item.id, e.target.value)}
                            className="w-16 text-center px-2 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm font-mono focus:border-[#d4af37] focus:outline-none [appearance:textfield] min-h-[44px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-4 py-4">
                    <button
                      onClick={() => handleSubmit(po)}
                      disabled={isPending || isDone}
                      className="w-full py-4 rounded-xl bg-[#d4af37] text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#c9a227] active:scale-95 transition disabled:opacity-60 min-h-[44px]"
                    >
                      {isPending ? <><Loader2 size={14} className="animate-spin" /> Submitting...</>
                        : isDone ? <><CheckCircle2 size={14} /> Received</>
                        : "Confirm Receipt"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

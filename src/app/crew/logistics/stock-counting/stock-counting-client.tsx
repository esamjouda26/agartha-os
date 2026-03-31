"use client";

import { useState, useTransition } from "react";
import { ScanLine, CheckCircle2, Loader2, AlertCircle, ClipboardList } from "lucide-react";
import { submitAuditCount } from "../actions";

type AuditItem = {
  id: string;
  product_id: string;
  actual_qty: number | null;
  status: string;
  products: { name: string; unit_of_measure: string | null } | null;
};

type Audit = {
  id: string;
  status: string;
  scheduled_date: string;
  notes: string | null;
  locations: { name: string } | null;
  inventory_audit_items: AuditItem[];
};

export default function StockCountingClient({ audits }: { audits: Audit[] }) {
  const [countMap, setCountMap]     = useState<Record<string, number>>({});
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeAudit, setActiveAudit] = useState<string | null>(audits[0]?.id ?? null);

  function handleSubmitItem(auditItemId: string) {
    const qty = countMap[auditItemId];
    if (qty === undefined || isNaN(qty) || qty < 0) {
      setErrorMsg("Enter a valid count before submitting.");
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await submitAuditCount(auditItemId, qty);
        setSubmittedIds((prev) => new Set(prev).add(auditItemId));
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Submit failed.");
      }
    });
  }

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="glass-panel-gold p-4 rounded-2xl border border-[#d4af37]/30">
        <div className="flex items-center gap-3">
          <ClipboardList className="text-[#d4af37] shrink-0" size={24} />
          <div>
            <h2 className="text-xl font-cinzel text-[#d4af37] font-bold">Stock Counting</h2>
            <p className="text-xs text-gray-400">Blind Audit — do not compare against system quantities</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2">
          <AlertCircle size={12} className="shrink-0" />
          Count what you physically see. System quantities are hidden to ensure accuracy.
        </div>
      </div>

      {errorMsg && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{errorMsg}</div>}

      {audits.length === 0 ? (
        <div className="p-12 text-center text-gray-600 text-sm bg-black/20 rounded-2xl border border-white/5">
          No active stock audits assigned
        </div>
      ) : (
        audits.map((audit) => {
          const items = audit.inventory_audit_items;
          const doneCount = items.filter((i) => submittedIds.has(i.id) || i.status === "completed").length;
          const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0;

          return (
            <div key={audit.id} className="bg-black/30 border border-white/8 rounded-2xl overflow-hidden">
              {/* Audit header */}
              <button
                onClick={() => setActiveAudit(activeAudit === audit.id ? null : audit.id)}
                className="w-full px-4 py-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-semibold">{audit.locations?.name ?? "Unknown Location"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(audit.scheduled_date).toLocaleDateString("en-MY", { weekday: "short", day: "2-digit", month: "short" })}
                      {" · "}{doneCount}/{items.length} counted
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#d4af37]">{Math.round(progress)}%</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#d4af37] rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </button>

              {audit.notes && (
                <div className="px-4 pb-2 text-xs text-gray-400 italic">{audit.notes}</div>
              )}

              {/* Item list */}
              {activeAudit === audit.id && (
                <div className="border-t border-white/5 divide-y divide-white/5">
                  {items.map((item) => {
                    const isDone = submittedIds.has(item.id) || item.status === "completed";
                    return (
                      <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${isDone ? "opacity-50" : ""}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{item.products?.name ?? item.product_id.slice(0, 8)}</p>
                          <p className="text-xs text-gray-500">{item.products?.unit_of_measure ?? "pcs"}</p>
                        </div>
                        {isDone ? (
                          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                            <CheckCircle2 size={14} />
                            <span>{countMap[item.id] ?? item.actual_qty ?? "—"}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              placeholder="0"
                              value={countMap[item.id] ?? ""}
                              onChange={(e) => {
                                const n = parseFloat(e.target.value);
                                setCountMap((prev) => ({ ...prev, [item.id]: isNaN(n) ? 0 : n }));
                              }}
                              className="w-20 text-center px-2 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm font-mono focus:border-[#d4af37] focus:outline-none [appearance:textfield] min-h-[44px]"
                            />
                            <button
                              onClick={() => handleSubmitItem(item.id)}
                              disabled={isPending || countMap[item.id] === undefined}
                              className="px-3 py-2 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] font-bold text-xs hover:bg-[#d4af37]/20 transition min-h-[44px] disabled:opacity-40"
                            >
                              {isPending ? <Loader2 size={12} className="animate-spin" /> : "Log"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

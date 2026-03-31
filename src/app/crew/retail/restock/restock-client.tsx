"use client";

import { useState, useTransition } from "react";
import { Package, Plus, Minus, Trash2, Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import ItemSearchSelect, { type SearchableItem } from "@/app/crew/components/item-search-select";
import CrewModal from "@/app/crew/components/crew-modal";
import { submitRetailRestockRequest } from "../actions";

type RestockTask = {
  id: string;
  status: string;
  priority: string;
  needed_qty: number;
  created_at: string;
  product_id: string;
  products: { name: string } | null;
};

type CartRow = SearchableItem & { needed_qty: number };

const STATUS_STYLES: Record<string, string> = {
  pending:     "text-amber-400 bg-amber-400/10 border-amber-400/30",
  in_progress: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  completed:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  cancelled:   "text-gray-500 bg-white/5 border-white/10",
};

export default function RetailRestockClient({
  tasks,
  products,
}: {
  tasks: RestockTask[];
  products: SearchableItem[];
}) {
  const [showModal, setShowModal] = useState(false);
  const [cart, setCart] = useState<CartRow[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelectItem(item: SearchableItem) {
    setCart((prev) => {
      if (prev.find((c) => c.id === item.id)) return prev;
      return [...prev, { ...item, needed_qty: 1 }];
    });
  }

  function adjustQty(id: string, delta: number) {
    setCart((prev) =>
      prev.flatMap((c) => {
        if (c.id !== id) return [c];
        const next = c.needed_qty + delta;
        return next <= 0 ? [] : [{ ...c, needed_qty: next }];
      })
    );
  }

  function handleSubmit() {
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      try {
        await submitRetailRestockRequest(
          cart.map((c) => ({ product_id: c.id, needed_qty: c.needed_qty }))
        );
        setCart([]);
        setShowModal(false);
        setSuccessMsg(`${cart.length} restock request${cart.length !== 1 ? "s" : ""} submitted.`);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Submit failed.");
      }
    });
  }

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="glass-panel-gold p-4 rounded-2xl border border-[#d4af37]/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="text-[#d4af37] shrink-0" size={24} />
          <div>
            <h2 className="text-xl font-cinzel text-[#d4af37] font-bold">Restock Request</h2>
            <p className="text-xs text-gray-400">Gift Shop Inventory</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d4af37] text-black font-bold text-xs hover:bg-[#c9a227] active:scale-95 transition min-h-[44px]"
        >
          <Plus size={14} /> New Request
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-300">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Task history */}
      <div className="bg-black/30 border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/8">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">My Recent Requests</span>
        </div>
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-sm">No restock requests yet</div>
        ) : (
          <div className="divide-y divide-white/5">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium truncate">{task.products?.name ?? task.product_id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Qty: {task.needed_qty} · {new Date(task.created_at).toLocaleDateString("en-MY", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${STATUS_STYLES[task.status] ?? STATUS_STYLES.pending}`}>
                  {task.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request modal */}
      <CrewModal open={showModal} onClose={() => !isPending && setShowModal(false)} title="New Restock Request">
        <div className="space-y-4 pt-1">
          <ItemSearchSelect
            items={products}
            onSelect={handleSelectItem}
            placeholder="Search product..."
            groupByField="category"
          />

          {/* Cart */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {cart.length === 0 ? (
              <p className="text-center text-gray-600 text-sm py-6">Add products to request above</p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-3 py-3 bg-black/20 rounded-xl border border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.name}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => adjustQty(item.id, -1)} className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center min-h-[44px] min-w-[44px]">
                      {item.needed_qty === 1 ? <Trash2 size={12} className="text-red-400" /> : <Minus size={12} className="text-gray-400" />}
                    </button>
                    <span className="text-white text-sm font-mono w-7 text-center">{item.needed_qty}</span>
                    <button onClick={() => adjustQty(item.id, 1)} className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center min-h-[44px] min-w-[44px]">
                      <Plus size={12} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{errorMsg}</div>
          )}

          {cart.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full py-4 rounded-xl bg-[#d4af37] text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#c9a227] active:scale-95 transition disabled:opacity-60 min-h-[44px]"
            >
              {isPending ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : `Submit ${cart.length} Item${cart.length !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </CrewModal>
    </div>
  );
}

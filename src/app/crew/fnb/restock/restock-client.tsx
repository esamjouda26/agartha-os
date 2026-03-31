"use client";

import { useState, useTransition } from "react";
import { Plus, Package, Clock, CheckCircle2, Loader2, X, Minus } from "lucide-react";
import ItemSearchSelect from "../../components/item-search-select";
import CrewModal from "../../components/crew-modal";
import { submitRestockRequest } from "../actions";
import type { SearchableItem } from "../../components/item-search-select";

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
  PENDING:     "text-amber-400 bg-amber-400/10 border-amber-400/30",
  IN_PROGRESS: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  COMPLETED:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  CANCELLED:   "text-red-400 bg-red-400/10 border-red-400/30",
};

export default function RestockClient({
  tasks,
  menuItems,
}: {
  tasks: RestockTask[];
  menuItems: SearchableItem[];
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

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev.map((c) => c.id === id ? { ...c, needed_qty: Math.max(1, c.needed_qty + delta) } : c)
    );
  }

  function removeRow(id: string) {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }

  function handleSubmit() {
    if (!cart.length) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      try {
        await submitRestockRequest(
          cart.map((c) => ({ product_id: c.id, needed_qty: c.needed_qty }))
        );
        setCart([]);
        setShowModal(false);
        setSuccessMsg(`${cart.length} item${cart.length > 1 ? "s" : ""} requested successfully.`);
      } catch (err: any) {
        setErrorMsg(err.message);
      }
    });
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="glass-panel-gold p-4 rounded-2xl border border-[#d4af37]/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="text-[#d4af37] shrink-0" size={24} />
          <div>
            <h2 className="text-xl font-cinzel text-[#d4af37] font-bold">Restock Request</h2>
            <p className="text-xs text-gray-400">Last 10 requests</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="min-w-[44px] min-h-[44px] px-4 rounded-xl bg-[#d4af37] text-black font-bold text-sm flex items-center gap-2 hover:bg-[#c9a227] active:scale-95 transition"
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* Feedback */}
      {successMsg && (
        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-300">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Task history */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-gray-500">
          <Package size={36} className="opacity-30" />
          <p className="text-sm">No restock requests yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-4 bg-black/30 border border-white/8 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {task.products?.name ?? task.product_id.slice(0, 8)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(task.created_at).toLocaleDateString()}
                  &nbsp;·&nbsp; Qty: {task.needed_qty}
                </p>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${STATUS_STYLES[task.status] ?? "text-gray-400 bg-white/5 border-white/10"}`}>
                {task.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}

      <CrewModal open={showModal} onClose={() => setShowModal(false)} title="New Restock Request">

            <ItemSearchSelect
              items={menuItems}
              onSelect={handleSelectItem}
              placeholder="Add item to request..."
              groupByField="category"
            />

            {/* Cart */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-2">
              {cart.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Use the search to add items.</p>
              ) : (
                cart.map((row) => (
                  <div key={row.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <p className="flex-1 text-sm text-white truncate">{row.name}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => updateQty(row.id, -1)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-bold w-5 text-center text-white">{row.needed_qty}</span>
                      <button onClick={() => updateQty(row.id, 1)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                        <Plus size={12} />
                      </button>
                      <button onClick={() => removeRow(row.id)} className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 text-red-400 transition">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!cart.length || isPending}
              className="mt-5 w-full py-4 rounded-2xl bg-[#d4af37] text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#c9a227] active:scale-95 transition disabled:opacity-50 min-h-[44px]"
            >
              {isPending ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : `Submit ${cart.length} Item${cart.length !== 1 ? "s" : ""}`}
            </button>
      </CrewModal>
    </div>
  );
}

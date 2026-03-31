"use client";

import { useState, useTransition } from "react";
import { ChefHat, Clock, CheckCircle2, Loader2, UtensilsCrossed } from "lucide-react";
import { markOrderComplete } from "../actions";

type OrderItem = {
  id: string;
  quantity: number;
  unit_price: number;
  fnb_menu_items: { id: string; name: string; linked_product_id: string | null } | null;
};

type Order = {
  id: string;
  created_at: string;
  zone_label: string | null;
  fnb_order_items: OrderItem[];
};

function elapsedLabel(createdAt: string): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

export default function KitchenClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleMarkComplete(orderId: string) {
    setCompletingId(orderId);
    startTransition(async () => {
      try {
        await markOrderComplete(orderId);
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } catch (err: any) {
        console.error(err);
      } finally {
        setCompletingId(null);
      }
    });
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="glass-panel-gold p-4 rounded-2xl border border-[#d4af37]/30 flex items-center gap-3">
        <ChefHat className="text-[#d4af37] shrink-0" size={24} />
        <div>
          <h2 className="text-xl font-cinzel text-[#d4af37] font-bold">Prep Batches</h2>
          <p className="text-xs text-gray-400">
            {orders.length === 0 ? "All clear" : `${orders.length} order${orders.length > 1 ? "s" : ""} in queue`}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <CheckCircle2 size={48} className="text-emerald-400 opacity-60" />
          <p className="text-gray-400 text-sm">Kitchen queue is clear.</p>
        </div>
      )}

      {/* Order cards */}
      {orders.map((order) => {
        // Only show prep-required items (no linked_product_id = made fresh)
        const prepItems = order.fnb_order_items.filter(
          (i) => i.fnb_menu_items && !i.fnb_menu_items.linked_product_id
        );
        if (prepItems.length === 0) return null;

        const isCompleting = completingId === order.id;
        const elapsed = elapsedLabel(order.created_at);
        const isOverdue = (Date.now() - new Date(order.created_at).getTime()) > 10 * 60 * 1000;

        return (
          <div
            key={order.id}
            className={`p-5 rounded-2xl border transition-all ${
              isOverdue
                ? "bg-red-500/5 border-red-500/30"
                : "bg-black/30 border-white/10"
            }`}
          >
            {/* Order header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                  #{order.id.slice(0, 8)}
                </p>
                {order.zone_label && (
                  <p className="text-xs text-gray-400 mt-0.5">{order.zone_label}</p>
                )}
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-bold ${isOverdue ? "text-red-400" : "text-gray-400"}`}>
                <Clock size={12} />
                {elapsed}
              </div>
            </div>

            {/* Items */}
            <ul className="space-y-2 mb-5">
              {prepItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between">
                  <span className="text-sm text-white">{item.fnb_menu_items?.name}</span>
                  <span className="text-xs font-mono text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded-full">
                    ×{item.quantity}
                  </span>
                </li>
              ))}
            </ul>

            {/* Complete button */}
            <button
              onClick={() => handleMarkComplete(order.id)}
              disabled={isPending || isCompleting}
              className="w-full py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500/20 active:scale-95 transition disabled:opacity-50 min-h-[44px]"
            >
              {isCompleting ? (
                <><Loader2 size={16} className="animate-spin" /> Completing...</>
              ) : (
                <><CheckCircle2 size={16} /> Mark Order Complete</>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

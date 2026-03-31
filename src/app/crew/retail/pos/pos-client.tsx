"use client";

import { useState, useTransition } from "react";
import { ShoppingBag, Trash2, Plus, Minus, Loader2, CheckCircle2, CreditCard, Banknote, ScanFace } from "lucide-react";
import ItemSearchSelect, { type SearchableItem } from "@/app/crew/components/item-search-select";
import CrewModal from "@/app/crew/components/crew-modal";
import { submitRetailOrder } from "../actions";

type CartItem = SearchableItem & { quantity: number };
type PaymentMethod = "cash" | "card" | "face_id";

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { id: "cash",    label: "Cash",    icon: Banknote },
  { id: "card",    label: "Card",    icon: CreditCard },
  { id: "face_id", label: "Face ID", icon: ScanFace },
];

export default function RetailPosClient({ catalogItems }: { catalogItems: SearchableItem[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = cart.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);

  function handleSelect(item: SearchableItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function adjustQty(id: string, delta: number) {
    setCart((prev) =>
      prev.flatMap((c) => {
        const next = c.quantity + delta;
        if (c.id !== id) return [c];
        if (next <= 0) return [];
        return [{ ...c, quantity: next }];
      })
    );
  }

  function handleCheckout() {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const result = await submitRetailOrder(
          cart.map((i) => ({ catalog_id: i.id, quantity: i.quantity, unit_price: i.price ?? 0 })),
          paymentMethod
        );
        setSuccessOrderId(result.orderId);
        setCart([]);
        setShowPayment(false);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Order failed.");
      }
    });
  }

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="glass-panel-gold p-4 rounded-2xl border border-[#d4af37]/30 flex items-center gap-3">
        <ShoppingBag className="text-[#d4af37] shrink-0" size={24} />
        <div>
          <h2 className="text-xl font-cinzel text-[#d4af37] font-bold">Retail POS</h2>
          <p className="text-xs text-gray-400">Gift Shop Walk-Up Terminal</p>
        </div>
      </div>

      {/* Search */}
      <ItemSearchSelect
        items={catalogItems}
        onSelect={handleSelect}
        placeholder="Search or scan item..."
        groupByField="category"
      />

      {/* Success banner */}
      {successOrderId && (
        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-300">
          <CheckCircle2 size={16} /> Order complete · Ref: <span className="font-mono">{successOrderId.slice(0, 8).toUpperCase()}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{errorMsg}</div>
      )}

      {/* Cart */}
      <div className="bg-black/30 border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Cart</span>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-300 transition">Clear</button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-sm">Cart is empty — search or scan to add items</div>
        ) : (
          <div className="divide-y divide-white/5">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{item.name}</p>
                  <p className="text-xs text-[#d4af37] font-mono">RM {((item.price ?? 0) * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => adjustQty(item.id, -1)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition min-h-[44px] min-w-[44px]">
                    {item.quantity === 1 ? <Trash2 size={12} className="text-red-400" /> : <Minus size={12} className="text-gray-400" />}
                  </button>
                  <span className="text-white text-sm font-mono w-6 text-center">{item.quantity}</span>
                  <button onClick={() => adjustQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition min-h-[44px] min-w-[44px]">
                    <Plus size={12} className="text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total + checkout */}
        {cart.length > 0 && (
          <div className="px-4 py-4 border-t border-white/8 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">{cart.reduce((s, i) => s + i.quantity, 0)} item{cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}</span>
              <span className="text-xl font-bold font-mono text-white">RM {total.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setShowPayment(true)}
              className="w-full py-4 rounded-xl bg-[#d4af37] text-black font-bold text-sm hover:bg-[#c9a227] active:scale-95 transition shadow-[0_4px_15px_rgba(212,175,55,0.3)] min-h-[44px] flex items-center justify-center gap-2"
            >
              <CreditCard size={16} /> Proceed to Payment
            </button>
          </div>
        )}
      </div>

      {/* Payment modal */}
      <CrewModal
        open={showPayment}
        onClose={() => !isPending && setShowPayment(false)}
        title="Select Payment"
      >
        <div className="space-y-5 pt-1">
          <div className="space-y-2">
            {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPaymentMethod(id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition min-h-[56px] ${
                  paymentMethod === id
                    ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]"
                    : "bg-black/20 border-white/10 text-white hover:bg-white/5"
                }`}
              >
                <Icon size={20} />
                <span className="font-semibold text-sm">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center py-3 border-t border-white/10">
            <span className="text-gray-400 text-sm">Total</span>
            <span className="text-2xl font-bold font-mono text-white">RM {total.toFixed(2)}</span>
          </div>

          {errorMsg && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{errorMsg}</div>}

          <button
            onClick={handleCheckout}
            disabled={isPending}
            className="w-full py-4 rounded-xl bg-[#d4af37] text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#c9a227] active:scale-95 transition disabled:opacity-60 min-h-[44px]"
          >
            {isPending ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : `Confirm · RM ${total.toFixed(2)}`}
          </button>
        </div>
      </CrewModal>
    </div>
  );
}

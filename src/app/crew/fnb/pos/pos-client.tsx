"use client";

import { useState } from "react";
import { UtensilsCrossed, CreditCard, Trash2, Plus, Minus, Tag, Banknote, ScanFace } from "lucide-react";
import ItemSearchSelect, { SearchableItem } from "../../components/item-search-select";
import { submitFnbOrder, validatePromoCode } from "../actions";

export default function PosClient({ menuItems }: { menuItems: SearchableItem[] }) {
  const [cart, setCart] = useState<(SearchableItem & { quantity: number })[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Promo Constraints
  const [promoInput, setPromoInput] = useState("");
  const [promoState, setPromoState] = useState<{ id: string, discount: number, description?: string | null } | null>(null);
  const [promoError, setPromoError] = useState("");

  // Payment UI Architecture
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "face_id" | null>(null);

  const subTotal = cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
  const totalAmount = Math.max(0, subTotal - (promoState?.discount || 0));

  function handleSelectItem(item: SearchableItem) {
    setCart((prev) => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setPromoState(null);
    setPromoInput("");
  }

  function updateQuantity(id: string, delta: number) {
    setCart((prev) => prev.map(i => {
      if (i.id === id) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }));
    setPromoState(null);
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter(i => i.id !== id));
    setPromoState(null);
  }

  async function applyPromo() {
    setPromoError("");
    if (!promoInput) return;
    
    if (subTotal === 0) {
       setPromoError("Cart is empty.");
       return;
    }

    try {
      const res = await validatePromoCode(promoInput, subTotal);
      if (res.error) {
        setPromoError(res.error);
      } else {
        setPromoState({ id: res.id!, discount: res.discountAmount!, description: res.description });
      }
    } catch (err: any) {
      setPromoError("Validation failed to resolve.");
    }
  }

  async function handleCheckout() {
    if (cart.length === 0 || !paymentMethod) return;
    setIsSubmitting(true);
    
    try {
      const payload = cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price || 0,
        linked_product_id: item.raw?.linked_product_id || null
      }));

      await submitFnbOrder(payload, totalAmount, promoState?.id);
      
      setCart([]);
      setPaymentMethod(null);
      setPromoState(null);
      setPromoInput("");
      
      alert(`Order fully settled via ${paymentMethod.toUpperCase()}`);
    } catch (err: any) {
      alert("AUDIT FAILURE: " + err.message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold px-2 flex items-center gap-2">
        <UtensilsCrossed className="w-6 h-6" /> F&B POS
      </h1>
      
      <ItemSearchSelect items={menuItems} onSelect={handleSelectItem} placeholder="Search menu items..." disabled={isSubmitting} />

      <div className="glass-panel-gold p-4 rounded-2xl border border-white/10 flex flex-col space-y-4">
        <div className="flex justify-between items-center border-b border-[#d4af37]/20 pb-2">
          <h2 className="text-xs uppercase tracking-widest text-[#d4af37] font-bold">Current Cart</h2>
          <span className="text-xs font-mono text-gray-400">{cart.length} Items</span>
        </div>
        
        <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-20">
              <p className="text-gray-500 text-sm">Cart is empty.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                <div className="flex-1">
                  <p className="text-white text-sm font-medium leading-tight">{item.name}</p>
                  <p className="text-[#d4af37] text-xs font-mono mt-0.5">${(item.price || 0).toFixed(2)}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white/5 rounded-lg border border-white/10">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 text-gray-400 hover:text-white transition"><Minus className="w-4 h-4" /></button>
                    <span className="w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 text-gray-400 hover:text-white transition"><Plus className="w-4 h-4" /></button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="p-2 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Promo Code Sub-system */}
        <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-2">
          <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1">
            <Tag className="w-3 h-3" /> Promotions
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Promo Code" 
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              disabled={isSubmitting || promoState !== null}
              className="flex-1 bg-black/40 border border-white/10 text-white p-2 rounded-lg text-sm font-mono focus:border-[#d4af37] outline-none disabled:opacity-50 uppercase" 
            />
            {!promoState ? (
              <button 
                type="button" 
                onClick={applyPromo}
                className="bg-white/10 text-white px-4 rounded-lg text-sm font-bold hover:bg-white/20 transition active:scale-95 disabled:opacity-50"
              >
                Apply
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => { setPromoState(null); setPromoInput(""); }}
                className="bg-red-500/20 text-red-400 px-4 rounded-lg text-sm font-bold hover:bg-red-500/30 transition active:scale-95"
              >
                Clear
              </button>
            )}
          </div>
          {promoError && <p className="text-xs text-red-400 mt-1 pl-1">{promoError}</p>}
          {promoState && <p className="text-xs text-[#d4af37] mt-1 pl-1">Target Discount Applied: -${promoState.discount.toFixed(2)}</p>}
        </div>

        {/* Payment Gateways Framework */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold align-middle">Checkout Method</label>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setPaymentMethod("cash")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${paymentMethod === 'cash' ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}
            >
              <Banknote className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Cash</span>
            </button>
            <button 
              onClick={() => setPaymentMethod("card")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${paymentMethod === 'card' ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Card</span>
            </button>
            <button 
              onClick={() => setPaymentMethod("face_id")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${paymentMethod === 'face_id' ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}
            >
              <ScanFace className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Biometric</span>
            </button>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-4 mt-auto">
          <div className="flex justify-between items-center text-white font-bold text-lg mb-4 px-1">
            <span>Total</span>
            <div className="text-right">
              {promoState && <span className="text-sm line-through text-gray-500 mr-2">${subTotal.toFixed(2)}</span>}
              <span className="font-mono text-[#d4af37]">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
          <button 
            disabled={cart.length === 0 || !paymentMethod || isSubmitting}
            onClick={handleCheckout}
            className="w-full py-5 bg-gradient-to-r from-[#d4af37] to-[#806b45] text-space font-bold tracking-widest uppercase rounded-xl active:scale-[0.98] transition shadow-[0_4px_15px_rgba(212,175,55,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Processing..." : <><CreditCard className="w-5 h-5" /> Process Payment</>}
          </button>
        </div>
      </div>
    </div>
  );
}

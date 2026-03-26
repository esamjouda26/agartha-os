"use client";

import { useState } from "react";
import { PackagePlus, Send, Trash2, Plus, Minus } from "lucide-react";
import ItemSearchSelect, { SearchableItem } from "../../components/item-search-select";
import { submitRestockTask } from "../actions";

export default function RestockClient({ products, locationId }: { products: SearchableItem[], locationId: string }) {
  const [cart, setCart] = useState<(SearchableItem & { quantity: number })[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSelectItem(item: SearchableItem) {
    setCart((prev) => {
      if (prev.find(i => i.id === item.id)) return prev;
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function updateQuantity(id: string, delta: number) {
    setCart((prev) => prev.map(i => {
      if (i.id === id) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }));
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter(i => i.id !== id));
  }

  async function handleComplete() {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    
    try {
      const payload = cart.map(item => ({
        product_id: item.id,
        needed_qty: item.quantity
      }));
      await submitRestockTask(locationId, payload);
      setCart([]);
      alert("Restock requests dynamically queued for Logistics Runner dispatch.");
    } catch (err: any) {
      alert("AUDIT FAILURE: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between px-2">
        <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold flex items-center gap-2">
          <PackagePlus className="w-6 h-6" /> Restock
        </h1>
      </div>

      <div className="glass-panel-gold p-5 rounded-2xl border border-white/10">
        <h2 className="text-xs uppercase tracking-widest text-[#d4af37] font-bold mb-4">Build Request Cart</h2>
        
        <ItemSearchSelect items={products} onSelect={handleSelectItem} placeholder="Search product catalog..." disabled={isSubmitting} />

        <div className="min-h-[150px] flex flex-col border-t border-white/10 pt-4 mt-6 gap-2">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500 text-sm">No items in restock request yet.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-black/40 border border-white/5 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-white">{item.name}</p>
                  {item.barcode && <p className="text-[10px] text-gray-500 font-mono mt-1">BC: {item.barcode}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white/5 rounded-lg border border-white/10">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 text-gray-400 hover:text-white transition"><Minus className="w-4 h-4" /></button>
                    <span className="w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 text-gray-400 hover:text-white transition"><Plus className="w-4 h-4" /></button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="p-2 text-red-500/60 hover:text-red-400 transition ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button 
          disabled={cart.length === 0 || isSubmitting}
          onClick={handleComplete}
          className="w-full mt-6 py-5 bg-gradient-to-r from-[#d4af37] to-[#806b45] text-space font-bold tracking-widest uppercase rounded-xl active:scale-[0.98] transition shadow-[0_4px_15px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? "Dispatching..." : <><Send className="w-5 h-5" /> Submit to Logistics</>}
        </button>
      </div>
    </div>
  );
}

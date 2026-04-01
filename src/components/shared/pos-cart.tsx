"use client";

import { CreditCard, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

const mockCartItems = [
  { id: "1", name: "Premium Coffee", qty: 2, price: 4.50 },
  { id: "2", name: "Croissant", qty: 1, price: 3.25 },
];

export function PosCart() {
  const subtotal = mockCartItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="w-full max-w-sm rounded-xl border bg-white border-gray-200 shadow-sm dark:bg-black/40 dark:border-white/10 overflow-hidden flex flex-col h-full max-h-[600px] transition-colors">
      <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-black/60">
        <div className="flex items-center gap-2">
          <ShoppingBag className="text-yellow-700 dark:text-[#d4af37] h-5 w-5" />
          <h2 className="text-sm font-bold tracking-widest uppercase text-gray-900 dark:text-white font-cinzel">Current Order</h2>
        </div>
        <Badge variant="gold">Table 4</Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mockCartItems.map(item => (
          <div key={item.id} className="flex flex-col gap-2 pb-4 border-b border-gray-100 dark:border-white/5 last:border-0 last:pb-0">
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-900 dark:text-white font-medium">{item.name}</span>
              <span className="text-sm text-gray-900 dark:text-white font-mono">${(item.price * item.qty).toFixed(2)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center bg-gray-50 dark:bg-black/60 rounded border border-gray-200 dark:border-white/10 overflow-hidden">
                <button className="px-3 min-h-[36px] text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition">
                  <Minus className="h-4 w-4" />
                </button>
                <div className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">{item.qty}</div>
                <button className="px-3 min-h-[36px] text-yellow-700 dark:text-[#d4af37] hover:bg-yellow-50 dark:hover:bg-[#d4af37]/20 transition">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-500 p-2 transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/80 space-y-3">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Subtotal</span>
          <span className="font-mono">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Tax (8%)</span>
          <span className="font-mono">${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-yellow-700 dark:text-[#d4af37] pt-2 border-t border-gray-200 dark:border-white/5">
          <span>Total</span>
          <span className="font-orbitron" style={{ fontFamily: "var(--font-orbitron, Orbitron, sans-serif)" }}>
            ${total.toFixed(2)}
          </span>
        </div>
        
        <div className="pt-2 grid grid-cols-2 gap-2">
          <Button variant="outline" className="w-full text-xs box-border">
            Cancel
          </Button>
          <Button variant="gold" className="w-full focus:ring-yellow-700/50 dark:focus:ring-[#d4af37]/50">
            <CreditCard className="mr-2 h-4 w-4" /> Pay
          </Button>
        </div>
      </div>
    </div>
  );
}

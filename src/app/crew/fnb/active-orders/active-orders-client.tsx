"use client";

import { useState } from "react";
import { ChefHat, CheckSquare, Clock } from "lucide-react";
import { completeFnbOrder } from "../actions";

interface Order {
  id: string;
  status: string;
  created_at: string;
  zone_label: string | null;
  notes: string | null;
  items: { name: string; quantity: number }[];
}

export default function ActiveOrdersClient({ orders }: { orders: Order[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function handleCompleteOrder(orderId: string) {
    setProcessingId(orderId);
    try {
      await completeFnbOrder(orderId);
    } catch (err: any) {
      alert("AUDIT FAILURE: " + err.message);
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold px-2 flex items-center gap-2">
        <ChefHat className="w-6 h-6" /> Kitchen Display System (KDS)
      </h1>
      
      {orders.length === 0 ? (
        <div className="glass-panel-gold p-12 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-gray-500">
          <CheckSquare className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-mono text-sm tracking-widest uppercase">No Active Orders in Queue</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => {
            const timeElapsed = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000);
            
            return (
              <div key={order.id} className="bg-black/40 border border-[#d4af37]/30 rounded-2xl flex flex-col overflow-hidden shadow-[0_4px_15px_rgba(212,175,55,0.05)]">
                <div className="bg-[#d4af37]/10 p-3 flex justify-between items-center border-b border-[#d4af37]/20">
                  <span className="font-mono text-xs font-bold text-[#d4af37]">ORD-{order.id.split('-')[0].toUpperCase()}</span>
                  <div className={`flex items-center gap-1 text-xs font-bold ${timeElapsed > 15 ? 'text-red-400' : 'text-gray-400'}`}>
                    <Clock className="w-3 h-3" /> {timeElapsed} min
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col space-y-4">
                  <div className="space-y-2 flex-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-sm border-b border-white/5 pb-1">
                        <span className="text-white">{item.name}</span>
                        <span className="text-[#d4af37] font-bold font-mono">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1">Kitchen Notes:</p>
                      <p className="text-xs text-white/80">{order.notes}</p>
                    </div>
                  )}

                  <button 
                    disabled={processingId === order.id}
                    onClick={() => handleCompleteOrder(order.id)}
                    className="w-full py-3 bg-[#d4af37]/20 hover:bg-[#d4af37] text-[#d4af37] hover:text-black font-bold tracking-widest uppercase rounded-xl transition duration-300 disabled:opacity-50"
                  >
                    {processingId === order.id ? "Sealing..." : "Mark Completed"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

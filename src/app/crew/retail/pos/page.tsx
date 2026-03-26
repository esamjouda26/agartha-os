import { Store, ScanLine, Search, CreditCard } from "lucide-react";

export default function RetailPosPage() {
  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold px-2 flex items-center gap-2">
        <Store className="w-6 h-6" /> Retail POS
      </h1>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            className="w-full bg-black/40 border border-white/10 p-3 pl-10 rounded-xl text-white outline-none focus:border-[#d4af37]" 
            placeholder="Search catalog..." 
          />
        </div>
        <button className="bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] p-3 rounded-xl flex items-center justify-center active:scale-95 transition">
          <ScanLine className="w-6 h-6" />
        </button>
      </div>

      <div className="glass-panel-gold p-4 rounded-2xl min-h-[300px] border border-white/10 flex flex-col">
        <h2 className="text-xs uppercase tracking-widest text-[#d4af37] font-bold mb-4">Current Cart</h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Cart is empty. Scan or search to add items.</p>
        </div>
        
        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="flex justify-between items-center text-white font-bold text-lg mb-4">
            <span>Total</span>
            <span>$0.00</span>
          </div>
          <button className="w-full py-4 bg-[#d4af37] text-space font-bold tracking-widest uppercase rounded-xl active:scale-[0.98] transition shadow-[0_4px_15px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2">
            <CreditCard className="w-5 h-5" /> Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

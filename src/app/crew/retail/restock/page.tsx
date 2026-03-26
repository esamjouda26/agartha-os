import { PackagePlus, ScanLine, Search, Send } from "lucide-react";

export default function RetailRestockPage() {
  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between px-2">
        <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold flex items-center gap-2">
          <PackagePlus className="w-6 h-6" /> Restock
        </h1>
      </div>

      <div className="glass-panel-gold p-5 rounded-2xl border border-white/10">
        <h2 className="text-xs uppercase tracking-widest text-[#d4af37] font-bold mb-4">Build Request Cart</h2>
        
        <div className="flex gap-2 mb-6">
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

        <div className="min-h-[150px] flex items-center justify-center border-t border-white/10 pt-4">
          <p className="text-gray-500 text-sm">No items in restock request yet.</p>
        </div>

        <button className="w-full mt-4 py-4 bg-[#d4af37] text-space font-bold tracking-widest uppercase rounded-xl active:scale-[0.98] transition shadow-[0_4px_15px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2">
          <Send className="w-5 h-5" /> Submit to Logistics
        </button>
      </div>
      
      <div className="px-2">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-4">Recent Requests</h2>
        <p className="text-sm text-gray-600">No recent requests.</p>
      </div>
    </div>
  );
}

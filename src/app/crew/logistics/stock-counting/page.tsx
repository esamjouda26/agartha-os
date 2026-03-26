import { ClipboardList, ScanLine, Send } from "lucide-react";

export default function StockCountingPage() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold px-2 flex items-center gap-2">
        <ClipboardList className="w-6 h-6" /> Blind Audits
      </h1>

      <div className="glass-panel-gold p-6 rounded-2xl border border-white/10 space-y-6">
        <div>
          <h2 className="text-white font-medium mb-1">Active Audit Task</h2>
          <p className="text-sm text-gray-400 mb-4">Location: Main Warehouse A</p>
          <div className="flex gap-2">
            <button className="flex-1 py-4 bg-[#d4af37]/10 border border-[#d4af37]/40 text-[#d4af37] rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] transition">
              <ScanLine className="w-5 h-5" /> Scan Item
            </button>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Physical Count</label>
            <input 
              type="number"
              placeholder="Enter Exact Quantity Found..."
              className="w-full bg-black/40 border border-[#d4af37]/30 text-white p-4 rounded-xl outline-none focus:border-[#d4af37] text-lg font-mono font-bold" 
            />
          </div>
        </div>

        <button className="w-full mt-4 py-4 bg-[#d4af37] text-space font-bold tracking-widest uppercase rounded-xl active:scale-[0.98] transition shadow-[0_4px_15px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2">
          <Send className="w-5 h-5" /> Submit Count
        </button>
      </div>
    </div>
  );
}

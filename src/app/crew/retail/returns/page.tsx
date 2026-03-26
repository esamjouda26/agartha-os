import { Undo2, ScanLine, Camera, CheckCircle2 } from "lucide-react";

export default function ReturnsRefundsPage() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold px-2 flex items-center gap-2">
        <Undo2 className="w-6 h-6" /> Returns & Refunds
      </h1>

      <div className="glass-panel-gold p-6 rounded-2xl border border-white/10 space-y-6">
        <button className="w-full py-4 bg-[#d4af37]/10 border border-[#d4af37]/40 text-[#d4af37] rounded-xl flex items-center justify-center gap-3">
          <ScanLine className="w-5 h-5" /> Scan Receipt / Order Ref
        </button>

        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Item Condition</label>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-3 bg-[#d4af37] text-space font-bold rounded-lg text-sm transition">SEALED (Refund)</button>
              <button className="py-3 bg-black/40 border border-white/10 text-gray-400 hover:text-white font-bold rounded-lg text-sm transition">OPENED (Exchange)</button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-[#d4af37] font-bold">Item Evidence (Required)</label>
            <button className="w-full border-2 border-dashed border-[#d4af37]/40 text-[#d4af37]/60 hover:text-[#d4af37] rounded-xl p-4 flex justify-center items-center gap-2 transition">
              <Camera className="w-6 h-6" />
            </button>
          </div>
        </div>

        <button className="w-full py-5 bg-[#d4af37] text-space font-bold tracking-widest uppercase rounded-xl active:scale-[0.98] transition shadow-[0_4px_15px_rgba(212,175,55,0.3)] disabled:opacity-50 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-5 h-5"/> Process Return
        </button>
      </div>
    </div>
  );
}

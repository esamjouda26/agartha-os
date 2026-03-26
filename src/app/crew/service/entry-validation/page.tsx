import { TicketCheck, Search, ScanLine, UserCheck } from "lucide-react";

export default function EntryValidationPage() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold px-2 flex items-center gap-2">
        <TicketCheck className="w-6 h-6" /> Entry Validation
      </h1>

      <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
        <button className="py-3 bg-[#d4af37] text-space rounded-lg text-sm font-bold tracking-wider shadow-md flex justify-center items-center gap-2">
          <ScanLine className="w-4 h-4"/> SCN
        </button>
        <button className="py-3 text-gray-400 hover:text-white flex justify-center items-center gap-2 rounded-lg text-sm font-bold tracking-wider">
          <Search className="w-4 h-4"/> REF
        </button>
      </div>

      <div className="glass-panel-gold p-6 rounded-2xl border border-white/10 text-center space-y-4">
        <div className="w-32 h-32 mx-auto rounded-xl border-2 border-dashed border-[#d4af37]/50 flex items-center justify-center mb-6 relative overflow-hidden">
          <ScanLine className="w-10 h-10 text-[#d4af37]/50" />
        </div>
        <h2 className="text-white font-medium">Ready to Scan</h2>
        <p className="text-sm text-gray-400">Position the guest's QR code within the frame.</p>

        <button className="w-full mt-4 py-4 bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] font-bold tracking-widest uppercase rounded-xl active:scale-[0.98] transition flex items-center justify-center gap-2">
          <ScanLine className="w-5 h-5" /> Open Camera
        </button>
      </div>
    </div>
  );
}

import { PackageCheck, ScanLine, CheckSquare } from "lucide-react";

export default function POReceivingPage() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold px-2 flex items-center gap-2">
        <PackageCheck className="w-6 h-6" /> PO Receiving
      </h1>

      <div className="glass-panel-gold p-6 rounded-2xl border border-white/10 space-y-6">
        <button className="w-full py-4 bg-[#d4af37]/10 border border-[#d4af37]/40 text-[#d4af37] rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] transition">
          <ScanLine className="w-5 h-5" /> Scan PO Document
        </button>

        <div className="border-t border-white/10 pt-6">
          <h2 className="text-white font-medium mb-1">Incoming Shipment</h2>
          <p className="text-sm text-gray-400">Scan items as they come off the truck to verify received quantities against the PO.</p>
        </div>

        <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
          <p className="text-center text-gray-500 text-sm py-4">No active PO loaded.</p>
        </div>
      </div>
    </div>
  );
}

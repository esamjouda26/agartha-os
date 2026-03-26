import { Truck, Navigation } from "lucide-react";

export default function RestockQueuePage() {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold px-2 flex items-center gap-2">
        <Truck className="w-6 h-6" /> Restock Queue
      </h1>

      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="glass-panel-gold p-5 rounded-2xl border border-white/10 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${i === 1 ? 'bg-red-500' : 'bg-[#d4af37]'}`} />
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-white font-bold text-lg">Zone {i + 1} Kiosk</h3>
                <p className={`text-xs uppercase tracking-wider mt-1 ${i === 1 ? 'text-red-400 font-bold' : 'text-[#d4af37]'}`}>
                  {i === 1 ? 'Critical Priority' : 'Normal Priority'}
                </p>
              </div>
              <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-1 rounded">10 mins ago</span>
            </div>
            
            <div className="mb-6 space-y-1">
              <p className="text-sm text-gray-300">24x Bottled Water</p>
              <p className="text-sm text-gray-300">10x Agartha Bear Plush</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button className="py-3 bg-white/5 border border-white/10 text-gray-400 font-bold tracking-wider rounded-xl uppercase active:scale-95 transition">
                Reject
              </button>
              <button className="py-3 bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] font-bold tracking-wider rounded-xl uppercase active:scale-95 transition flex items-center justify-center gap-2">
                <Navigation className="w-4 h-4" /> Accept Task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

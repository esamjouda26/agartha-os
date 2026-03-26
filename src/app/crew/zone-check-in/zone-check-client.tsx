"use client";

import { useState, useTransition } from "react";
import { QrCode, LogOut, CheckCircle2, MapPin } from "lucide-react";
import { checkIntoZone, checkOutOfZone } from "./actions";

export default function ZoneCheckClient({ 
  zones, 
  activeLocation 
}: { 
  zones: any[],
  activeLocation: any | null
}) {
  const [selectedZone, setSelectedZone] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCheckIn = () => {
    if (!selectedZone) return;
    startTransition(async () => {
      try {
        await checkIntoZone(selectedZone);
      } catch(err: any) {
         alert("AUDIT FAILURE: " + err.message);
      }
    });
  };

  const handleCheckOut = () => {
    if (!activeLocation) return;
    startTransition(async () => {
      try {
        await checkOutOfZone(activeLocation.id);
        setSelectedZone("");
      } catch(err: any) {
         alert("AUDIT FAILURE: " + err.message);
      }
    });
  };

  return (
    <div className="glass-panel-gold p-6 rounded-2xl text-center shadow-lg border border-[#d4af37]/30 transition-all duration-300">
      <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold mb-2">Zone Telemetry</h1>
      <p className="text-sm text-gray-400 mb-8">Scan physical location QR or manually declare assignment coordinates.</p>
      
      {activeLocation ? (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-32 h-32 mx-auto rounded-full border-4 border-green-500/50 flex flex-col items-center justify-center bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <CheckCircle2 className="w-12 h-12 text-green-400 mb-2" />
            <span className="text-[10px] font-bold text-green-400 tracking-widest uppercase">Verified</span>
          </div>
          
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-left">
            <h3 className="text-xs text-[#d4af37] font-bold uppercase tracking-widest mb-1">Current Position</h3>
            <p className="text-lg text-white font-semibold flex items-center gap-2">
               <MapPin className="w-4 h-4 text-gray-400" /> {activeLocation.zones?.name || "Unknown Zone"}
            </p>
            <p className="text-[10px] text-gray-500 font-mono mt-1 mt-2 tracking-widest uppercase">
               Entry: {new Date(activeLocation.scanned_at).toLocaleTimeString()}
            </p>
          </div>

          <button 
            disabled={isPending}
            onClick={handleCheckOut}
            className="w-full py-4 bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-bold tracking-widest uppercase rounded-xl active:scale-95 transition-all hover:bg-red-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" /> Execute Exit Log
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="w-40 h-40 rounded-xl border-2 border-[#d4af37]/50 flex items-center justify-center bg-black/40 relative overflow-hidden shadow-inner">
              <div className="absolute inset-x-0 h-1 bg-[#d4af37] opacity-60 shadow-[0_0_15px_3px_#d4af37] animate-scan" />
              <QrCode className="w-12 h-12 text-[#d4af37]/30" />
            </div>
          </div>
          
          <div className="text-left space-y-2">
             <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">Manual Override</label>
             <select 
               value={selectedZone}
               onChange={(e) => setSelectedZone(e.target.value)}
               className="w-full bg-[#020408] border border-white/10 text-white text-sm rounded-xl p-4 focus:outline-none focus:border-[#d4af37] appearance-none"
             >
                <option value="" disabled>Select Sector Designation...</option>
                {zones.map((z: any) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
             </select>
          </div>

          <button 
            disabled={isPending || !selectedZone}
            onClick={handleCheckIn}
            className="w-full py-4 bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] text-sm font-bold tracking-widest uppercase rounded-xl active:scale-95 transition-all hover:bg-[#d4af37]/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
          >
            <MapPin className="w-5 h-5" /> Declare Position
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition, useEffect } from "react";
import { Clock, MapPin, Camera, CheckCircle2, UserCheck, AlertCircle, LogOut } from "lucide-react";
import { submitCheckIn, submitCheckOut } from "./actions";

export default function AttendanceClient({ 
  todaysShift 
}: { 
  todaysShift: any 
}) {
  const [isPending, startTransition] = useTransition();
  const [gpsMock, setGpsMock] = useState("Fetching GPS Coordinates...");
  
  // A check-in is active strictly if clock_in exists but clock_out remains unsealed.
  const isClockedIn = todaysShift && todaysShift.clock_in && !todaysShift.clock_out;
  const isCompleted = todaysShift && todaysShift.clock_out;

  useEffect(() => {
    // Simulator mock to mimic hardware response block
    const timer = setTimeout(() => setGpsMock("Verified: 24.3, 45.1 (Agartha Zone 1)"), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleClockIn = () => {
    if (!confirm("Are you securely matching the designated biometric portal parameters?")) return;
    
    startTransition(async () => {
       try {
         await submitCheckIn("biometric_face_id_string_hash_mock_IN", gpsMock); 
       } catch(err: any) {
         alert("AUDIT FAILURE: " + err.message);
       }
    });
  }

  const handleClockOut = () => {
     if (!confirm("A Selfie is required to finalize check_out telemetries. Proceed?")) return;
     
     startTransition(async () => {
       try {
         await submitCheckOut(todaysShift.id, "biometric_face_id_string_hash_mock_OUT", gpsMock);
       } catch(err: any) {
         alert("AUDIT FAILURE: " + err.message);
       }
    });
  }

  return (
    <div className="glass-panel-gold p-6 rounded-2xl text-center shadow-lg border border-[#d4af37]/30 relative overflow-hidden">
      {/* Visual background indicator for clocked-in status */}
      {isClockedIn && <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />}
      
      <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold mb-2">Shift Telemetry</h1>
      <p className="text-sm text-gray-400">Time clock bounds and hardware integration logic.</p>
      
      {/* Shift Data block */}
      <div className="my-6 bg-black/40 border border-white/10 rounded-xl p-4 text-left space-y-2">
        <h3 className="text-[10px] text-[#d4af37] font-bold uppercase tracking-widest border-b border-white/10 pb-2 mb-3">Daily Assignment</h3>
        {todaysShift ? (
          <>
            <p className="text-sm text-gray-300 font-medium">Shift Range: <span className="text-white">{todaysShift.expected_start_time} - {todaysShift.expected_end_time}</span></p>
            {isCompleted ? (
              <p className="text-xs text-green-400 font-bold tracking-widest uppercase">SHIFT COMPLETED</p>
            ) : (
              <p className="text-xs text-[#d4af37] uppercase tracking-wider">{isClockedIn ? "IN PROGRESS" : "PENDING LOG-IN"}</p>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 text-yellow-400/80">
            <AlertCircle size={14} />
            <span className="text-xs font-bold uppercase tracking-widest">No Scheduled Shift Detected</span>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center relative">
        <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all ${isClockedIn ? 'border-green-500/50 text-green-400' : 'border-dashed border-[#d4af37]/50 text-[#d4af37]/50'}`}>
          {isClockedIn ? <UserCheck className="w-10 h-10" /> : <Camera className="w-8 h-8" />}
        </div>
        {isClockedIn && (
          <div className="absolute bottom-0 right-1/2 translate-x-[40px] translate-y-2 bg-green-500/20 border border-green-500/50 rounded-full px-3 py-1 flex items-center gap-1 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-bold text-green-400 tracking-widest uppercase">ACTIVE</span>
          </div>
        )}
      </div>
      <p className="text-xs mt-4 text-gray-500 uppercase tracking-widest">
        {isClockedIn ? `Checked In: ${new Date(todaysShift.clock_in).toLocaleTimeString()}` : 'Biometric Auth Required'}
      </p>

      <div className="my-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
        <MapPin className="w-4 h-4 text-[#d4af37]" />
        <span className="truncate max-w-[200px]">{gpsMock}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <button 
          onClick={handleClockIn}
          disabled={isClockedIn || isPending}
          className="py-4 bg-gradient-to-r from-[#d4af37] to-[#806b45] text-space font-bold tracking-widest uppercase rounded-xl active:scale-95 transition disabled:opacity-20 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-2"
        >
          <Clock size={16} /> IN
        </button>
        <button 
          onClick={handleClockOut}
          disabled={!isClockedIn || isPending}
          className="py-4 bg-red-500/10 border border-red-500/30 text-red-400 font-bold tracking-widest uppercase rounded-xl hover:bg-red-500/20 active:scale-95 transition disabled:opacity-20 disabled:grayscale disabled:scale-100 disabled:hover:bg-red-500/10 flex items-center justify-center gap-2"
        >
          OUT <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}

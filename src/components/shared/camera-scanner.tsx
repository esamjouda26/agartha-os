"use client";

import { Camera, SwitchCamera } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

export function CameraScanner() {
  return (
    <div className="w-full max-w-sm rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-black shadow-sm transition-colors">
      <div className="relative aspect-[3/4] bg-gray-900 w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwMDBwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiPjwvcGF0aD4KPC9zdmc+')]"></div>

        <div className="relative w-64 h-64 border-2 border-[#d4af37]/50 rounded-lg">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#d4af37] -ml-1 -mt-1 rounded-tl"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#d4af37] -mr-1 -mt-1 rounded-tr"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#d4af37] -ml-1 -mb-1 rounded-bl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#d4af37] -mr-1 -mb-1 rounded-br"></div>
          
          <div className="absolute top-0 left-0 w-full h-1 bg-[#d4af37] shadow-[0_0_10px_#d4af37]" style={{ animation: 'scan 2s ease-in-out infinite alternating' }}></div>
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scan {
            0% { top: 0; }
            100% { top: 100%; }
          }
        `}} />

        <Badge variant="success" className="absolute top-4 left-4 backdrop-blur-md border-transparent bg-emerald-500/80 text-white">
          <Camera className="mr-1 h-3 w-3" /> Camera Active
        </Badge>

        <Button 
          variant="outline" 
          size="icon" 
          className="absolute top-4 right-4 rounded-full bg-black/40 backdrop-blur-md border-white/20 hover:bg-black/60 dark:hover:bg-black/60 text-white dark:text-white"
        >
          <SwitchCamera className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-4 bg-gray-50 dark:bg-black/80 flex justify-center border-t border-gray-200 dark:border-white/10 space-x-4">
        <Button variant="ghost" className="flex-1 text-gray-500 font-bold dark:text-gray-400">Cancel</Button>
        <Button variant="gold" className="flex-1">Scan Manually</Button>
      </div>
    </div>
  );
}

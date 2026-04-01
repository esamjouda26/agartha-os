"use client";

import { Home, Compass, UserCircle, Map, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GuestLayoutProps {
  children: React.ReactNode;
}

export function GuestLayout({ children }: GuestLayoutProps) {
  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-black text-gray-900 dark:text-white relative transition-colors">
      <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-gray-200 bg-white/90 dark:border-white/10 dark:bg-black/90 backdrop-blur-md z-30 sticky top-0">
        <div className="font-cinzel text-lg font-bold tracking-widest text-yellow-700 dark:text-[#d4af37]">Agartha</div>
        <button className="h-10 w-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:bg-white/5 relative transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-black rounded-full"></span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] dark:from-gray-900/50 dark:via-black dark:to-black pb-28 transition-colors">
        {children}
      </main>

      <div className="fixed sm:absolute bottom-0 inset-x-0 h-20 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 z-40 px-6 sm:px-12 flex items-center justify-between pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none">
        <NavButton icon={<Home />} label="Home" active />
        <NavButton icon={<Compass />} label="Explore" />
        <NavButton icon={<Map />} label="Map" />
        <NavButton icon={<UserCircle />} label="Profile" />
      </div>
    </div>
  );
}

function NavButton({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={cn(
      "flex flex-col items-center gap-1.5 p-2 min-h-[44px] min-w-[50px] transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/5",
      active ? "text-yellow-700 dark:text-[#d4af37]" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
    )}>
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

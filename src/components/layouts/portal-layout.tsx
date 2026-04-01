"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, Layers, Activity, Users, Settings } from "lucide-react";

export interface NavItem {
  icon?: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

export interface PortalLayoutProps {
  navItems: NavItem[];
  roleLabel: string;
  userName: string;
  children: React.ReactNode;
}

export function PortalLayout({ navItems, roleLabel, userName, children }: PortalLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-full w-full bg-gray-50 dark:bg-black text-gray-900 dark:text-white relative transition-colors">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden absolute inset-0 z-40 bg-gray-900/50 dark:bg-black/80 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "absolute lg:static inset-y-0 left-0 z-50 w-64 transform border-r transition-all duration-300 h-full flex flex-col focus:outline-none",
        "bg-white border-gray-200 dark:bg-black/90 dark:border-white/10",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/60">
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-yellow-700 dark:text-[#d4af37]" />
            <span className="font-cinzel text-lg font-bold tracking-widest text-yellow-700 dark:text-[#d4af37]">AgarthaOS</span>
          </div>
          <button className="lg:hidden p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors cursor-pointer",
                item.active 
                  ? "bg-yellow-50 text-yellow-700 shadow-[inset_2px_0_0_0_#ca8a04] dark:bg-[#d4af37]/10 dark:text-[#d4af37] dark:shadow-[inset_2px_0_0_0_#d4af37]" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
              )}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/60 pt-6 pb-6 shadow-[-10px_-10px_30px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 min-w-[40px] rounded-full bg-yellow-100 border border-yellow-300 flex items-center justify-center font-bold text-yellow-700 dark:bg-[#d4af37]/20 dark:border-[#d4af37]/50 dark:text-[#d4af37]">
              {userName.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-none mb-1">{userName}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="flex lg:hidden h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-black/60 relative z-30">
          <button className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-cinzel text-sm sm:text-lg font-bold tracking-widest text-yellow-700 dark:text-[#d4af37]">AgarthaOS</span>
          <div className="w-9 h-9"></div> {/* Spacer for symmetry */}
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-gray-900/50 dark:via-black dark:to-black p-4 sm:p-6 lg:p-8 transition-colors">
          {children}
        </div>
      </main>
    </div>
  );
}

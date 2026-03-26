"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import {
  QrCode, UtensilsCrossed, ShieldAlert,
  Bell, Settings, LogOut, Menu, X, User,
  Clock, Search, ChefHat, PackagePlus,
  TicketCheck, Store, Undo2, Truck,
  PackageCheck, ClipboardList
} from "lucide-react";

// Sourced from Crew Description Spec
const SHARED_TABS = [
  { href: "/crew/lost-and-found", label: "Lost & Found", icon: Search },
  { href: "/crew/incidents", label: "Incident Report", icon: ShieldAlert },
  { href: "/crew/attendance", label: "Attendance", icon: Clock },
  { href: "/crew/zone-check-in", label: "Zone Check-In/Out", icon: QrCode },
  { href: "/crew/announcements", label: "Announcements", icon: Bell },
  { href: "/crew/settings", label: "Settings", icon: Settings },
];

const CREW_ROUTES: Record<string, { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[]> = {
  fnb_crew: [
    { href: "/crew/fnb/pos", label: "F&B POS", icon: UtensilsCrossed },
    { href: "/crew/fnb/active-orders", label: "Active Orders", icon: ChefHat },
    { href: "/crew/fnb/restock", label: "Restock Request", icon: PackagePlus },
    ...SHARED_TABS,
  ],
  service_crew: [
    { href: "/crew/service/entry-validation", label: "Entry Validation", icon: TicketCheck },
    ...SHARED_TABS,
  ],
  giftshop_crew: [
    { href: "/crew/retail/pos", label: "Retail POS", icon: Store },
    { href: "/crew/retail/restock", label: "Restock Request", icon: PackagePlus },
    { href: "/crew/retail/returns", label: "Return & Refund", icon: Undo2 },
    ...SHARED_TABS,
  ],
  runner_crew: [
    { href: "/crew/logistics/restock-queue", label: "Restock Queue", icon: Truck },
    { href: "/crew/logistics/po-receiving", label: "PO Receiving", icon: PackageCheck },
    { href: "/crew/logistics/stock-counting", label: "Stock Counting", icon: ClipboardList },
    ...SHARED_TABS,
  ],
  experience_crew: [...SHARED_TABS],
  security_crew: [...SHARED_TABS],
  health_crew: [...SHARED_TABS],
  cleaning_crew: [...SHARED_TABS],
  internal_maintainence_crew: [...SHARED_TABS],
};

const DEFAULT_CREW_ROUTES = [...SHARED_TABS];

const ROLE_DISPLAY: Record<string, string> = {
  fnb_crew: "F&B Crew",
  service_crew: "Service Crew",
  giftshop_crew: "Giftshop Crew",
  runner_crew: "Runner Crew",
  security_crew: "Security Crew",
  health_crew: "Health Crew",
  cleaning_crew: "Cleaning Crew",
  experience_crew: "Experience Crew",
  internal_maintainence_crew: "Maintenance Crew",
};

export default function CrewLayoutClient({
  children,
  staffRole,
  displayName,
}: {
  children: React.ReactNode;
  staffRole: string | null;
  displayName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const role = staffRole ?? "";
  const navItems = CREW_ROUTES[role] ?? DEFAULT_CREW_ROUTES;
  const roleLabel = ROLE_DISPLAY[role] ?? "Crew";

  // Desktop auto-navigation to first tab if on root
  useEffect(() => {
    if (pathname === "/crew") {
      const isMobile = window.innerWidth < 768;
      if (!isMobile && navItems.length > 0) {
        router.replace(navItems[0].href);
      } else if (isMobile) {
        setDrawerOpen(true);
      }
    }
  }, [pathname, navItems, router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const pageTitle =
    navItems.find((n) => pathname.startsWith(n.href))?.label ?? "Select Module";

  return (
    <div className="crew-bg h-screen overflow-hidden flex flex-col md:flex-row font-inter">

      {/* ── Top Header (Mobile Only) ──────────────── */}
      <header className="glass-panel-gold w-full sticky top-0 z-40 flex-shrink-0 md:hidden border-b border-white/10">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="p-3 text-gray-400 hover:text-[#d4af37] transition active:scale-95"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-[#d4af37] to-[#806b45] flex items-center justify-center">
                <span className="font-cinzel font-bold text-space text-lg">A</span>
              </div>
              <div className="block">
                <p className="font-cinzel text-[#d4af37] font-bold text-lg tracking-wider leading-none">AGARTHA</p>
                <p className="text-[10px] text-gray-400 tracking-[0.2em] uppercase">Crew</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full font-orbitron">
              {roleLabel}
            </span>
          </div>
        </div>
      </header>

      {/* ── Full-Screen Drawer overlay (Mobile Only) ──────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-space md:hidden flex flex-col">
          <div className="flex h-16 items-center justify-between px-4 glass-panel-gold flex-shrink-0 border-b border-white/10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-3 text-[#d4af37] transition active:scale-95"
              >
                <X className="w-6 h-6" />
              </button>
              <p className="font-cinzel text-[#d4af37] font-bold text-lg tracking-wider">HOME</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
            <div className="px-2">
              <p className="text-xl font-semibold text-white">Hello, {displayName}</p>
              <p className="text-sm text-gray-400 mt-1">Select an action below.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="glass-panel-gold rounded-xl p-4 flex flex-col items-center justify-center gap-3 text-center active:scale-95 transition-transform min-h-[120px]"
                  >
                    <Icon className="w-8 h-8 text-[#d4af37]" />
                    <span className="font-medium text-sm text-white">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="mt-auto pt-8 pb-4">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border border-red-500/30 text-red-400 bg-red-500/10 active:scale-95 transition-transform"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-bold tracking-wide">SIGN OUT</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop Sidebar (Left Rail) - Syncing to Admin Style ──────────────── */}
      <aside className="glass-panel-gold hidden md:flex flex-col flex-shrink-0 w-72 inset-y-0 left-0 z-40 border-r border-white/10 transition-transform duration-200">
        <div className="p-6 border-b border-white/10 flex items-center space-x-4">
          <div className="w-10 h-10 rounded bg-gradient-to-br from-[#d4af37] to-[#806b45] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            <span className="font-cinzel font-bold text-space text-2xl">A</span>
          </div>
          <div>
            <h1 className="font-cinzel text-[#d4af37] font-bold tracking-wider leading-tight">AGARTHA</h1>
            <p className="text-[10px] text-gray-400 tracking-widest uppercase">Crew Portal</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          <p className="px-8 text-[9px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-3 flex items-center">
            <span className="text-[#d4af37] mr-1.5">▸</span> {roleLabel}
          </p>
          <ul className="space-y-1 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`nav-item flex items-center space-x-3 px-4 py-3 rounded text-sm border-l-[3px] transition-all
                      ${isActive
                        ? "border-[#d4af37] text-[#d4af37] bg-gradient-to-r from-[#d4af37]/10 to-transparent"
                        : "border-transparent text-gray-400 hover:border-[#d4af37] hover:text-[#d4af37]"
                      }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-6 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded border border-white/10 hover:border-[#d4af37]/50 hover:text-[#d4af37] transition-colors text-sm text-gray-400"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Column (Desktop Topbar & Content) ──────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Desktop Header - Syncing to Admin Style */}
        <header className="glass-panel-gold hidden md:flex h-20 flex-shrink-0 items-center justify-between px-6 md:px-8 border-b border-white/10 z-20">
          <div className="flex items-center space-x-4">
            <h2 className="font-cinzel text-xl text-white tracking-wide truncate">{pageTitle}</h2>
          </div>

          <div className="flex items-center space-x-6">
            {/* Role badge */}
            <div className="flex items-center space-x-2 bg-space/50 px-3 py-1.5 rounded border border-[#806b45]/30">
              <ShieldAlert className="w-4 h-4 text-[#806b45]" />
              <span className="text-xs text-gray-300 font-orbitron">{roleLabel}</span>
            </div>

            {/* Avatar */}
            <div className="flex items-center space-x-3 border-l border-white/10 pl-6">
              <div className="w-9 h-9 rounded-full bg-space border border-[#d4af37]/50 flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                <User className="w-4 h-4 text-[#d4af37]" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto relative w-full bg-space">
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 50% 0%, rgba(212,175,55,0.04) 0%, transparent 70%)" }}
          />
          <div className="relative z-10 w-full h-full md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

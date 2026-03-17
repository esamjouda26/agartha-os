"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import {
  QrCode, UtensilsCrossed, ClipboardList,
  ShieldAlert, Stethoscope, Package, Wrench,
  SprayCan, Bell, Settings,
  LogOut, Menu, X, User,
} from "lucide-react";

// ── Crew role → visible nav tabs ─────────────────────────────────────────────
// Sourced from Crew App.tsx View enum + isViewAllowed logic
// Stripping all Vite router logic; using Next.js Link href only
const CREW_ROUTES: Record<
  string,
  { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[]
> = {
  // Ticket scanning roles
  service_crew: [
    { href: "/crew/check-in",    label: "Zone Check-In", icon: QrCode },
    { href: "/crew/fnb-pos",     label: "F&B POS",       icon: UtensilsCrossed },
    { href: "/crew/incidents",   label: "Incidents",     icon: ShieldAlert },
    { href: "/crew/checklist",   label: "Daily Checklist", icon: ClipboardList },
    { href: "/crew/announcements", label: "Announcements", icon: Bell },
    { href: "/crew/settings",    label: "Settings",      icon: Settings },
  ],
  experience_crew: [
    { href: "/crew/check-in",    label: "Zone Check-In", icon: QrCode },
    { href: "/crew/incidents",   label: "Incidents",     icon: ShieldAlert },
    { href: "/crew/checklist",   label: "Daily Checklist", icon: ClipboardList },
    { href: "/crew/announcements", label: "Announcements", icon: Bell },
    { href: "/crew/settings",    label: "Settings",      icon: Settings },
  ],
  fnb_crew: [
    { href: "/crew/check-in",    label: "Zone Check-In", icon: QrCode },
    { href: "/crew/fnb-pos",     label: "F&B POS",       icon: UtensilsCrossed },
    { href: "/crew/checklist",   label: "Daily Checklist", icon: ClipboardList },
    { href: "/crew/announcements", label: "Announcements", icon: Bell },
    { href: "/crew/settings",    label: "Settings",      icon: Settings },
  ],
  security_crew: [
    { href: "/crew/check-in",      label: "Zone Check-In",   icon: QrCode },
    { href: "/crew/security",      label: "Security Dashboard", icon: ShieldAlert },
    { href: "/crew/incidents",     label: "Incidents",       icon: ShieldAlert },
    { href: "/crew/announcements", label: "Announcements",   icon: Bell },
    { href: "/crew/settings",      label: "Settings",        icon: Settings },
  ],
  health_crew: [
    { href: "/crew/check-in",      label: "Zone Check-In",  icon: QrCode },
    { href: "/crew/health",        label: "Health Dashboard", icon: Stethoscope },
    { href: "/crew/incidents",     label: "Incidents",      icon: ShieldAlert },
    { href: "/crew/announcements", label: "Announcements",  icon: Bell },
    { href: "/crew/settings",      label: "Settings",       icon: Settings },
  ],
  giftshop_crew: [
    { href: "/crew/check-in",      label: "Zone Check-In", icon: QrCode },
    { href: "/crew/giftshop",      label: "Retail",        icon: Package },
    { href: "/crew/checklist",     label: "Daily Checklist", icon: ClipboardList },
    { href: "/crew/announcements", label: "Announcements", icon: Bell },
    { href: "/crew/settings",      label: "Settings",      icon: Settings },
  ],
  runner_crew: [
    { href: "/crew/check-in",      label: "Zone Check-In", icon: QrCode },
    { href: "/crew/runner",        label: "Logistics",     icon: Package },
    { href: "/crew/incidents",     label: "Incidents",     icon: ShieldAlert },
    { href: "/crew/announcements", label: "Announcements", icon: Bell },
    { href: "/crew/settings",      label: "Settings",      icon: Settings },
  ],
  cleaning_crew: [
    { href: "/crew/check-in",      label: "Zone Check-In", icon: QrCode },
    { href: "/crew/cleaning",      label: "Cleaning",      icon: ClipboardList },
    { href: "/crew/announcements", label: "Announcements", icon: Bell },
    { href: "/crew/settings",      label: "Settings",      icon: Settings },
  ],
  internal_maintainence_crew: [
    { href: "/crew/check-in",      label: "Zone Check-In",  icon: QrCode },
    { href: "/crew/maintenance",   label: "Maintenance",    icon: Wrench },
    { href: "/crew/announcements", label: "Announcements",  icon: Bell },
    { href: "/crew/settings",      label: "Settings",       icon: Settings },
  ],
};

// Default nav for unrecognised crew roles
const DEFAULT_CREW_ROUTES = [
  { href: "/crew/check-in",      label: "Zone Check-In", icon: QrCode },
  { href: "/crew/announcements", label: "Announcements", icon: Bell },
  { href: "/crew/settings",      label: "Settings",      icon: Settings },
];

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

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    /* Mobile-first: full-screen vertical flex, dark crew bg */
    <div className="crew-bg min-h-screen flex flex-col font-inter">

      {/* ── Top Header (mobile primary navigation bar) ──────────────── */}
      <header className="glass-panel-gold sticky top-0 z-40 flex-shrink-0">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Left: hamburger + brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="p-1.5 text-gray-400 hover:text-[#d4af37] transition active:scale-95"
              aria-label="Open menu"
            >
              {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-gradient-to-br from-[#d4af37] to-[#806b45] flex items-center justify-center">
                <span className="font-cinzel font-bold text-space text-sm">A</span>
              </div>
              <div>
                <p className="font-cinzel text-[#d4af37] font-bold text-sm tracking-wider leading-none">AGARTHA</p>
                <p className="text-[8px] text-gray-400 tracking-[0.2em] uppercase">Crew Portal</p>
              </div>
            </div>
          </div>

          {/* Right: role badge + sign out */}
          <div className="flex items-center gap-3">
            <span className="bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full font-orbitron">
              {roleLabel}
            </span>
            <button
              onClick={handleSignOut}
              className="text-[9px] text-gray-400 hover:text-[#d4af37] uppercase tracking-widest transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Side Drawer (slides over content on mobile) ──────────────── */}
      {/* On md+ it becomes a persistent left rail */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Drawer overlay (mobile) */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/60 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        <aside
          className={`glass-panel-gold fixed inset-y-0 left-0 z-30 w-64 flex flex-col pt-14
            transform transition-transform duration-200
            ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
            md:static md:translate-x-0 md:pt-0 md:flex md:w-56`}
        >
          {/* User info */}
          <div className="px-4 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-space border border-[#d4af37]/40 flex items-center justify-center">
                <User className="w-4 h-4 text-[#d4af37]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">{displayName}</p>
                <p className="text-[10px] text-[#d4af37] font-orbitron tracking-wide">{roleLabel}</p>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto py-3">
            <ul className="space-y-0.5 px-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`nav-item flex items-center gap-3 px-3 py-3 rounded text-sm border-l-[3px] transition-all active:scale-[0.98]
                        ${isActive
                          ? "border-[#d4af37] text-[#d4af37] bg-gradient-to-r from-[#d4af37]/10 to-transparent"
                          : "border-transparent text-gray-400 hover:border-[#d4af37]/50 hover:text-[#d4af37]"
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

          {/* Sign out (drawer footer) */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2 rounded border border-white/10 hover:border-[#d4af37]/50 hover:text-[#d4af37] text-gray-400 text-xs transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────── */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto relative w-full bg-space">
          {/* Unified gold radial gradient (matches Admin/Management) */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 50% 0%, rgba(212,175,55,0.03) 0%, transparent 60%)" }}
          />
          <div className="relative z-10 p-4 md:p-6 pb-24 md:pb-6 min-h-full">
            {children}
          </div>
        </main>
      </div>

      {/* ── Bottom Tab Bar (mobile-only, shows primary crew actions) ── */}
      <nav className="md:hidden glass-panel-gold fixed bottom-0 left-0 right-0 z-40 flex border-t border-white/10">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all active:scale-95
                ${isActive ? "text-[#d4af37]" : "text-gray-500 hover:text-gray-300"}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] uppercase tracking-wider font-medium">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

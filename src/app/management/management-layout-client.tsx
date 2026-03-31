"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import {
  Utensils, Users, Trash2, PieChart, Truck,
  Package, AlertTriangle, ClipboardList,
  TrendingUp, Tag, Calendar,
  Layers, ArrowLeftRight, ClipboardCheck,
  Map, ShieldAlert,
  RadioTower, Radar, Siren, Clock,
  CalendarClock, ShieldCheck,
  Activity, LogOut, Menu, X, Briefcase, Globe,
} from "lucide-react";

// ── Per-role navs sourced directly from management legacy index routing ──────
const MANAGEMENT_ROUTES: Record<string, { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[]> = {
  fnb_manager: [
    { href: "/management/fnb/menu", label: "Menu & Pricing", icon: Utensils },
    { href: "/management/fnb/retail-catalog", label: "Retail Catalog", icon: Package },
    { href: "/management/fnb/active-orders", label: "POS Monitoring", icon: Activity },
    { href: "/management/fnb/staffing", label: "Staffing View", icon: Users },
    { href: "/management/fnb/incidents", label: "Crew Incidents", icon: AlertTriangle },
    { href: "/management/fnb/margin", label: "Margin Reporting", icon: PieChart },
    { href: "/management/fnb/supplier", label: "Supplier Performance", icon: Truck },
  ],
  merch_manager: [
    { href: "/management/merch/catalog", label: "Product Catalog", icon: Package },
    { href: "/management/merch/reorder", label: "Reorder Points", icon: AlertTriangle },
    { href: "/management/merch/pos", label: "Supplier POs", icon: ClipboardList },
    { href: "/management/merch/suppliers", label: "Suppliers", icon: Truck },
  ],
  maintenance_manager: [
    { href: "/management/maintenance/telemetry", label: "Spatial Telemetry", icon: Map },
    { href: "/management/operations/maintenance", label: "Operations Control", icon: ShieldAlert },
  ],
  inventory_manager: [
    { href: "/management/inventory", label: "Global Policies", icon: Layers },
    { href: "/management/inventory/transfers", label: "Transfers & Issuance", icon: ArrowLeftRight },
    { href: "/management/inventory/audits", label: "Audits & Recon", icon: ClipboardCheck },
  ],
  marketing_manager: [
    { href: "/management/marketing/campaigns", label: "Campaign Attribution", icon: TrendingUp },
    { href: "/management/marketing/promos", label: "Promo Codes Management", icon: Tag },
    { href: "/management/marketing/demand", label: "Demand & Yield Forecasts", icon: Calendar },
  ],
  human_resources_manager: [
    { href: "/management/hr-roster", label: "Staff Management", icon: Users },
    { href: "/management/hr-roster/shifts", label: "Shift Scheduling", icon: CalendarClock },
    { href: "/management/hr-roster/attendance/ledger", label: "Master Ledger", icon: ShieldCheck },
    { href: "/management/hr-roster/attendance/leaves", label: "Leave Management", icon: Calendar },
    { href: "/management/hr-roster/attendance/queue", label: "Discrepancy Queue", icon: AlertTriangle },
  ],
  compliance_manager: [],
  operations_manager: [
    { href: "/management/operations/telemetry", label: "Zone Telemetry", icon: RadioTower },
    { href: "/management/operations/crew-deployment", label: "Crew Deployment", icon: Radar },
    { href: "/management/incidents", label: "Incident Log", icon: Siren },
    { href: "/management/scheduler", label: "Operational Timeline", icon: Clock },
    { href: "/management/operations/experiences", label: "Experience Config", icon: Activity },
  ],
};

const ROLE_DISPLAY: Record<string, string> = {
  fnb_manager: "F&B Manager",
  merch_manager: "Merch Manager",
  maintenance_manager: "Maintenance Manager",
  inventory_manager: "Inventory Manager",
  marketing_manager: "Marketing Manager",
  human_resources_manager: "HR Manager",
  compliance_manager: "Compliance Manager",
  operations_manager: "Operations Manager",
};

export default function ManagementLayoutClient({
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = staffRole ?? "operations_manager";
  const navItems = MANAGEMENT_ROUTES[role] ?? [];
  const roleLabel = ROLE_DISPLAY[role] ?? role;

  const pageTitle =
    navItems.find((n) => pathname.startsWith(n.href))?.label ?? "Select a Module";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="font-inter h-screen overflow-hidden flex flex-col md:flex-row bg-space">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className={`glass-panel-gold fixed inset-y-0 left-0 z-40 w-72 flex flex-col flex-shrink-0
          transform transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:flex`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-white/10 flex items-center space-x-4">
          <div className="w-10 h-10 rounded bg-gradient-to-br from-[#d4af37] to-[#806b45] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            <span className="font-cinzel font-bold text-space text-2xl">A</span>
          </div>
          <div>
            <h1 className="font-cinzel text-[#d4af37] font-bold tracking-wider leading-tight">AGARTHA</h1>
            <p className="text-[10px] text-gray-400 tracking-widest uppercase">Management Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-6">
          {navItems.length === 0 ? (
            <p className="px-6 text-xs text-gray-500 uppercase tracking-widest">Modules Pending...</p>
          ) : (
            <>
              <p className="px-8 text-[9px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-3 flex items-center">
                <span className="text-[#d4af37] mr-1.5">▸</span> {roleLabel}
              </p>
              <ul className="space-y-1 px-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isRootLevel = item.href.split('/').length <= 3;
                  const isActive = isRootLevel ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
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
            </>
          )}
        </nav>

        {/* Sign Out + Info */}
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

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Main column ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="glass-panel h-16 md:h-20 flex-shrink-0 flex items-center justify-between px-6 md:px-8 border-b border-white/10 z-20">
          <div className="flex items-center space-x-4">
            <button
              className="md:hidden text-gray-400 hover:text-[#d4af37] transition"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="font-cinzel text-base md:text-xl text-white tracking-wide truncate">{pageTitle}</h2>
          </div>

          <div className="flex items-center space-x-4 md:space-x-6">
            {/* Live indicator — desktop only */}
            <div className="hidden lg:flex items-center space-x-2 text-[#d4af37] border-r border-white/10 pr-6">
              <Activity className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest">Live Stream Active</span>
            </div>

            {/* Role badge */}
            <div className="flex items-center space-x-2 bg-space/50 px-3 py-1.5 rounded border border-[#806b45]/30">
              <Briefcase className="w-4 h-4 text-[#806b45]" />
              <span className="text-xs text-gray-300 font-orbitron">{roleLabel}</span>
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-space border border-[#d4af37]/50 flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.2)]">
              <Users className="w-4 h-4 text-[#d4af37]" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-space relative">
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 50% 0%, rgba(212,175,55,0.03) 0%, transparent 60%)" }}
          />
          <div className="relative z-10 p-4 md:p-6 lg:p-8 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Management — AgarthaOS",
  description: "Operations management: inventory, HR roster, scheduling, and analytics.",
};

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar — full implementation in Phase 4 */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-border bg-card">
        <div className="flex h-14 items-center px-6 border-b border-border">
          <span className="font-bold text-gradient">AgarthaOS</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Operations
          </span>
          <a href="/management/inventory" className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            Inventory
          </a>
          <a href="/management/hr-roster" className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            HR Roster
          </a>
          <a href="/management/hr-roster/deployment" className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors pl-6">
            Crew Deployment
          </a>
          <a href="/management/scheduler" className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            Scheduler
          </a>
          <a href="/management/incidents" className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            Incidents
          </a>
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-5">
            Command & Control
          </span>
          <a href="/management/operations/experiences" className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            Experience Config
          </a>
          <a href="/management/operations/telemetry" className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            Zone Telemetry
          </a>
          <a href="/management/operations/maintenance" className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            Maintenance &amp; PAM
          </a>
        </nav>
        <div className="border-t border-border p-4">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Management
          </span>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6 lg:hidden">
          <span className="font-bold text-gradient text-sm">AgarthaOS</span>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Management
          </span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

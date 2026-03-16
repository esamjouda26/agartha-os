import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — AgarthaOS",
  description: "System administration: IAM, zone configuration, device management, and audit logs.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Admin desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-border bg-card">
        <div className="flex h-14 items-center px-6 border-b border-border">
          <span className="font-bold text-gradient">AgarthaOS</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            System
          </span>
          <a href="/admin/access-control" className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            Access Control
          </a>
          <a href="/admin/zones" className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            Zone Config
          </a>
          <a href="/admin/audit" className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            Audit Log
          </a>
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-5">
            Testing
          </span>
          <a href="/admin/iot-simulator" className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            IoT Simulator
          </a>
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
              Admin
            </span>
            <span className="text-xs text-muted-foreground">MFA Required</span>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6 lg:hidden">
          <span className="font-bold text-gradient text-sm">AgarthaOS</span>
          <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
            Admin
          </span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { GuestBottomNav } from "./guest-bottom-nav";

export const metadata: Metadata = {
  title: "Guest Portal — Agartha World",
  description: "Book your Agartha World experience, manage your visit, and access your memory vault.",
};

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-space text-[#e2e8f0] relative overflow-x-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, transparent 0%, #020408 90%),
          linear-gradient(rgba(212, 175, 55, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(212, 175, 55, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 40px 40px, 40px 40px",
      }}
    >
      {/* ── Top Nav ─────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 w-full z-50 backdrop-blur-md"
        style={{
          borderBottom: "1px solid rgba(212, 175, 55, 0.1)",
          background: "rgba(2, 4, 8, 0.98)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center shadow-lg shadow-yellow-900/20 group-hover:scale-105 transition-transform">
              <span
                className="font-bold text-black text-xl"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                A
              </span>
            </div>
            <div className="flex flex-col">
              <span
                className="font-bold text-lg tracking-wide text-white leading-none"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                AGARTHA
              </span>
              <span className="text-[9px] text-gray-300 tracking-[0.3em] uppercase mt-0.5">
                Guest Portal
              </span>
            </div>
          </Link>
        </div>
      </nav>

      {/* ── Page Content ────────────────────────────────────────────── */}
      <main className="pt-24 pb-24 md:pb-16">{children}</main>

      {/* ── Mobile Bottom Nav ───────────────────────────────────────── */}
      <GuestBottomNav />
    </div>
  );
}

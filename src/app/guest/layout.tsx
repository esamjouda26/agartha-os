import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guest Portal — AgarthaOS",
  description: "Book your Agartha World experience and manage your visit.",
};

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#020408] text-[#e2e8f0] relative overflow-x-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, transparent 0%, #020408 90%),
          linear-gradient(rgba(212, 175, 55, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(212, 175, 55, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 40px 40px, 40px 40px",
      }}
    >
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-[#d4af37]/10 bg-[#020408]/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center shadow-lg shadow-yellow-900/20 group-hover:scale-105 transition-transform">
              <span className="font-bold text-black text-xl" style={{ fontFamily: "'Cinzel', serif" }}>A</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-wide text-white leading-none" style={{ fontFamily: "'Cinzel', serif" }}>AGARTHA</span>
              <span className="text-[9px] text-gray-300 tracking-[0.3em] uppercase mt-0.5">Guest Portal</span>
            </div>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        {children}
      </main>
    </div>
  );
}

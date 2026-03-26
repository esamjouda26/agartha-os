import RouteMatrixClient from "./matrix-client";

export default function RouteMatrixPage() {
  return (
    <div className="space-y-6">
      <div className="bg-[#020408] border border-white/10 rounded-lg p-6 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <h1 className="font-cinzel text-2xl text-[#d4af37] mb-2 tracking-wide text-glow">Edge Routing Dictionary (Network)</h1>
        <p className="text-sm text-gray-400 max-w-4xl leading-relaxed">
          This system physically determines which organizational classifications are authorized to bypass the Vercel Edge Perimeter and render deeply rooted architectural domains. Adjustments executed here automatically mutate the central `role_route_access` PostgreSQL mapping logic with near-zero latency worldwide edge propagation.
        </p>
      </div>

      <RouteMatrixClient />
    </div>
  );
}

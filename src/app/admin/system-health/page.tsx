import { Server, Activity, HardDrive, Database, Radio } from "lucide-react";

// TODO: Connect to a live monitoring/APM endpoint to replace static values

const METRIC_CARDS = [
  {
    label: "CPU Load (Avg)",
    icon: Server,
    value: "42%",
    sub: "8-core / 16-thread",
    status: "healthy",
    statusLabel: "Nominal",
    sparkColor: "#22c55e",
    spark: [38, 40, 35, 45, 50, 42, 39, 41, 44, 42],
  },
  {
    label: "DB Connections",
    icon: Database,
    value: "1,402",
    sub: "Pool: 2,000 max",
    status: "warning",
    statusLabel: "High Usage",
    sparkColor: "#eab308",
    spark: [1200, 1250, 1300, 1280, 1350, 1400, 1380, 1410, 1390, 1402],
  },
  {
    label: "HTTP Error Rate",
    icon: Radio,
    value: "0.45%",
    sub: "Last 10 min",
    status: "critical",
    statusLabel: "Spike Detected",
    sparkColor: "#ef4444",
    spark: [0.05, 0.04, 0.06, 0.05, 0.08, 0.1, 0.2, 0.35, 0.4, 0.45],
  },
  {
    label: "RAM",
    icon: Activity,
    value: "78%",
    sub: "Spatial tracking active",
    status: "warning",
    statusLabel: "Leak Risk",
    sparkColor: "#eab308",
    spark: [52, 55, 58, 60, 63, 66, 70, 73, 76, 78],
  },
  {
    label: "Disk I/O",
    icon: HardDrive,
    value: "520 / 185 MB/s",
    sub: "Read / Write",
    status: "warning",
    statusLabel: "Write Bottleneck",
    sparkColor: "#eab308",
    spark: [160, 180, 175, 190, 185, 178, 192, 185, 182, 185],
  },
] as const;

const STATUS_COLORS = {
  healthy: "text-green-400 bg-green-400/10 border border-green-500/20",
  warning: "text-yellow-400 bg-yellow-400/10 border border-yellow-500/20",
  critical: "text-red-400 bg-red-400/10 border border-red-500/20",
};

const VLAN_DATA = [
  { name: "Spatial/AV", down: 8.5, up: 2.1, vlan: 30 },
  { name: "Guest WiFi", down: 4.2, up: 1.1, vlan: 40 },
  { name: "Core DB", down: 1.8, up: 1.5, vlan: 50 },
  { name: "POS/Ticketing", down: 0.5, up: 0.2, vlan: 10 },
  { name: "Security/CCTV", down: 3.2, up: 5.8, vlan: 20 },
];

const ERROR_LOG = [
  { ts: "12:08:15", level: "500", levelColor: "text-red-400", service: "TicketingAPI", msg: "Connection timeout to external payment gateway. Retrying (1/3)..." },
  { ts: "12:07:42", level: "WARN", levelColor: "text-yellow-400", service: "Auth0_Gateway", msg: "Rate limit approaching (85%) for ServiceAccount_Kiosk_Z1." },
  { ts: "12:05:00", level: "INFO", levelColor: "text-green-400", service: "DB_Cluster", msg: "Automated incremental snapshot completed successfully (2.4GB)." },
  { ts: "11:59:12", level: "502", levelColor: "text-red-400", service: "Spatial_Engine", msg: "Bad Gateway. Dropped telemetry packets from Zone C. Failover initiated." },
  { ts: "11:55:30", level: "INFO", levelColor: "text-green-400", service: "IAM_Service", msg: "User 'Admin' successfully authenticated via Admin Portal." },
];

/** Simple SVG sparkline — static data, no Chart.js dependency */
function Sparkline({ data, color }: { data: readonly number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} fillOpacity="0.1" />
    </svg>
  );
}

export default function SystemHealthPage() {
  return (
    <div className="space-y-8 pb-8">

      {/* ── SLA Uptime Hero ────────────────────────────────────────────── */}
      <div className="glass-panel rounded-lg p-6 flex flex-col md:flex-row items-center justify-between border-green-500/20 shadow-[0_0_25px_rgba(34,197,94,0.08)]">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.25)]">
            <Server className="w-7 h-7 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">SLA Compliance — Uptime</p>
            <h3 className="font-orbitron text-4xl font-bold text-green-400 tracking-wide">99.97%</h3>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Target SLA</p>
            <p className="font-orbitron text-lg text-white font-bold">99.95%</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Downtime MTD</p>
            <p className="font-orbitron text-lg text-white font-bold">12m 48s</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Status</p>
            <span className="text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded border border-green-500/20 font-bold">EXCEEDING</span>
          </div>
        </div>
      </div>

      {/* ── Status Bar ────────────────────────────────────────────────── */}
      <div className="glass-panel rounded-lg p-3 flex items-center justify-between border-[rgba(212,175,55,0.2)]">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          All Primary Systems Operational (Design Reference)
        </div>
        <span className="text-[10px] text-gray-500 font-mono">Requires APM integration — reference values only</span>
      </div>

      {/* ── Metric Cards ──────────────────────────────────────────────── */}
      <section>
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider">
          <Server className="w-5 h-5 mr-2" /> Core Infrastructure
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {METRIC_CARDS.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="glass-panel rounded-lg p-5 flex flex-col justify-between group hover:border-[rgba(212,175,55,0.3)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all">
                <p className="text-sm text-gray-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                  {m.label}
                  <Icon className="w-4 h-4 text-gray-500 group-hover:text-[#d4af37] transition-colors" />
                </p>
                <div className="flex items-end justify-between mt-2 mb-2">
                  <h4 className="font-orbitron text-2xl font-bold text-white">{m.value}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${STATUS_COLORS[m.status]}`}>{m.statusLabel}</span>
                </div>
                <p className="text-[10px] text-gray-500 mb-2">{m.sub}</p>
                <div className="h-8 w-full">
                  <Sparkline data={m.spark} color={m.sparkColor} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── API & Network ─────────────────────────────────────────────── */}
      <section>
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider mt-2">
          <Activity className="w-5 h-5 mr-2" /> API Gateways & Network Traffic
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Latency placeholder */}
          <div className="glass-panel rounded-lg p-5 h-[280px] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-gray-300 font-semibold tracking-wide">Internal API Latency (ms)</p>
              <Radio className="w-4 h-4 text-[rgba(212,175,55,0.5)]" />
            </div>
            <div className="flex-1 flex flex-col justify-end gap-2">
              {[
                { label: "Ticketing/POS API", value: 120, max: 200, color: "#d4af37" },
                { label: "Spatial Tracking Stream", value: 15, max: 200, color: "#3b82f6" },
                { label: "Auth Gateway", value: 45, max: 200, color: "#22c55e" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{item.label}</span>
                    <span className="font-mono">{item.value}ms</span>
                  </div>
                  <div className="w-full bg-[#020408] rounded-full h-2 border border-white/5">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${(item.value / item.max) * 100}%`, backgroundColor: item.color, opacity: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VLAN Bandwidth */}
          <div className="glass-panel rounded-lg p-5 h-[280px] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-gray-300 font-semibold tracking-wide">VLAN Bandwidth Distribution (Gbps)</p>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {VLAN_DATA.map((v) => (
                <div key={v.name}>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{v.name} <span className="text-[#806b45] font-mono ml-1">VLAN {v.vlan}</span></span>
                    <span className="font-mono">↓{v.down} / ↑{v.up}</span>
                  </div>
                  <div className="w-full bg-[#020408] rounded-full h-2 border border-white/5 flex overflow-hidden">
                    <div className="h-2 bg-[#806b45]" style={{ width: `${(v.down / 10) * 100}%` }} />
                    <div className="h-2 bg-white/20" style={{ width: `${(v.up / 10) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Error Log Terminal ────────────────────────────────────────── */}
      <section>
        <h3 className="font-cinzel text-lg text-[#d4af37] mb-4 flex items-center tracking-wider">
          <Activity className="w-5 h-5 mr-2" /> Live Error Logs & System Events
        </h3>
        <div className="glass-panel rounded-lg flex flex-col overflow-hidden border-red-500/20">
          <div className="bg-[#020408]/80 border-b border-white/10 p-3 flex justify-between items-center">
            <div className="flex space-x-4 text-xs font-semibold uppercase tracking-widest text-gray-500">
              <span className="w-24">Timestamp</span>
              <span className="w-20">Level</span>
              <span className="w-32">Service</span>
              <span>Message</span>
            </div>
            <div className="flex space-x-2">
              <span className="w-3 h-3 rounded-full bg-green-500/50" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <span className="w-3 h-3 rounded-full bg-red-500/50" />
            </div>
          </div>
          <div className="bg-[#010204] p-4 h-64 overflow-y-auto font-mono text-xs space-y-3">
            {ERROR_LOG.map((e, i) => (
              <div key={i} className="flex space-x-4 text-gray-300 hover:bg-white/5 p-1 rounded transition-colors">
                <span className="w-24 text-gray-500 flex-shrink-0">{e.ts}</span>
                <span className={`w-20 font-bold flex-shrink-0 ${e.levelColor}`}>[{e.level}]</span>
                <span className="w-32 text-[#806b45] flex-shrink-0 truncate">{e.service}</span>
                <span className="flex-1">{e.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

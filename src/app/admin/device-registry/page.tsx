"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Radio, MoreVertical, ShieldAlert } from "lucide-react";

interface Device {
  id: string;
  name: string;
  serial_number: string | null;
  device_type: string;
  status: string;
  ip_address?: string | null;
  mac_address?: string | null;
  location?: string | null;
  firmware_version?: string | null;
}

const VLAN_TYPES: Record<string, { label: string; color: string }> = {
  camera: { label: "VLAN 30", color: "text-blue-400 bg-blue-400/10 border-blue-500/20" },
  turnstile: { label: "VLAN 20", color: "text-purple-400 bg-purple-400/10 border-purple-500/20" },
  pos: { label: "VLAN 10", color: "text-[#806b45] bg-[rgba(128,107,69,0.1)] border-[rgba(128,107,69,0.2)]" },
  kiosk: { label: "VLAN 40", color: "text-gray-400 bg-[#020408] border-white/10" },
};

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "online") return (
    <span className="flex items-center text-green-400 bg-green-400/10 border border-green-500/20 px-2 py-1 rounded w-fit text-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2" /> Online
    </span>
  );
  if (s === "quarantined") return (
    <span className="flex items-center text-yellow-500 bg-yellow-500/10 border border-yellow-500/30 px-2 py-1 rounded w-fit text-xs font-bold shadow-[0_0_10px_rgba(234,179,8,0.2)]">
      <ShieldAlert className="w-3 h-3 mr-1.5" /> Quarantined
    </span>
  );
  return (
    <span className="flex items-center text-red-400 bg-red-400/10 border border-red-500/20 px-2 py-1 rounded w-fit text-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2" /> Offline
    </span>
  );
}

function VlanBadge({ type }: { type: string }) {
  const map = VLAN_TYPES[type.toLowerCase()] ?? { label: "VLAN —", color: "text-gray-400 bg-[#020408] border-white/10" };
  return (
    <span className={`${map.color} border px-2 py-1 rounded text-[10px] font-mono`}>{map.label}</span>
  );
}

const PAGE_SIZE = 25;

export default function DeviceRegistryPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from as any)("devices")
      .select("id, name, serial_number, device_type, status, ip_address, mac_address, location, firmware_version")
      .order("name");
    setDevices((data as Device[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  // Client-side filtering — no Server Action needed
  const filtered = devices.filter((d) => {
    const matchSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.ip_address ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.mac_address ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || d.device_type.toLowerCase() === filterType;
    const matchStatus = filterStatus === "all" || d.status.toLowerCase() === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === paged.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paged.map((d) => d.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Summary Stats ─────────────────────────────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Devices", value: devices.length, color: "text-white" },
            { label: "Online", value: devices.filter((d) => d.status.toLowerCase() === "online").length, color: "text-green-400" },
            { label: "Offline", value: devices.filter((d) => d.status.toLowerCase() === "offline").length, color: "text-red-400" },
            { label: "Quarantined", value: devices.filter((d) => d.status.toLowerCase() === "quarantined").length, color: "text-yellow-400" },
          ].map((s) => (
            <div key={s.label} className="glass-panel rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest">{s.label}</p>
              <h4 className={`font-orbitron text-2xl font-bold mt-1 ${s.color}`}>{s.value}</h4>
            </div>
          ))}
        </div>
      )}

      {/* ── Master Device Table ───────────────────────────────────────── */}
      <div className="glass-panel rounded-lg overflow-hidden flex flex-col">
        {/* Filter bar */}
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by Device Name, IP, or MAC..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.3)] transition-all placeholder-gray-600"
            />
          </div>
          <div className="flex items-center space-x-3">
            {/* Type filter */}
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
              className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] cursor-pointer"
              style={{ colorScheme: "dark" }}
            >
              <option value="all">All Types</option>
              <option value="camera">3D Cameras</option>
              <option value="pos">POS Terminals</option>
              <option value="turnstile">Turnstiles</option>
              <option value="kiosk">Kiosks</option>
            </select>
            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
              className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] cursor-pointer"
              style={{ colorScheme: "dark" }}
            >
              <option value="all">Status: All</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="quarantined">Quarantined</option>
            </select>
            {/* Bulk actions */}
            <button
              disabled={selectedIds.size === 0}
              className="text-xs px-3 py-2 rounded border border-white/10 transition-all disabled:opacity-50 disabled:text-gray-400 disabled:cursor-not-allowed enabled:text-white enabled:hover:border-[rgba(212,175,55,0.5)] enabled:hover:text-[#d4af37]"
            >
              Bulk Actions ({selectedIds.size})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : paged.length === 0 ? (
            <p className="text-center text-gray-500 py-16">No devices match your filters.</p>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
                <tr>
                  <th className="px-4 py-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === paged.length && paged.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-white/10 bg-[#020408] accent-[#d4af37] cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Device Identity</th>
                  <th className="px-6 py-4 font-semibold">Network (IP / MAC)</th>
                  <th className="px-6 py-4 font-semibold">Location / Zone</th>
                  <th className="px-6 py-4 font-semibold">VLAN</th>
                  <th className="px-6 py-4 font-semibold">Firmware</th>
                  <th className="px-6 py-4 font-semibold text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {paged.map((d) => {
                  const isOffline = d.status.toLowerCase() === "offline";
                  const isQuar = d.status.toLowerCase() === "quarantined";
                  return (
                    <tr
                      key={d.id}
                      className={`hover:bg-white/[0.02] transition-colors group ${isOffline ? "bg-red-500/[0.02]" : ""} ${isQuar ? "bg-yellow-500/[0.05]" : ""}`}
                    >
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(d.id)}
                          onChange={() => toggleSelect(d.id)}
                          className="rounded border-white/10 bg-[#020408] accent-[#d4af37] cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={d.status} />
                        {isOffline && <span className="text-[9px] text-red-500 mt-1 block font-sans">Last seen: unknown</span>}
                      </td>
                      <td className="px-6 py-4">
                        <p className={`font-bold mb-0.5 ${isQuar ? "text-yellow-400" : "text-gray-200"}`}>{d.serial_number ?? d.name}</p>
                        <p className="text-[10px] text-gray-500 font-sans tracking-wide">{d.device_type}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        <p className="mb-0.5">{d.ip_address ?? "—"}</p>
                        <p className="text-[10px] text-gray-500">{d.mac_address ?? "—"}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{d.location ?? "—"}</td>
                      <td className="px-6 py-4"><VlanBadge type={d.device_type} /></td>
                      <td className="px-6 py-4 text-gray-400">{d.firmware_version ?? "—"}</td>
                      <td className="px-6 py-4 text-right">
                        {isQuar ? (
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 text-yellow-500 hover:bg-yellow-500/10 border border-yellow-500/50 rounded transition-colors text-[10px] font-sans uppercase tracking-wide" title="Block MAC">Block MAC</button>
                            <button className="p-1.5 text-gray-400 hover:bg-white/10 border border-white/20 rounded transition-colors text-[10px] font-sans uppercase tracking-wide" title="Authorize">Authorize</button>
                          </div>
                        ) : isOffline ? (
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 text-red-400 hover:bg-red-400/10 border border-red-500/30 rounded transition-colors text-[10px] font-sans uppercase tracking-wide">Alert Maint</button>
                            <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors" title="Device Details">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="p-1.5 text-gray-500 hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.1)] rounded transition-colors"
                              title="Ping Device"
                              // TODO: bind to IoT ping endpoint
                            >
                              <Radio className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors" title="Device Details">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 bg-[#020408]/40">
          <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} entries</span>
          <div className="flex items-center space-x-1 font-sans">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50"
            >Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`px-3 py-1.5 rounded border transition-colors ${page === i ? "bg-[rgba(212,175,55,0.2)] text-[#d4af37] border-[rgba(212,175,55,0.3)]" : "border-white/10 hover:bg-white/5"}`}
              >{i + 1}</button>
            ))}
            {totalPages > 5 && <span className="px-2">…</span>}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

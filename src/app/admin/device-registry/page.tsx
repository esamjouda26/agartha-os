"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Search, Radio, MoreVertical, ShieldAlert, Plus, X, Server, Network, ShieldCheck, MapPin, Edit, Power, PowerOff } from "lucide-react";
import { fetchAdminDevicesAction, fetchAdminZonesAction, createDeviceAction, editDeviceAction, updateDeviceStatusAction } from "./actions";

interface Device {
  id: string;
  name: string;
  serial_number: string | null;
  device_type: string;
  status: string;
  ip_address?: string | null;
  mac_address?: string | null;
  zones?: { name: string } | null;
  firmware_version?: string | null;
  asset_tag_id?: string | null;
  manufacturer?: string | null;
  model_sku?: string | null;
  commission_date?: string | null;
  warranty_expiry?: string | null;
  vlan_id?: number | null;
  switch_id?: string | null;
  port_number?: number | null;
  zone_id?: string | null;
}

const VLAN_TYPES: Record<string, { label: string; color: string }> = {
  camera: { label: "VLAN 30", color: "text-blue-400 bg-blue-400/10 border-blue-500/20" },
  turnstile: { label: "VLAN 20", color: "text-purple-400 bg-purple-400/10 border-purple-500/20" },
  pos: { label: "VLAN 10", color: "text-[#806b45] bg-[rgba(128,107,69,0.1)] border-[rgba(128,107,69,0.2)]" },
  kiosk: { label: "VLAN 40", color: "text-gray-400 bg-[#020408] border-white/10" },
};

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "online" || s === "nominal") return (
    <span className="flex items-center text-green-400 bg-green-400/10 border border-green-500/20 px-2 py-1 rounded w-fit text-[10px] uppercase font-bold tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2 shadow-[0_0_8px_#22c55e]" /> Online
    </span>
  );
  if (s === "quarantined") return (
    <span className="flex items-center text-yellow-500 bg-yellow-500/10 border border-yellow-500/30 px-2 py-1 rounded w-fit text-[10px] uppercase tracking-wider font-bold shadow-[0_0_10px_rgba(234,179,8,0.2)]">
      <ShieldAlert className="w-3 h-3 mr-1.5" /> Quarantined
    </span>
  );
  return (
    <span className="flex items-center text-red-400 bg-red-400/10 border border-red-500/20 px-2 py-1 rounded w-fit text-[10px] uppercase tracking-wider font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2 shadow-[0_0_8px_#ef4444]" /> Offline
    </span>
  );
}

function VlanBadge({ type, vlan_id }: { type: string, vlan_id?: number | null }) {
  if (vlan_id) {
    return <span className={`text-blue-400 bg-blue-400/10 border border-blue-500/20 px-2 py-1 rounded text-[10px] font-mono`}>VLAN {vlan_id}</span>;
  }
  const map = VLAN_TYPES[type.toLowerCase()] ?? { label: "VLAN —", color: "text-gray-400 bg-[#020408] border-white/10" };
  return (
    <span className={`${map.color} border px-2 py-1 rounded text-[10px] font-mono`}>{map.label}</span>
  );
}

const PAGE_SIZE = 25;

export default function DeviceRegistryPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(0);
  
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [newDevice, setNewDevice] = useState({
    name: "", asset_tag_id: "", mac_address: "", serial_number: "",
    device_type: "camera", manufacturer: "", model_sku: "", firmware_version: "",
    commission_date: "", warranty_expiry: "",
    vlan_id: "", ip_address: "",
    zone_id: "", switch_id: "", port_number: ""
  });

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchLayout = useCallback(async () => {
    setLoading(true);
    const [dData, zData] = await Promise.all([
      fetchAdminDevicesAction(),
      fetchAdminZonesAction()
    ]);
    setDevices(dData as Device[]);
    setZones(zData);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLayout(); }, [fetchLayout]);

  const filtered = devices.filter((d) => {
    const matchSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.asset_tag_id ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.ip_address ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.mac_address ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || d.device_type.toLowerCase() === filterType;
    const matchStatus = filterStatus === "all" || d.status.toLowerCase() === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function openCreate() {
    setActiveDeviceId(null);
    setNewDevice({
      name: "", asset_tag_id: "", mac_address: "", serial_number: "",
      device_type: "camera", manufacturer: "", model_sku: "", firmware_version: "",
      commission_date: "", warranty_expiry: "",
      vlan_id: "", ip_address: "", zone_id: "", switch_id: "", port_number: ""
    });
    setShowModal(true);
  }

  function openEdit(d: Device) {
    setActiveDeviceId(d.id);
    setNewDevice({
      name: d.name,
      asset_tag_id: d.asset_tag_id ?? "",
      mac_address: d.mac_address ?? "",
      serial_number: d.serial_number ?? "",
      device_type: d.device_type,
      manufacturer: d.manufacturer ?? "",
      model_sku: d.model_sku ?? "",
      firmware_version: d.firmware_version ?? "",
      commission_date: d.commission_date ?? "",
      warranty_expiry: d.warranty_expiry ?? "",
      vlan_id: d.vlan_id ? String(d.vlan_id) : "",
      ip_address: d.ip_address ?? "",
      zone_id: d.zone_id ?? "",
      switch_id: d.switch_id ?? "",
      port_number: d.port_number ? String(d.port_number) : ""
    });
    setShowModal(true);
  }

  function handleSaveDevice() {
    if (!newDevice.name.trim() || !newDevice.asset_tag_id.trim()) {
      triggerToast("Error: Device Name and Asset Tag are required identity bounds.");
      return;
    }
    startTransition(async () => {
      const payload = {
        name: newDevice.name,
        device_type: newDevice.device_type,
        serial_number: newDevice.serial_number,
        asset_tag_id: newDevice.asset_tag_id,
        mac_address: newDevice.mac_address,
        manufacturer: newDevice.manufacturer,
        model_sku: newDevice.model_sku,
        firmware_version: newDevice.firmware_version,
        commission_date: newDevice.commission_date || undefined,
        warranty_expiry: newDevice.warranty_expiry || undefined,
        vlan_id: newDevice.vlan_id ? parseInt(newDevice.vlan_id) : null,
        ip_address: newDevice.ip_address,
        zone_id: newDevice.zone_id || undefined,
        switch_id: newDevice.switch_id || undefined,
        port_number: newDevice.port_number ? parseInt(newDevice.port_number) : null
      };
      
      const res = activeDeviceId ? await editDeviceAction(activeDeviceId, payload) : await createDeviceAction(payload);
      if (res.success) {
        triggerToast(`✅ Device ${activeDeviceId ? 'updated' : 'provisioned'} securely onto registry topology.`);
        setShowModal(false);
        fetchLayout();
      } else {
        triggerToast(`❌ Error mapping native object: ${res.error}`);
      }
    });
  }

  function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "online" ? "offline" : "online";
    startTransition(async () => {
      const res = await updateDeviceStatusAction(id, newStatus);
      if (res.success) {
        triggerToast(`⚡ Network status explicitly marked as ${newStatus.toUpperCase()}`);
        setDevices(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
      } else {
        triggerToast(`❌ Error: ${res.error}`);
      }
    });
  }

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-[#020408] border border-[#d4af37]/50 text-white px-6 py-4 rounded shadow-[0_0_20px_rgba(212,175,55,0.3)] animate-in slide-in-from-bottom flex items-center gap-3">
          <span className="font-tech text-sm tracking-wide">{toast}</span>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-white tracking-wider flex items-center gap-3">
            <Server className="w-6 h-6 text-[#d4af37]" /> Core Hardware Registry
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-tech">Unified physical + logical deployment topology</p>
        </div>
        <button onClick={openCreate} className="bg-gradient-to-r from-[#d4af37] to-[#806b45] hover:opacity-90 transition-opacity text-black text-xs font-bold tracking-widest uppercase px-5 py-2.5 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] flex items-center gap-2">
          <Plus className="w-4 h-4" /> Provision Device
        </button>
      </div>

      {/* ── Summary Stats ─────────────────────────────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Nodes", value: devices.length, color: "text-white" },
            { label: "Nominal", value: devices.filter((d) => d.status.toLowerCase() === "online").length, color: "text-green-400" },
            { label: "Fault Detects", value: devices.filter((d) => d.status.toLowerCase() === "offline").length, color: "text-red-400" },
            { label: "Quarantined", value: devices.filter((d) => d.status.toLowerCase() === "quarantined").length, color: "text-yellow-400" },
          ].map((s) => (
            <div key={s.label} className="glass-panel rounded-lg p-5 border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
              <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold">{s.label}</p>
              <h4 className={`font-orbitron tracking-widest text-3xl font-bold mt-2 ${s.color}`}>{s.value}</h4>
            </div>
          ))}
        </div>
      )}

      {/* ── Master Device Table ───────────────────────────────────────── */}
      <div className="glass-panel rounded-lg flex flex-col border border-white/10 shadow-2xl relative z-10">
        <div className="p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[rgba(10,15,25,0.6)]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#806b45]" />
            <input
              type="text"
              placeholder="Search by Device Name, ID, IP, or MAC..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full bg-black/40 border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all font-tech tracking-wide"
            />
          </div>
          <div className="flex items-center space-x-3">
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(0); }} className="bg-black/50 border border-white/10 text-xs tracking-widest uppercase font-bold text-gray-300 rounded px-4 py-2.5 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer" style={{ colorScheme: "dark" }}>
              <option value="all">All Types</option>
              <option value="camera">3D Cameras</option>
              <option value="pos">POS Terminals</option>
              <option value="turnstile">Turnstiles</option>
              <option value="kiosk">Kiosks</option>
              <option value="network_switch">Network Switches</option>
              <option value="sensor">Sensors</option>
            </select>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }} className="bg-black/50 border border-white/10 text-xs tracking-widest uppercase font-bold text-gray-300 rounded px-4 py-2.5 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer" style={{ colorScheme: "dark" }}>
              <option value="all">Any Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="quarantined">Quarantined</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[50vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] text-[#806b45] uppercase tracking-[0.3em] font-bold">Synchronizing Topology...</p>
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
              <Server className="w-12 h-12 text-gray-600" />
              <p className="text-sm font-tech text-gray-400">No telemetry objects matching current filter matrix.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-[rgba(2,4,8,0.8)] border-b border-[#806b45]/30">
                <tr>
                  <th className="px-6 py-4 font-bold">State</th>
                  <th className="px-6 py-4 font-bold">Identity Bounds</th>
                  <th className="px-6 py-4 font-bold">L2 / L3 Layer</th>
                  <th className="px-6 py-4 font-bold">Deployment Uplink</th>
                  <th className="px-6 py-4 font-bold">Specs</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-tech text-xs">
                {paged.map((d) => {
                  const isOffline = d.status.toLowerCase() === "offline";
                  const isQuar = d.status.toLowerCase() === "quarantined";
                  return (
                    <tr key={d.id} className={`hover:bg-[rgba(212,175,55,0.03)] transition-colors group ${isOffline ? "bg-red-500/[0.02]" : ""} ${isQuar ? "bg-yellow-500/[0.05]" : ""}`}>
                      <td className="px-6 py-4">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-6 py-4">
                        <p className={`font-bold tracking-wider mb-1 ${isQuar ? "text-yellow-400" : "text-gray-100"}`}>{d.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[9px] uppercase tracking-widest text-[#d4af37] font-bold border border-[#d4af37]/30 px-1 py-0.5 rounded">{d.device_type}</p>
                          <p className="text-[10px] text-gray-500 tracking-wider">#{d.asset_tag_id ?? d.serial_number ?? d.id.slice(0, 8)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        <div className="flex items-center gap-2 mb-1">
                          <Network className="w-3 h-3 text-gray-500" />
                          <p className="tracking-widest font-mono text-[11px]">{d.ip_address ?? "0.0.0.0"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-[10px] text-gray-500 bg-black px-1 py-0.5 rounded">{d.mac_address ?? "xx:xx:xx:xx:xx:xx"}</code>
                          <VlanBadge type={d.device_type} vlan_id={d.vlan_id} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        <p className="flex items-center gap-1.5 text-xs text-gray-300 mb-1"><MapPin className="w-3 h-3 text-[#806b45]" /> {d.zones?.name ?? "Zone Undefined"}</p>
                        {d.switch_id ? <p className="text-[9px] uppercase tracking-widest text-gray-500">Uplink: {devices.find(x => x.id === d.switch_id)?.name ?? "Core Router"} (Port {d.port_number ?? "-"})</p> : <p className="text-[9px] uppercase tracking-widest text-[#d4af37]">Root Uplink</p>}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        <p className="text-xs mb-1">{d.manufacturer ?? "Unknown"} {d.model_sku}</p>
                        <p className="text-[10px] uppercase font-mono tracking-widest border border-white/10 px-1 py-0.5 w-fit bg-black">FW: {d.firmware_version ?? "1.0.0"}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => toggleStatus(d.id, d.status)} disabled={isPending} className={`p-2 rounded-lg transition-colors border ${isOffline ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20'} disabled:opacity-50`} title={isOffline ? "Activate Device" : "Deactivate Device"}>
                            {isOffline ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openEdit(d)} className="p-2 text-gray-500 hover:text-[#d4af37] bg-black/50 hover:bg-[#d4af37]/10 rounded-lg transition-colors border border-transparent hover:border-[#d4af37]/30">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-white/10 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gray-500 bg-[rgba(10,15,25,0.6)]">
          <span>Viewing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} nodes</span>
          <div className="flex items-center space-x-1 font-sans">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-4 py-2 rounded-l border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-30 border-r-0">PREV</button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= Math.max(0, totalPages - 1)} className="px-4 py-2 rounded-r border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-30">NEXT</button>
          </div>
        </div>
      </div>

      {/* ── Provisioning / Edit Modal ─────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          
          <div className="relative bg-[rgba(10,15,22,0.95)] border border-[#806b45]/40 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#806b45]/20 bg-black/40">
              <div>
                <h3 className="text-xl font-cinzel font-bold text-white tracking-wider flex items-center gap-2">
                  <Server className="w-5 h-5 text-[#d4af37]" /> 
                  {activeDeviceId ? 'Modify Network Node' : 'Provision Hardware Node'}
                </h3>
                <p className="text-[10px] font-tech text-gray-400 mt-1 uppercase tracking-widest px-7">Map Identity, Spanning Tree, and Deployment</p>
              </div>
              <button disabled={isPending} onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full border border-transparent hover:border-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto font-tech">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                <div className="space-y-5">
                  <h4 className="text-[10px] text-[#d4af37] font-bold uppercase tracking-[0.2em] border-b border-[#806b45]/30 pb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Primary Identity Bounds
                  </h4>
                  <div className="space-y-4 text-xs font-bold text-gray-300">
                    <div>
                      <label className="block mb-1.5 uppercase tracking-wider">Device Alias / Hostname *</label>
                      <input type="text" value={newDevice.name} onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none" placeholder="e.g. SW-CORE-01" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1.5 uppercase tracking-wider">Asset Tag ID *</label>
                        <input type="text" value={newDevice.asset_tag_id} onChange={(e) => setNewDevice({ ...newDevice, asset_tag_id: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none font-mono" placeholder="TAG-8821" />
                      </div>
                      <div>
                        <label className="block mb-1.5 uppercase tracking-wider">Serial Number</label>
                        <input type="text" value={newDevice.serial_number} onChange={(e) => setNewDevice({ ...newDevice, serial_number: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none font-mono" placeholder="SN-..." />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-1.5 uppercase tracking-wider">Hardware MAC Address</label>
                      <input type="text" value={newDevice.mac_address} onChange={(e) => setNewDevice({ ...newDevice, mac_address: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none font-mono" placeholder="00:00:00:00:00:00" />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <h4 className="text-[10px] text-[#d4af37] font-bold uppercase tracking-[0.2em] border-b border-[#806b45]/30 pb-2 flex items-center gap-2">
                    <Network className="w-4 h-4" /> OSI L2/L3 Configuration
                  </h4>
                  <div className="space-y-4 text-xs font-bold text-gray-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1.5 uppercase tracking-wider">Assigned IP (IPv4)</label>
                        <input type="text" value={newDevice.ip_address} onChange={(e) => setNewDevice({ ...newDevice, ip_address: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none font-mono" placeholder="10.x.x.x" />
                      </div>
                      <div>
                        <label className="block mb-1.5 uppercase tracking-wider">VLAN Tag</label>
                        <input type="number" min="1" max="4095" value={newDevice.vlan_id} onChange={(e) => setNewDevice({ ...newDevice, vlan_id: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none font-mono" placeholder="1-4095" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block mb-1.5 uppercase tracking-wider">Dependency Uplink (Switch ID)</label>
                        <select value={newDevice.switch_id} onChange={(e) => setNewDevice({ ...newDevice, switch_id: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none cursor-pointer" style={{ colorScheme: "dark" }}>
                          <option value="">[ ROOT NODE / CORE MUX ]</option>
                          {devices.filter(d => d.device_type === 'network_switch' && d.id !== activeDeviceId).map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.ip_address ?? "No IP"})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1.5 uppercase tracking-wider">Switch Port #</label>
                        <input type="number" min="1" max="1000" value={newDevice.port_number} onChange={(e) => setNewDevice({ ...newDevice, port_number: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none font-mono" placeholder="24" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <h4 className="text-[10px] text-[#d4af37] font-bold uppercase tracking-[0.2em] border-b border-[#806b45]/30 pb-2 flex items-center gap-2">
                    <Server className="w-4 h-4" /> Component Specifications
                  </h4>
                  <div className="space-y-4 text-xs font-bold text-gray-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1.5 uppercase tracking-wider">Hardware Object Class</label>
                        <select value={newDevice.device_type} onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2.5 text-[#d4af37] tracking-widest font-bold focus:border-[#d4af37] focus:outline-none cursor-pointer" style={{ colorScheme: "dark" }}>
                          <option value="network_switch">Network Switch / PLC</option>
                          <option value="camera">Depth Camera Lidar</option>
                          <option value="pos">Sales Terminal (POS)</option>
                          <option value="turnstile">M-Gate Turnstile</option>
                          <option value="kiosk">Interactive Kiosk</option>
                          <option value="sensor">Telemetry Sensor</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1.5 uppercase tracking-wider">Firmware / OS version</label>
                        <input type="text" value={newDevice.firmware_version} onChange={(e) => setNewDevice({ ...newDevice, firmware_version: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none font-mono" placeholder="v2.14.0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1.5 uppercase tracking-wider">Manufacturer</label>
                        <input type="text" value={newDevice.manufacturer} onChange={(e) => setNewDevice({ ...newDevice, manufacturer: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none" placeholder="Cisco / Agartha" />
                      </div>
                      <div>
                        <label className="block mb-1.5 uppercase tracking-wider">Model SKU</label>
                        <input type="text" value={newDevice.model_sku} onChange={(e) => setNewDevice({ ...newDevice, model_sku: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none font-mono" placeholder="C9200-48P" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <h4 className="text-[10px] text-[#d4af37] font-bold uppercase tracking-[0.2em] border-b border-[#806b45]/30 pb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Operational Placement
                  </h4>
                  <div className="space-y-4 text-xs font-bold text-gray-300">
                    <div>
                      <label className="block mb-1.5 uppercase tracking-wider">Deployment Zone Boundary</label>
                      <select value={newDevice.zone_id} onChange={(e) => setNewDevice({ ...newDevice, zone_id: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2.5 text-white focus:border-[#d4af37] focus:outline-none cursor-pointer" style={{ colorScheme: "dark" }}>
                        <option value="">[ UNASSIGNED / INVENTORY ]</option>
                        {zones.map(z => (
                          <option key={z.id} value={z.id}>{z.name} ({z.locations?.name || "Global"})</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1.5 uppercase tracking-wider">Commission Date</label>
                        <input type="date" value={newDevice.commission_date} onChange={(e) => setNewDevice({ ...newDevice, commission_date: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none" style={{ colorScheme: "dark" }} />
                      </div>
                      <div>
                        <label className="block mb-1.5 uppercase tracking-wider">Warranty Expiry</label>
                        <input type="date" value={newDevice.warranty_expiry} onChange={(e) => setNewDevice({ ...newDevice, warranty_expiry: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:border-[#d4af37] focus:outline-none" style={{ colorScheme: "dark" }} />
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>

            <div className="p-6 border-t border-[#806b45]/30 bg-black/80 flex justify-end gap-4">
              <button disabled={isPending} onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-white transition-colors">Cancel</button>
              <button disabled={isPending} onClick={handleSaveDevice} className="bg-gradient-to-r from-[#d4af37] to-[#806b45] hover:opacity-90 transition-opacity text-black text-xs font-bold tracking-widest uppercase px-8 py-2.5 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50 disabled:cursor-not-allowed">
                {isPending ? "Executing..." : "Finalize Committment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

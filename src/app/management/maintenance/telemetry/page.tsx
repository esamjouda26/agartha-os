"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchDeviceTopologyAction } from "./actions";
import { RadioTower, Server, Network, ShieldAlert, GitMerge, X, Activity, Package, Calendar, ShieldCheck, History, Truck, Cpu, Tv, Camera, Router, Box, Projector } from "lucide-react";

interface Zone { id: string; name: string; }
interface Device {
  id: string;
  name: string;
  device_type: string;
  status: string;
  ip_address: string | null;
  mac_address: string | null;
  firmware_version: string | null;
  commission_date: string | null;
  warranty_expiry: string | null;
  switch_id: string | null;
  zone_id: string | null;
  spares_available: number;
}

const statusColors: Record<string, string> = { nominal: '#22c55e', warning: '#eab308', fault: '#ef4444', unreachable: '#4b5563' };

function getIconForType(type: string) {
  const t = type.toLowerCase();
  if (t.includes('switch') || type === 'router') return <Router className="w-6 h-6" />;
  if (t.includes('camera')) return <Camera className="w-6 h-6" />;
  if (t.includes('projector')) return <Projector className="w-6 h-6" />;
  if (t.includes('plc') || t.includes('cpu')) return <Cpu className="w-6 h-6" />;
  if (t.includes('led') || t.includes('tv')) return <Tv className="w-6 h-6" />;
  return <Box className="w-6 h-6" />;
}

export default function SpatialTelemetryPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isUnreachable, setIsUnreachable] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetchDeviceTopologyAction();
    if (res.success) {
      setZones(res.zones ?? []);
      setDevices(res.devices ?? []);
      if (res.zones && res.zones.length > 0 && !selectedZone) {
        setSelectedZone(res.zones[0].id);
      }
    }
    setLoading(false);
  }, [selectedZone]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const zoneDevices = useMemo(() => {
    if (!selectedZone) return [];
    return devices.filter(d => d.zone_id === selectedZone);
  }, [selectedZone, devices]);

  const roots = useMemo(() => {
    // Roots are devices in this zone with no switch_id pointing to another device IN THIS ZONE.
    // Ideally, a root has switch_id = null.
    return zoneDevices.filter(d => !d.switch_id || !devices.find(x => x.id === d.switch_id));
  }, [zoneDevices, devices]);

  function getStatusLabel(dbStatus: string) {
    if (dbStatus === 'online') return 'nominal';
    if (dbStatus === 'quarantined') return 'warning';
    return 'fault'; // offline
  }

  const renderTree = (nodeId: string, parentFaulted: boolean): React.ReactNode => {
    const node = zoneDevices.find(n => n.id === nodeId);
    if (!node) return null;

    const dbStatus = getStatusLabel(node.status);
    const renderStatus = parentFaulted ? 'unreachable' : dbStatus;
    const nextParentFaulted = parentFaulted || dbStatus === 'fault';

    const children = zoneDevices.filter(n => n.switch_id === node.id);
    const color = statusColors[renderStatus];

    return (
      <li key={node.id}>
        <div 
          onClick={() => { setSelectedDevice(node); setIsUnreachable(parentFaulted); }}
          className={`node-card ${parentFaulted ? 'unreachable' : ''}`} 
          style={{ borderTopColor: color }}
        >
          <div className="flex items-center justify-center mb-2.5" style={{ color }}>
            {getIconForType(node.device_type)}
          </div>
          <p className="text-xs font-bold text-white truncate px-1">{node.name}</p>
          <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest truncate">{node.device_type.replace('_', ' ')}</p>
        </div>
        {children.length > 0 && (
          <ul>{children.map(child => renderTree(child.id, nextParentFaulted))}</ul>
        )}
      </li>
    );
  };

  const activeZoneObj = zones.find(z => z.id === selectedZone);
  const activeDeviceStatus = selectedDevice ? (isUnreachable ? 'unreachable' : getStatusLabel(selectedDevice.status)) : 'nominal';

  return (
    <div className="flex h-full w-full bg-space relative overflow-hidden text-gray-200" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* ── CSS Injection for Tree Rendering ── */}
      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
        ::-webkit-scrollbar-thumb { background: #806b45; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #d4af37; }
        .tree ul { padding-top: 24px; position: relative; display: flex; justify-content: center; padding-left: 0; }
        .tree li { float: left; text-align: center; list-style-type: none; position: relative; padding: 24px 12px 0 12px; }
        .tree li::before, .tree li::after { content: ''; position: absolute; top: 0; right: 50%; border-top: 2px solid rgba(128, 107, 69, 0.4); width: 50%; height: 24px; z-index: -1; }
        .tree li::after { right: auto; left: 50%; border-left: 2px solid rgba(128, 107, 69, 0.4); }
        .tree li:only-child::after, .tree li:only-child::before { display: none; }
        .tree li:only-child { padding-top: 0; }
        .tree li:first-child::before, .tree li:last-child::after { border: 0 none; }
        .tree li:last-child::before { border-right: 2px solid rgba(128, 107, 69, 0.4); border-radius: 0 4px 0 0; }
        .tree li:first-child::after { border-radius: 4px 0 0 0; }
        .tree ul ul::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 2px solid rgba(128, 107, 69, 0.4); width: 0; height: 24px; z-index: -1; }
        
        .node-card {
            background: rgba(10, 20, 30, 0.5);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(212, 175, 55, 0.15);
            border-top-width: 3px;
            padding: 16px 12px;
            border-radius: 8px;
            width: 154px;
            margin: 0 auto;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .node-card:hover { transform: translateY(-3px); box-shadow: 0 6px 16px rgba(212, 175, 55, 0.15); }
        .node-card.unreachable {
            background: rgba(10, 20, 30, 0.3);
            border-color: rgba(75, 85, 99, 0.3);
            opacity: 0.5;
            filter: grayscale(1);
            border-top-color: #4b5563 !important;
        }
      `}</style>
      
      {/* ── Sidebar ── */}
      <aside className="w-72 border-r border-[#806b45]/30 bg-black/40 flex flex-col z-10 backdrop-blur-md shadow-[4px_0_24px_rgba(0,0,0,0.6)]">
        <div className="px-6 py-6 border-b border-[#806b45]/20 bg-gradient-to-b from-black/50 to-transparent">
          <h2 className="font-cinzel text-xl font-bold tracking-wider text-[#d4af37] flex items-center gap-2">
            <RadioTower className="w-6 h-6" /> Telemetry
          </h2>
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-2">Dependency Mapping</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
             <div className="text-center text-[#d4af37] text-[10px] uppercase font-bold tracking-widest mt-10">Initializing Matrix...</div>
          ) : zones.map(z => {
             const zc = devices.filter(d => d.zone_id === z.id);
             return (
              <button
                key={z.id}
                onClick={() => setSelectedZone(z.id)}
                className={`w-full text-left p-3.5 rounded border transition-colors flex justify-between items-center group
                  ${selectedZone === z.id ? 'border-[#d4af37] bg-[rgba(212,175,55,0.1)] text-white' : 'bg-black/20 border-transparent hover:border-[#d4af37]/50 text-gray-300'}
                `}
              >
                <span className={`text-[13px] font-bold tracking-wider font-tech ${selectedZone === z.id ? 'text-white' : 'group-hover:text-white'}`}>
                  {z.name.replace('Sector', 'S').substring(0, 20)}
                </span>
                <div className="flex gap-1.5 opacity-80">
                  {zc.slice(0, 5).map(c => {
                    const st = getStatusLabel(c.status);
                    return <div key={c.id} className={`w-1.5 h-1.5 rounded-full ${st === 'fault' ? 'bg-red-500' : st === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                  })}
                  {zc.length > 5 && <span className="text-[8px] text-gray-500">+{zc.length - 5}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Main Graph Area ── */}
      <main className="flex-1 relative flex flex-col bg-gradient-to-br from-[#020408] to-[rgba(10,20,30,0.4)]">
        <header className="h-16 border-b border-[#806b45]/20 flex items-center justify-between px-8 bg-black/20 backdrop-blur-sm z-0">
          <h1 className="text-sm font-bold tracking-wider font-cinzel uppercase text-white">
             {loading ? 'Awaiting Data...' : `Topology — ${activeZoneObj?.name ?? 'Select Zone'}`}
          </h1>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-gray-400">
              <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]" /> Nominal
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-gray-400">
              <div className="w-2.5 h-2.5 rounded-full bg-[#eab308] shadow-[0_0_8px_#eab308]" /> Warning
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-gray-400">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444]" /> Fault
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-gray-400">
              <div className="w-2.5 h-2.5 rounded-full bg-[#4b5563]" /> Unreachable
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-12 relative w-full h-full">
          <div className="min-w-max min-h-max pb-32 flex justify-center items-start pt-8">
            {loading ? (
              <div className="text-gray-500 font-mono uppercase tracking-widest flex items-center justify-center pt-32 opacity-50 gap-4 flex-col">
                <Network className="w-12 h-12" /> Parsing Subnet Extents...
              </div>
            ) : roots.length === 0 ? (
              <div className="text-gray-500 font-mono uppercase tracking-widest flex items-center justify-center pt-32 opacity-50 gap-4 flex-col">
                <GitMerge className="w-12 h-12" /> No Physical Network Nodes detected in Zone.
              </div>
            ) : (
              <div className="tree inline-block mt-8">
                <ul>
                  {roots.map(r => renderTree(r.id, false))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Overlay ── */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 transition-opacity" onClick={() => setSelectedDevice(null)} />
      )}

      {/* ── Right Drawer (CI Properties) ── */}
      <div className={`fixed top-0 right-0 w-[420px] h-full bg-[rgba(10,15,22,0.95)] backdrop-blur-xl border-l border-[#d4af37]/30 transform transition-transform duration-300 z-50 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.8)] ${selectedDevice ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedDevice && (
        <>
          <div className="p-6 border-b border-[#806b45]/30 flex justify-between items-center bg-[#020408]/80">
            <div>
              <h3 className="font-cinzel text-xl text-white font-bold tracking-wider uppercase">{selectedDevice.name}</h3>
              <div className="flex items-center gap-3 mt-1.5">
                <p className="text-[10px] bg-black border border-gray-700 px-2 py-0.5 rounded text-gray-400 uppercase font-mono tracking-widest">{selectedDevice.id.slice(0, 8)}</p>
                <p className="text-[10px] uppercase text-[#d4af37] tracking-wider font-bold">{selectedDevice.device_type.replace('_', ' ')}</p>
              </div>
            </div>
            <button onClick={() => setSelectedDevice(null)} className="text-gray-400 hover:text-white transition bg-white/5 hover:bg-white/10 p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 text-sm">
            {/* State Badge */}
            <div className="flex items-center gap-4 bg-black/40 border border-white/5 p-4 rounded-lg">
              <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: statusColors[activeDeviceStatus], boxShadow: `0 0 10px ${statusColors[activeDeviceStatus]}` }} />
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5 font-bold">Current State</span>
                <span className="font-bold tracking-widest uppercase font-orbitron text-lg" style={{ color: statusColors[activeDeviceStatus] }}>
                  {activeDeviceStatus}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div>
              <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 border-b border-[#806b45]/20 pb-1.5 flex items-center gap-2 font-bold">
                <Server className="w-3.5 h-3.5" /> Hardware Element Data
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-black/40 border border-white/5 rounded">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1.5"><Activity className="w-3 h-3 text-[#d4af37]" /> Live Protocol</p>
                  <p className={`text-xs tracking-wide font-mono ${activeDeviceStatus === 'fault' || isUnreachable ? 'text-red-400' : 'text-white'}`}>
                    {isUnreachable ? 'UNREACHABLE (Upstream Fault)' : activeDeviceStatus === 'fault' ? 'ERR_CONN_REFUSED / 100% loss' : `${selectedDevice.ip_address ?? "Static Base"} / Ping: 2ms`}
                  </p>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1.5"><Package className="w-3 h-3 text-[#d4af37]" /> Local Spares</p>
                  <p className="text-white text-xs tracking-wide">{selectedDevice.spares_available} <span className="text-gray-500">Units</span></p>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1.5"><Calendar className="w-3 h-3 text-[#d4af37]" /> Commission Date</p>
                  <p className="text-white text-xs tracking-wide">{selectedDevice.commission_date ?? "Unknown"}</p>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-[#d4af37]" /> Warranty</p>
                  <p className="text-white text-xs tracking-wide uppercase font-mono">{selectedDevice.warranty_expiry ?? "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Immutable History Placeholder */}
            <div>
              <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 border-b border-[#806b45]/20 pb-1.5 flex items-center gap-2 font-bold">
                <History className="w-3.5 h-3.5" /> Maintenance Log
              </h4>
              <div className="p-3 bg-black/50 border-l-[3px] border-[#806b45] text-xs rounded-r">
                <p className="text-[9px] text-[#d4af37] tracking-widest uppercase mb-1 font-bold">{new Date().toISOString().split('T')[0]}</p>
                <p className="text-gray-300 leading-relaxed">Initialized structural bindings to global Spanning Tree interface.</p>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-[#806b45]/30 flex flex-col gap-3 bg-black/80 pb-8">
            <button className="w-full py-3.5 bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-[#ffd700] text-black font-cinzel font-bold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]">
              <Truck className="w-4 h-4" /> Dispatch Crew Unit
            </button>
          </div>
        </>
        )}
      </div>

    </div>
  );
}

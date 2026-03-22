"use client";

import { useState, useEffect, useCallback, useTransition, useOptimistic } from "react";
import {
  ShieldAlert, Activity, Clock, Archive, Plus, X, Globe, HardHat,
  AlertTriangle, Send, Power, CheckCircle2, ArrowDownUp, Edit2, XCircle,
  Wrench, Timer, ClipboardCheck,
} from "lucide-react";
import { StatusBadge, KpiCard } from "@/components/shared";
import {
  fetchMaintenanceWorkOrdersAction,
  createWorkOrderAction,
  updateWorkOrderAction,
  revokeMabAction,
  completeWorkOrderAction,
  fetchSelectableVendorsAction,
  fetchSelectableSponsorsAction,
} from "../actions/maintenance";

// ── Types ───────────────────────────────────────────────────────────────────

interface WorkOrder {
  id: string; target_ci_id: string; vendor_id: string; vendor_company: string; vendor_mac_address: string | null;
  scheduled_start: string; scheduled_end: string; mab_limit_hours: number;
  scope: string | null;
  status: "pending_mac" | "active_mab" | "completed" | "revoked";
  sponsor_id: string | null; created_at: string; updated_at: string | null;
}

const STATUS_DISPLAY: Record<string, { label: string; cls: string; dot: string }> = {
  pending_mac: { label: "Awaiting Window", cls: "text-amber-400 bg-amber-500/10 border-amber-500/30", dot: "bg-amber-500" },
  active_mab:  { label: "MAB Active",      cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-500" },
  completed:   { label: "Completed",       cls: "text-gray-400 bg-gray-500/10 border-gray-500/20", dot: "bg-gray-500" },
  revoked:     { label: "Revoked",         cls: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-500" },
};

function formatDt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function MaintenancePage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [vendors, setVendors] = useState<{id: string; name: string}[]>([]);
  const [sponsors, setSponsors] = useState<{id: string; legal_name: string; role: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [topology, setTopology] = useState<"remote" | "onsite">("remote");

  type WoAction =
    | { type: "add"; wo: WorkOrder }
    | { type: "update_status"; id: string; status: WorkOrder["status"]; mac?: string }
    | { type: "remove"; id: string };

  const [optimisticWos, setOptimisticWos] = useOptimistic(
    workOrders,
    (current: WorkOrder[], action: WoAction) => {
      switch (action.type) {
        case "add": return [action.wo, ...current];
        case "update_status": return current.map((wo) => wo.id === action.id ? { ...wo, status: action.status, ...(action.mac ? { vendor_mac_address: action.mac } : {}) } : wo);
        case "remove": return current.filter((wo) => wo.id !== action.id);
        default: return current;
      }
    }
  );

  const [editWoId, setEditWoId] = useState<string | null>(null);
  const [newWo, setNewWo] = useState({ target_ci_id: "", vendor_company: "", scheduled_start: "", scheduled_end: "", mab_limit_hours: 4, sponsor: "", scope: "" });

  const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [woData, vData, sData] = await Promise.all([
      fetchMaintenanceWorkOrdersAction(),
      fetchSelectableVendorsAction(),
      fetchSelectableSponsorsAction()
    ]);
    setWorkOrders(woData);
    setVendors(vData);
    setSponsors(sData);
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  // Categorize work orders
  const liveWos = optimisticWos.filter((wo) => wo.status === "active_mab");
  const queueWos = optimisticWos.filter((wo) => wo.status === "pending_mac");
  const recentWos = optimisticWos.filter((wo) => wo.status === "completed" || wo.status === "revoked");

  const isFormValid = newWo.target_ci_id.trim() !== "" && 
                      newWo.vendor_company.trim() !== "" && 
                      newWo.scheduled_start !== "" && 
                      newWo.scheduled_end !== "" &&
                      (topology === "remote" || newWo.sponsor !== "");

  function handleSave() {
    if (!isFormValid) return;
    startTransition(async () => {
      if (editWoId) {
        setOptimisticWos({ type: "update_status", id: editWoId, status: "pending_mac" });
        const res = await updateWorkOrderAction(editWoId, { 
          target_ci_id: newWo.target_ci_id,
          vendor_id: newWo.vendor_company,
          mab_limit_hours: newWo.mab_limit_hours,
          assigned_to: topology === "onsite" ? newWo.sponsor : undefined,
          topology,
          scope: newWo.scope,
          scheduled_start: new Date(newWo.scheduled_start).toISOString(), 
          scheduled_end: new Date(newWo.scheduled_end).toISOString() 
        });
        if (res.success) { 
          showToast(`✅ Work Order updated.`); 
          setShowCreate(false); 
          setEditWoId(null); 
          setNewWo({ target_ci_id: "", vendor_company: "", scheduled_start: "", scheduled_end: "", mab_limit_hours: 4, sponsor: "", scope: "" }); 
          refresh(); 
        }
        else { showToast(`Error: ${res.error}`); refresh(); }
      } else {
        const tempWo: WorkOrder = {
          id: `temp-${Date.now()}`, target_ci_id: newWo.target_ci_id, vendor_company: "Saving...", vendor_id: newWo.vendor_company,
          vendor_mac_address: null, scheduled_start: new Date(newWo.scheduled_start).toISOString(),
          scheduled_end: new Date(newWo.scheduled_end).toISOString(), mab_limit_hours: newWo.mab_limit_hours,
          scope: newWo.scope,
          status: "pending_mac", sponsor_id: null, created_at: new Date().toISOString(), updated_at: null,
        };
        setOptimisticWos({ type: "add", wo: tempWo });
        const res = await createWorkOrderAction({ 
          target_ci_id: newWo.target_ci_id,
          vendor_id: newWo.vendor_company,
          mab_limit_hours: newWo.mab_limit_hours,
          assigned_to: topology === "onsite" ? newWo.sponsor : undefined,
          topology,
          scope: newWo.scope,
          scheduled_start: new Date(newWo.scheduled_start).toISOString(), 
          scheduled_end: new Date(newWo.scheduled_end).toISOString() 
        });
        if (res.success) { showToast(`✅ Work Order dispatched and queued.`); setShowCreate(false); setNewWo({ target_ci_id: "", vendor_company: "", scheduled_start: "", scheduled_end: "", mab_limit_hours: 4, sponsor: "", scope: "" }); refresh(); }
        else { showToast(`Error: ${res.error}`); refresh(); }
      }
    });
  }

  function handleEditInit(wo: WorkOrder) {
    setEditWoId(wo.id);
    setNewWo({
      target_ci_id: wo.target_ci_id,
      vendor_company: wo.vendor_id,
      scheduled_start: new Date(wo.scheduled_start).toISOString().slice(0, 16),
      scheduled_end: new Date(wo.scheduled_end).toISOString().slice(0, 16),
      mab_limit_hours: wo.mab_limit_hours,
      sponsor: wo.sponsor_id || "", 
      scope: wo.scope || "",
    });
    setTopology(wo.vendor_mac_address ? "remote" : "onsite");
    setShowCreate(true);
  }

  function handleRevoke(woId: string) {
    startTransition(async () => {
      setOptimisticWos({ type: "update_status", id: woId, status: "revoked" });
      const res = await revokeMabAction(woId);
      if (res.success) { showToast("🔒 MAC Revoked — Port Locked"); refresh(); }
      else { showToast(`Error: ${res.error}`); refresh(); }
    });
  }

  function handleComplete(woId: string) {
    startTransition(async () => {
      setOptimisticWos({ type: "update_status", id: woId, status: "completed" });
      const res = await completeWorkOrderAction(woId);
      if (res.success) { showToast("Work order completed"); refresh(); }
      else { showToast(`Error: ${res.error}`); refresh(); }
    });
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-end pb-4 border-b border-[#806b45]/30">
        
        <button onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-black font-bold uppercase tracking-widest px-6 py-2.5 rounded transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] text-xs">
          <Plus className="w-4 h-4" /> Create Work Order
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-8">
          {/* ═══ KPI SUMMARY ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="Live Sessions" value={liveWos.length} icon={Activity}
              variant={liveWos.length > 3 ? "danger" : liveWos.length > 0 ? "warning" : "default"}
              subtitle="Active MAB sessions" />
            <KpiCard title="Dispatch Queue" value={queueWos.length} icon={Timer}
              variant={queueWos.length > 5 ? "warning" : "default"}
              subtitle="Awaiting window" />
            <KpiCard title="Completed (24H)" value={recentWos.filter(w => w.status === "completed").length} icon={ClipboardCheck}
              variant="success"
              subtitle="Successfully closed" />
            <KpiCard title="Revoked (24H)" value={recentWos.filter(w => w.status === "revoked").length} icon={Wrench}
              variant={recentWos.filter(w => w.status === "revoked").length > 0 ? "danger" : "default"}
              subtitle="Sessions killed" />
          </div>

          {/* ═══ SECTION A: LIVE SESSIONS ═══ */}
          <section className="glass-panel rounded-lg p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_15px_#ef4444] animate-pulse" />
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-5 h-5 text-red-400" />
              <h2 className="font-cinzel text-base text-white font-bold tracking-wider uppercase">Live Sessions</h2>
              <div className="ml-3 px-2 py-0.5 bg-red-500/20 border border-red-500/50 rounded text-[10px] text-red-400 font-bold tracking-widest uppercase animate-pulse">{liveWos.length} Active</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[9px] text-gray-500 uppercase tracking-widest">
                    {["WO ID", "Target CI", "Vendor Group", "Execution", "Time Remaining", "Rx/Tx", "Action"].map((h) => (
                      <th key={h} className={`py-3 px-4 font-normal ${h === "Action" ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-300">
                  {liveWos.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-gray-600 text-xs">No active sessions</td></tr>
                  ) : liveWos.map((wo) => {
                    const endTime = new Date(wo.scheduled_end);
                    const now = new Date();
                    const remainMs = endTime.getTime() - now.getTime();
                    const remainMin = Math.max(0, Math.floor(remainMs / 60000));
                    const limitMin = wo.mab_limit_hours * 60;
                    const elapsed = limitMin - remainMin;
                    const pct = Math.min(100, Math.round((elapsed / limitMin) * 100));
                    const isWarning = pct >= 80;
                    return (
                      <tr key={wo.id} className={`border-b border-white/5 hover:bg-[rgba(212,175,55,0.03)] transition-colors ${isWarning ? "bg-red-950/10" : ""}`}>
                        <td className="py-4 px-4 font-orbitron text-[#d4af37] font-bold text-[11px]">{wo.id.slice(0, 8).toUpperCase()}</td>
                        <td className="py-4 px-4"><span className="bg-black/40 px-2 py-1 rounded border border-white/5 text-xs">{wo.target_ci_id}</span></td>
                        <td className="py-4 px-4">{wo.vendor_company}</td>
                        <td className="py-4 px-4">
                          {wo.vendor_mac_address ? (
                            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 uppercase tracking-wider"><Globe className="w-3 h-3" /> Remote (PAM)</span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[10px] text-blue-400 uppercase tracking-wider"><HardHat className="w-3 h-3" /> On-Site</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-between text-[10px] mb-1 font-mono">
                            <span className={isWarning ? "text-red-400 font-bold" : ""}>{remainMin}m</span>
                            <span className="text-gray-500">{limitMin}m limit</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${isWarning ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gradient-to-r from-[#d4af37] to-yellow-300"}`} style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-[10px] text-emerald-400">
                          {wo.vendor_mac_address ? <span className="flex items-center gap-1">12kb/s <ArrowDownUp className="w-3 h-3 inline" /></span> : <span className="text-gray-500">N/A (Physical)</span>}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleComplete(wo.id)} disabled={isPending}
                              className="bg-gray-800/50 text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded transition-colors text-[10px] font-bold uppercase tracking-widest">✓ Complete</button>
                            <button onClick={() => handleRevoke(wo.id)} disabled={isPending}
                              className="bg-red-950/40 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 hover:border-red-500 px-3 py-1.5 rounded transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                              <Power className="w-3 h-3" /> Kill Session
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ═══ SECTION B: DISPATCH QUEUE ═══ */}
          <section className="glass-panel rounded-lg p-6">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-5 h-5 text-gray-400" />
              <h2 className="font-cinzel text-base text-white font-bold tracking-wider uppercase">Dispatch Queue</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[9px] text-gray-500 uppercase tracking-widest">
                    {["WO ID", "Target CI", "Vendor", "Sched. Start", "MAD", "Status", "Actions"].map((h) => (
                      <th key={h} className={`py-3 px-4 font-normal ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-300">
                  {queueWos.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-gray-600 text-xs">No pending work orders</td></tr>
                  ) : queueWos.map((wo) => (
                    <tr key={wo.id} className="border-b border-white/5 hover:bg-[rgba(212,175,55,0.03)] transition-colors opacity-80 hover:opacity-100">
                      <td className="py-3 px-4 font-orbitron text-gray-400 text-[11px]">{wo.id.slice(0, 8).toUpperCase()}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold">{wo.target_ci_id}</div>
                        {wo.scope && <div className="text-[10px] text-gray-500 truncate max-w-[150px] mt-0.5">{wo.scope}</div>}
                      </td>
                      <td className="py-3 px-4">{wo.vendor_company}</td>
                      <td className="py-3 px-4 font-mono text-[10px]">{formatDt(wo.scheduled_start)}</td>
                      <td className="py-3 px-4 font-mono text-[10px]">{wo.mab_limit_hours * 60}m</td>
                      <td className="py-3 px-4">
                        <StatusBadge status="pending_mac" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEditInit(wo)} disabled={isPending}
                            className="bg-blue-600/80 text-white hover:bg-blue-500 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-40">Edit</button>
                          <button onClick={() => handleRevoke(wo.id)} disabled={isPending}
                            className="bg-red-950/40 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 hover:border-red-500 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-40">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ═══ SECTION C: RECENT DISPATCHES ═══ */}
          <section className="glass-panel rounded-lg p-6">
            <div className="flex items-center gap-2 mb-5">
              <Archive className="w-5 h-5 text-gray-400" />
              <h2 className="font-cinzel text-base text-white font-bold tracking-wider uppercase">Recent Dispatches (24H)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[9px] text-gray-500 uppercase tracking-widest">
                    {["WO ID", "Target CI", "Resolution State", "Actual Downtime"].map((h) => (
                      <th key={h} className="py-3 px-4 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-400 opacity-70">
                  {recentWos.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-gray-600 text-xs">No recent dispatches</td></tr>
                  ) : recentWos.map((wo) => {
                    const isComplete = wo.status === "completed";
                    const start = new Date(wo.scheduled_start);
                    const end = wo.updated_at ? new Date(wo.updated_at) : new Date(wo.scheduled_end);
                    const downtime = Math.round((end.getTime() - start.getTime()) / 60000);
                    return (
                      <tr key={wo.id} className="border-b border-white/5">
                        <td className="py-3 px-4 font-orbitron text-[11px]">{wo.id.slice(0, 8).toUpperCase()}</td>
                        <td className="py-3 px-4">{wo.target_ci_id}</td>
                        <td className={`py-3 px-4 ${isComplete ? "text-emerald-400" : "text-red-500"}`}>
                          {isComplete ? "SUCCESS" : "REVOKED"} — {isComplete ? "Work Completed" : "MAC Revoked"}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px]">
                          {downtime > 0 ? `${downtime}m` : "—"}{wo.status === "revoked" ? " (Aborted)" : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ═══ CREATE WORK ORDER MODAL (Dispatch Scheduler) ═══ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-[rgba(10,15,22,0.95)] border border-[rgba(212,175,55,0.3)] rounded-xl w-full max-w-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_40px_rgba(212,175,55,0.1)] flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#806b45]/30 bg-[#020408]/80 flex justify-between items-center sticky top-0 z-10 rounded-t-xl">
              <div className="flex items-center gap-3">
                <Send className="w-5 h-5 text-[#d4af37]" />
                <h2 className="font-cinzel text-lg text-white font-bold tracking-wider uppercase">Dispatch Scheduler</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white transition p-2 bg-white/5 hover:bg-white/10 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Target & Vendor */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-2">Target Configuration Item (CI)</label>
                  <input type="text" value={newWo.target_ci_id} onChange={(e) => setNewWo({ ...newWo, target_ci_id: e.target.value })}
                    placeholder="e.g. CI-1004" className="w-full bg-black/50 border border-white/10 text-white px-3.5 py-2.5 rounded text-sm font-mono focus:outline-none focus:border-[#d4af37] focus:shadow-[0_0_10px_rgba(212,175,55,0.2)] transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-2">Vendor Assignment</label>
                  <select value={newWo.vendor_company} onChange={(e) => setNewWo({ ...newWo, vendor_company: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 text-white px-3.5 py-2.5 rounded text-sm focus:outline-none focus:border-[#d4af37] cursor-pointer">
                    <option value="">Select vendor…</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Execution Topology */}
              <div className="border border-white/10 rounded-lg p-5 bg-black/30">
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-3">Execution Topology</label>
                <div className="flex gap-3 mb-4">
                  <button type="button" onClick={() => setTopology("remote")}
                    className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 border rounded text-xs uppercase tracking-wider transition-all ${topology === "remote" ? "bg-[rgba(212,175,55,0.15)] border-[#d4af37] text-[#d4af37] font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]" : "border-white/10 bg-black/40 text-gray-500 hover:text-gray-300"}`}>
                    <Globe className="w-4 h-4" /> Remote (PAM Proxy)
                  </button>
                  <button type="button" onClick={() => setTopology("onsite")}
                    className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 border rounded text-xs uppercase tracking-wider transition-all ${topology === "onsite" ? "bg-[rgba(212,175,55,0.15)] border-[#d4af37] text-[#d4af37] font-semibold shadow-[0_0_10px_rgba(212,175,55,0.2)]" : "border-white/10 bg-black/40 text-gray-500 hover:text-gray-300"}`}>
                    <HardHat className="w-4 h-4" /> On-Site (Physical MAB)
                  </button>
                </div>
                {topology === "onsite" && (
                  <div className="transition-all">
                    <label className="block text-[10px] text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Internal Sponsor Required
                    </label>
                    <select value={newWo.sponsor} onChange={(e) => setNewWo({ ...newWo, sponsor: e.target.value })}
                      className="w-full bg-black/50 border border-amber-500/30 text-white px-3.5 py-2.5 rounded text-sm focus:outline-none focus:border-amber-500 cursor-pointer">
                      <option value="" disabled>Select escort/sponsor…</option>
                      {sponsors.map((s) => (
                        <option key={s.id} value={s.id}>{s.legal_name} ({s.role})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {/* SLA Bounds */}
              <div>
                <h3 className="text-xs text-white uppercase tracking-widest mb-4 border-b border-white/10 pb-2">SLA & Time Bounds</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-2">MAD Limit (Mins)</label>
                    <input type="number" value={newWo.mab_limit_hours * 60} onChange={(e) => setNewWo({ ...newWo, mab_limit_hours: Math.max(1, Number(e.target.value) / 60) })}
                      className="w-full bg-black/50 border border-white/10 text-white px-3.5 py-2.5 rounded text-sm font-mono text-center focus:outline-none focus:border-[#d4af37] transition-all" />
                    <p className="text-[8px] text-gray-500 mt-1 uppercase tracking-wider">Max Allowable Downtime</p>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-2">Sched. Start</label>
                    <input type="datetime-local" value={newWo.scheduled_start} onChange={(e) => setNewWo({ ...newWo, scheduled_start: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 text-white px-3.5 py-2.5 rounded text-xs font-mono focus:outline-none focus:border-[#d4af37] transition-all" style={{ colorScheme: "dark" }} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-2">Sched. End</label>
                    <input type="datetime-local" value={newWo.scheduled_end} onChange={(e) => setNewWo({ ...newWo, scheduled_end: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 text-white px-3.5 py-2.5 rounded text-xs font-mono focus:outline-none focus:border-[#d4af37] transition-all" style={{ colorScheme: "dark" }} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-2">Summary / Scope of Work</label>
                <textarea value={newWo.scope} onChange={(e) => setNewWo({ ...newWo, scope: e.target.value })}
                  placeholder="Brief description of intended actions..." className="w-full bg-black/50 border border-white/10 text-white px-3.5 py-2.5 rounded text-sm h-24 resize-none focus:outline-none focus:border-[#d4af37] transition-all" />
              </div>
            </div>
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#806b45]/30 bg-[#020408]/90 flex justify-end gap-3 sticky bottom-0 rounded-b-xl">
              <button onClick={() => { setShowCreate(false); setEditWoId(null); }} className="px-5 py-2 rounded text-xs text-gray-400 hover:text-white hover:bg-white/5 uppercase tracking-widest transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={isPending || !isFormValid}
                className="px-6 py-2 rounded bg-[#d4af37] text-black font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)] disabled:opacity-40 disabled:cursor-not-allowed">
                <Send className="w-3.5 h-3.5" /> {editWoId ? "Save Changes" : "Dispatch & Queue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 right-8 bg-green-500/20 border border-green-500/40 text-green-400 px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm text-sm font-semibold flex items-center gap-2 z-50">
          <CheckCircle2 className="w-5 h-5" /><span>{toast}</span>
        </div>
      )}
    </div>
  );
}

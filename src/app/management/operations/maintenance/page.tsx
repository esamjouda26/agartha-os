"use client";

import { useState, useEffect, useCallback, useTransition, useOptimistic } from "react";
import {
  fetchMaintenanceWorkOrdersAction,
  createWorkOrderAction,
  authorizeMabAction,
  revokeMabAction,
  completeWorkOrderAction,
} from "../actions/maintenance";

interface WorkOrder {
  id: string;
  target_ci_id: string;
  vendor_company: string;
  vendor_mac_address: string | null;
  scheduled_start: string;
  scheduled_end: string;
  mab_limit_hours: number;
  status: "pending_mac" | "active_mab" | "completed" | "revoked";
  sponsor_id: string | null;
  created_at: string;
  updated_at: string | null;
}

const STATUS_DISPLAY: Record<string, { label: string; cls: string; dot: string }> = {
  pending_mac: { label: "PENDING MAC", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20", dot: "bg-amber-500" },
  active_mab: { label: "MAB ACTIVE", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-500" },
  completed: { label: "COMPLETED", cls: "text-muted-foreground bg-muted/20 border-border", dot: "bg-muted-foreground" },
  revoked: { label: "REVOKED", cls: "text-red-400 bg-red-500/10 border-red-500/20", dot: "bg-red-500" },
};

function formatDt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function MaintenancePage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // L-2: Optimistic work order state for immediate UI feedback
  type WoAction =
    | { type: "add"; wo: WorkOrder }
    | { type: "update_status"; id: string; status: WorkOrder["status"]; mac?: string }
    | { type: "remove"; id: string };

  const [optimisticWos, setOptimisticWos] = useOptimistic(
    workOrders,
    (current: WorkOrder[], action: WoAction) => {
      switch (action.type) {
        case "add":
          return [action.wo, ...current];
        case "update_status":
          return current.map((wo) =>
            wo.id === action.id
              ? { ...wo, status: action.status, ...(action.mac ? { vendor_mac_address: action.mac } : {}) }
              : wo
          );
        case "remove":
          return current.filter((wo) => wo.id !== action.id);
        default:
          return current;
      }
    }
  );

  // MAC input state per WO
  const [macInputs, setMacInputs] = useState<Record<string, string>>({});

  // Create form
  const [newWo, setNewWo] = useState({ target_ci_id: "", vendor_company: "", scheduled_start: "", scheduled_end: "", mab_limit_hours: 4 });

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await fetchMaintenanceWorkOrdersAction();
    setWorkOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  function handleCreate() {
    if (!newWo.target_ci_id || !newWo.vendor_company || !newWo.scheduled_start || !newWo.scheduled_end) return;
    startTransition(async () => {
      // L-2: Optimistically add the new WO to the list
      const tempWo: WorkOrder = {
        id: `temp-${Date.now()}`,
        target_ci_id: newWo.target_ci_id,
        vendor_company: newWo.vendor_company,
        vendor_mac_address: null,
        scheduled_start: new Date(newWo.scheduled_start).toISOString(),
        scheduled_end: new Date(newWo.scheduled_end).toISOString(),
        mab_limit_hours: newWo.mab_limit_hours,
        status: "pending_mac",
        sponsor_id: null,
        created_at: new Date().toISOString(),
        updated_at: null,
      };
      setOptimisticWos({ type: "add", wo: tempWo });

      const res = await createWorkOrderAction({
        ...newWo,
        scheduled_start: new Date(newWo.scheduled_start).toISOString(),
        scheduled_end: new Date(newWo.scheduled_end).toISOString(),
      });
      if (res.success) { showToast("Work order created"); setShowCreate(false); setNewWo({ target_ci_id: "", vendor_company: "", scheduled_start: "", scheduled_end: "", mab_limit_hours: 4 }); refresh(); }
      else { showToast(`Error: ${res.error}`); refresh(); }
    });
  }

  function handleAuthorizeMab(woId: string) {
    const mac = macInputs[woId]?.trim();
    if (!mac) { showToast("Enter a MAC address first"); return; }
    startTransition(async () => {
      // L-2: Optimistically transition to active_mab
      setOptimisticWos({ type: "update_status", id: woId, status: "active_mab", mac: mac.toUpperCase() });
      const res = await authorizeMabAction(woId, mac);
      if (res.success) { showToast("✅ MAB Authorized — Port Unlocked"); refresh(); }
      else { showToast(`Error: ${res.error}`); refresh(); }
    });
  }

  function handleRevoke(woId: string) {
    startTransition(async () => {
      // L-2: Optimistically transition to revoked
      setOptimisticWos({ type: "update_status", id: woId, status: "revoked" });
      const res = await revokeMabAction(woId);
      if (res.success) { showToast("🔒 MAC Revoked — Port Locked"); refresh(); }
      else { showToast(`Error: ${res.error}`); refresh(); }
    });
  }

  function handleComplete(woId: string) {
    startTransition(async () => {
      // L-2: Optimistically transition to completed
      setOptimisticWos({ type: "update_status", id: woId, status: "completed" });
      const res = await completeWorkOrderAction(woId);
      if (res.success) { showToast("Work order completed"); refresh(); }
      else { showToast(`Error: ${res.error}`); refresh(); }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gradient">Maintenance & Vendor PAM</h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
            MAC Authentication Bypass — Change of Authorization Control
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreate(!showCreate)} className="bg-primary text-primary-foreground font-bold py-2 px-5 rounded-lg text-xs uppercase tracking-widest hover:opacity-90 transition">
            + New Work Order
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="glass rounded-xl p-6 border-primary/20">
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Create Maintenance Work Order</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Target CI / Asset</label>
              <input type="text" value={newWo.target_ci_id} onChange={(e) => setNewWo({ ...newWo, target_ci_id: e.target.value })} placeholder="e.g. SW-CORE-01-P24" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Vendor Company</label>
              <input type="text" value={newWo.vendor_company} onChange={(e) => setNewWo({ ...newWo, vendor_company: e.target.value })} placeholder="e.g. Orbbec Technologies" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">MAB Limit (Hours)</label>
              <input type="number" value={newWo.mab_limit_hours} onChange={(e) => setNewWo({ ...newWo, mab_limit_hours: Number(e.target.value) })} min={1} max={24} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Scheduled Start</label>
              <input type="datetime-local" value={newWo.scheduled_start} onChange={(e) => setNewWo({ ...newWo, scheduled_start: e.target.value })} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none" style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Scheduled End</label>
              <input type="datetime-local" value={newWo.scheduled_end} onChange={(e) => setNewWo({ ...newWo, scheduled_end: e.target.value })} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none" style={{ colorScheme: "dark" }} />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleCreate} disabled={isPending} className="flex-1 bg-primary text-primary-foreground font-bold py-2 px-4 rounded-md text-xs uppercase tracking-widest hover:opacity-90 transition disabled:opacity-40">
                {isPending ? "Creating…" : "Create WO"}
              </button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-border text-muted-foreground rounded-md text-xs hover:text-primary transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Work Orders List */}
      {loading ? (
        <div className="glass rounded-xl p-12 text-center">
          <div className="animate-pulse text-muted-foreground text-sm">Loading work orders…</div>
        </div>
      ) : optimisticWos.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No maintenance work orders found.</p>
          <p className="text-[11px] text-muted-foreground/50 mt-1">Create a work order to begin vendor PAM orchestration.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {optimisticWos.map((wo) => {
            const statusInfo = STATUS_DISPLAY[wo.status] ?? STATUS_DISPLAY.pending_mac;
            return (
              <div key={wo.id} className="glass rounded-xl overflow-hidden">
                {/* WO Header */}
                <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-border/30">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusInfo.dot} animate-pulse`} />
                        <h4 className="text-sm font-bold text-foreground">{wo.target_ci_id}</h4>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{wo.vendor_company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">Window</span>
                      <span className="text-xs text-foreground font-mono">{formatDt(wo.scheduled_start)} → {formatDt(wo.scheduled_end)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">MAB Limit</span>
                      <span className="text-xs text-foreground font-bold">{wo.mab_limit_hours}h</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${statusInfo.cls}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Action Area */}
                <div className="px-5 py-4">
                  {wo.status === "pending_mac" && (
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Vendor MAC Address</label>
                        <input
                          type="text"
                          value={macInputs[wo.id] ?? ""}
                          onChange={(e) => setMacInputs((prev) => ({ ...prev, [wo.id]: e.target.value }))}
                          placeholder="AA:BB:CC:DD:EE:FF"
                          className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm font-mono uppercase focus:border-primary focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleAuthorizeMab(wo.id)}
                        disabled={isPending || !macInputs[wo.id]?.trim()}
                        className="bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-widest hover:bg-emerald-700 transition disabled:opacity-40 shadow-lg shadow-emerald-600/20"
                      >
                        {isPending ? "Authorizing…" : "⚡ Authorize MAB & Unlock Port"}
                      </button>
                    </div>
                  )}

                  {wo.status === "active_mab" && (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 text-lg animate-pulse">🟢</span>
                        <div>
                          <span className="text-xs text-foreground font-bold">Port Active — MAC Authenticated</span>
                          <span className="text-[10px] text-muted-foreground block font-mono mt-0.5">{wo.vendor_mac_address}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleComplete(wo.id)}
                          disabled={isPending}
                          className="bg-muted/30 border border-border text-muted-foreground font-bold py-2.5 px-5 rounded-lg text-xs uppercase tracking-widest hover:text-primary hover:border-primary/30 transition disabled:opacity-40"
                        >
                          ✓ Mark Complete
                        </button>
                        <button
                          onClick={() => handleRevoke(wo.id)}
                          disabled={isPending}
                          className="bg-red-600 text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-widest hover:bg-red-700 transition disabled:opacity-40 shadow-lg shadow-red-600/20"
                        >
                          {isPending ? "Revoking…" : "🔒 Revoke MAC & Lock Port"}
                        </button>
                      </div>
                    </div>
                  )}

                  {(wo.status === "completed" || wo.status === "revoked") && (
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground/50 text-sm">{wo.status === "completed" ? "✓" : "✕"}</span>
                      <div>
                        <span className="text-xs text-muted-foreground/60">
                          {wo.status === "completed" ? "Work order completed normally." : "MAC revoked — port locked."}
                        </span>
                        {wo.vendor_mac_address && (
                          <span className="text-[10px] text-muted-foreground/30 block font-mono mt-0.5">MAC: {wo.vendor_mac_address}</span>
                        )}
                        {wo.updated_at && (
                          <span className="text-[10px] text-muted-foreground/30 block mt-0.5">{wo.status === "revoked" ? "Revoked" : "Closed"} at {formatDt(wo.updated_at)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-success/90 border border-success text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 backdrop-blur-md z-[60]">
          <span className="text-sm font-bold tracking-wide">{toast}</span>
        </div>
      )}
    </div>
  );
}

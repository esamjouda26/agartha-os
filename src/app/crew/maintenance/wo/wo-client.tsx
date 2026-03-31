"use client";

import { useState, useTransition } from "react";
import { Wrench, Clock, Monitor, Wifi, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import type { WorkOrder } from "./actions";
import { updateVendorMac } from "./actions";

const STATUS_STYLES: Record<string, string> = {
  scheduled:   "text-amber-400 bg-amber-400/10 border-amber-400/30",
  active:      "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  pending_mac: "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

const TOPOLOGY_ICON: Record<string, typeof Monitor> = {
  remote: Wifi,
  onsite: Monitor,
};

const MAC_REGEX = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

export default function WoClient({ workOrders }: { workOrders: WorkOrder[] }) {
  const [macInputs, setMacInputs] = useState<Record<string, string>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSaveMac(woId: string) {
    const mac = (macInputs[woId] ?? "").trim();
    if (!MAC_REGEX.test(mac)) {
      setErrorMsg(`Invalid MAC address format. Use XX:XX:XX:XX:XX:XX`);
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await updateVendorMac(woId, mac);
        setSavedIds((prev) => new Set(prev).add(woId));
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Failed to save MAC.");
      }
    });
  }

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="glass-panel-gold p-4 rounded-2xl border border-[#d4af37]/30 flex items-center gap-3">
        <Wrench className="text-[#d4af37] shrink-0" size={24} />
        <div>
          <h2 className="text-xl font-cinzel text-[#d4af37] font-bold">Maintenance WO</h2>
          <p className="text-xs text-gray-400">{workOrders.length} active work order{workOrders.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
          <AlertTriangle size={14} className="shrink-0" /> {errorMsg}
        </div>
      )}

      {workOrders.length === 0 ? (
        <div className="p-12 text-center text-gray-600 text-sm bg-black/20 rounded-2xl border border-white/5">
          No active work orders assigned
        </div>
      ) : (
        workOrders.map((wo) => {
          const TopoIcon = TOPOLOGY_ICON[wo.topology] ?? Monitor;
          const isSaved = savedIds.has(wo.id);

          return (
            <div key={wo.id} className="bg-black/30 border border-white/8 rounded-2xl overflow-hidden">
              {/* WO header */}
              <div className="px-4 py-4 border-b border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <TopoIcon size={14} className="text-gray-400 shrink-0" />
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{wo.topology}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_STYLES[wo.status] ?? "text-gray-400 bg-white/5 border-white/10"}`}>
                        {wo.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-white font-medium">{wo.suppliers?.name ?? "Unknown Vendor"}</p>
                    {wo.scope && <p className="text-xs text-gray-400 mt-1">{wo.scope}</p>}
                  </div>
                </div>

                {/* Window */}
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <Clock size={12} className="shrink-0" />
                  <span>
                    {new Date(wo.maintenance_start).toLocaleString("en-MY", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {new Date(wo.maintenance_end).toLocaleString("en-MY", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* MAD limit */}
                <div className="mt-2 inline-flex items-center gap-2 text-xs font-mono bg-amber-500/5 border border-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg">
                  MAD Limit: {wo.mad_limit_minutes} min
                </div>
              </div>

              {/* MAC input */}
              <div className="px-4 py-4 space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Vendor MAC Address</label>

                {wo.vendor_mac_address && !isSaved ? (
                  <p className="text-sm font-mono text-white bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                    {wo.vendor_mac_address as string}
                  </p>
                ) : null}

                <div className="flex gap-2">
                  <input
                    value={macInputs[wo.id] ?? (wo.vendor_mac_address as string | null) ?? ""}
                    onChange={(e) => setMacInputs((prev) => ({ ...prev, [wo.id]: e.target.value }))}
                    placeholder="AA:BB:CC:DD:EE:FF"
                    className="flex-1 px-3 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm font-mono placeholder-gray-600 focus:border-[#d4af37] focus:outline-none transition min-h-[44px]"
                    disabled={isSaved}
                  />
                  <button
                    onClick={() => handleSaveMac(wo.id)}
                    disabled={isPending || isSaved}
                    className="px-4 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] font-bold text-sm hover:bg-[#d4af37]/20 active:scale-95 transition disabled:opacity-40 min-h-[44px] flex items-center gap-2"
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : isSaved ? <CheckCircle2 size={14} /> : "Save"}
                  </button>
                </div>

                {isSaved && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> MAC address saved. Authorize via network team.
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

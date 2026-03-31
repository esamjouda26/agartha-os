"use client";

import { useState, useRef, useTransition } from "react";
import { Package, CheckCircle2, Loader2, Camera, ChevronDown, ChevronRight, Clock, ArrowRight, Truck } from "lucide-react";
import { acceptRestockTask, completeRestockTask } from "../actions";

type RestockTask = {
  id: string;
  status: string;
  priority: string;
  needed_qty: number;
  created_at: string;
  product_id: string;
  products: { name: string; unit_of_measure: string | null } | null;
  location_id: string;
  locations: { name: string } | null;
};

const PRIORITY_STYLES: Record<string, string> = {
  normal:   "text-gray-400 bg-white/5 border-white/10",
  high:     "text-amber-400 bg-amber-400/10 border-amber-400/30",
  critical: "text-red-400 bg-red-400/10 border-red-400/30",
};

const STATUS_STYLES: Record<string, string> = {
  pending:     "text-amber-400 bg-amber-400/10 border-amber-400/30",
  in_progress: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  completed:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
};

export default function RestockQueueClient({ tasks }: { tasks: RestockTask[] }) {
  const [activeDelivery, setActiveDelivery] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const photoRef = useRef<HTMLInputElement>(null);

  function handleAccept(taskId: string) {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await acceptRestockTask(taskId);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Accept failed.");
      }
    });
  }

  function handleComplete(taskId: string) {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await completeRestockTask(taskId, null, null);
        setSuccessIds((prev) => new Set(prev).add(taskId));
        setActiveDelivery(null);
        setPhotoFile(null);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Complete failed.");
      }
    });
  }

  const pending = tasks.filter((t) => t.status === "pending");
  const inProgress = tasks.filter((t) => t.status === "in_progress");

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="glass-panel-gold p-4 rounded-2xl border border-[#d4af37]/30 flex items-center gap-3">
        <Truck className="text-[#d4af37] shrink-0" size={24} />
        <div>
          <h2 className="text-xl font-cinzel text-[#d4af37] font-bold">Restock Queue</h2>
          <p className="text-xs text-gray-400">{pending.length} pending · {inProgress.length} in progress</p>
        </div>
      </div>

      {errorMsg && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{errorMsg}</div>}

      {/* In-progress tasks */}
      {inProgress.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold px-1">In Progress</p>
          {inProgress.map((task) => (
            <div key={task.id} className="bg-blue-900/10 border border-blue-500/20 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium truncate">{task.products?.name ?? task.product_id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {task.needed_qty} {task.products?.unit_of_measure ?? "units"} → <span className="text-gray-300">{task.locations?.name ?? "Unknown"}</span>
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${PRIORITY_STYLES[task.priority]}`}>
                  {task.priority}
                </span>
              </div>

              {activeDelivery === task.id ? (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                  <button
                    onClick={() => photoRef.current?.click()}
                    className={`w-full flex items-center gap-3 py-3 rounded-xl border-2 border-dashed transition min-h-[44px] ${
                      photoFile ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-400" : "border-white/10 hover:border-[#d4af37]/40 text-gray-500"
                    }`}
                  >
                    <Camera size={16} className="ml-3" />
                    <span className="text-sm">{photoFile ? photoFile.name : "Capture delivery photo (optional)"}</span>
                  </button>
                  <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
                  <button
                    onClick={() => handleComplete(task.id)}
                    disabled={isPending}
                    className="w-full py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500/20 active:scale-95 transition disabled:opacity-50 min-h-[44px]"
                  >
                    {isPending ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : <><CheckCircle2 size={14} /> Mark Delivered</>}
                  </button>
                  <button onClick={() => setActiveDelivery(null)} className="w-full text-xs text-gray-500 hover:text-white py-1">Cancel</button>
                </div>
              ) : (
                <div className="px-4 pb-3">
                  <button
                    onClick={() => setActiveDelivery(task.id)}
                    disabled={successIds.has(task.id)}
                    className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500/20 active:scale-95 transition min-h-[44px] disabled:opacity-50"
                  >
                    {successIds.has(task.id) ? <><CheckCircle2 size={14} /> Delivered</> : <><ArrowRight size={14} /> Complete Delivery</>}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pending tasks */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold px-1">Pending Queue</p>
          {pending.map((task) => (
            <div key={task.id} className="bg-black/30 border border-white/8 rounded-2xl">
              <div className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium truncate">{task.products?.name ?? task.product_id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {task.needed_qty} {task.products?.unit_of_measure ?? "units"} → <span className="text-gray-300">{task.locations?.name ?? "Unknown"}</span>
                    <span className="ml-2 text-gray-600">· {new Date(task.created_at).toLocaleDateString("en-MY", { day: "2-digit", month: "short" })}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${PRIORITY_STYLES[task.priority]}`}>
                    {task.priority}
                  </span>
                  <button
                    onClick={() => handleAccept(task.id)}
                    disabled={isPending}
                    className="px-3 py-2 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] font-bold text-xs hover:bg-[#d4af37]/20 active:scale-95 transition min-h-[44px]"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <div className="p-12 text-center text-gray-600 text-sm bg-black/20 rounded-2xl border border-white/5">
          No pending restock tasks
        </div>
      )}

      <input type="file" className="hidden" />
    </div>
  );
}

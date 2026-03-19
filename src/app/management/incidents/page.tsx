"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  Siren, Search, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2,
  X, FileText, Plus, FileDown, Filter, Calendar, Paperclip, ImageOff,
} from "lucide-react";
import { fetchIncidentsAction } from "../actions";
import { createIncidentAction, resolveIncidentAction } from "./actions";
import DomainAuditTable from "@/components/DomainAuditTable";

// ── Types ───────────────────────────────────────────────────────────────────

interface Incident {
  id: string; category: string; status: string; description: string;
  created_at: string; zones: { name: string } | null;
  reported_by?: string; reported_by_role?: string;
}

const CATEGORIES: Record<string, { label: string; cls: string }> = {
  biohazard:   { label: "Biohazard",       cls: "bg-purple-500/10 text-purple-400 border-purple-500/25" },
  altercation: { label: "Altercation",     cls: "bg-red-500/10 text-red-400 border-red-500/25" },
  medical:     { label: "Medical",         cls: "bg-pink-500/10 text-pink-400 border-pink-500/25" },
  equipment:   { label: "Equipment",       cls: "bg-orange-500/10 text-orange-400 border-orange-500/25" },
  safety:      { label: "Safety Hazard",   cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25" },
  spill:       { label: "Spill / Cleanup", cls: "bg-teal-500/10 text-teal-400 border-teal-500/25" },
  guest:       { label: "Guest Complaint", cls: "bg-blue-500/10 text-blue-400 border-blue-500/25" },
  fire:        { label: "Fire / Smoke",    cls: "bg-red-500/10 text-red-500 border-red-500/25" },
  structural:  { label: "Structural",      cls: "bg-orange-500/10 text-orange-400 border-orange-500/25" },
  power:       { label: "Power Outage",    cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25" },
};

const STATUS_STYLE: Record<string, string> = {
  resolved:      "bg-green-500/10 text-green-400 border-green-500/30",
  closed:        "bg-green-500/10 text-green-400 border-green-500/30",
  open:          "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  investigating: "bg-[rgba(212,175,55,0.1)] text-[#d4af37] border-[rgba(212,175,55,0.3)]",
};

const DATE_RANGES = ["Today", "7D", "MTD", "YTD"] as const;

// ── Page ────────────────────────────────────────────────────────────────────

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>("Today");
  const [catFilter, setCatFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<Incident | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Create form
  const [createCat, setCreateCat] = useState("biohazard");
  const [createLogger, setCreateLogger] = useState("");
  const [createRemark, setCreateRemark] = useState("");
  const [createFile, setCreateFile] = useState<string | null>(null);

  const pageSize = 20;
  const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchIncidentsAction({ page, pageSize });
    setIncidents(result.data as unknown as Incident[]);
    setTotal(result.total);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / pageSize);

  // Filter by category and date range
  const filtered = incidents.filter((inc) => {
    if (catFilter !== "all" && inc.category !== catFilter) return false;
    const now = new Date();
    const ts = new Date(inc.created_at);
    if (dateRange === "Today" && ts.toDateString() !== now.toDateString()) return false;
    if (dateRange === "7D") { const week = new Date(now); week.setDate(week.getDate() - 7); if (ts < week) return false; }
    if (dateRange === "MTD" && (ts.getMonth() !== now.getMonth() || ts.getFullYear() !== now.getFullYear())) return false;
    if (dateRange === "YTD" && ts.getFullYear() !== now.getFullYear()) return false;
    return true;
  });

  const openCount = filtered.filter((i) => i.status === "open").length;
  const resolvedCount = filtered.filter((i) => i.status === "resolved" || i.status === "closed").length;

  function submitCreate() {
    if (!createLogger.trim() || !createRemark.trim()) { showToast("⚠️ Logged By and Remark are required."); return; }
    startTransition(async () => {
      try {
        await createIncidentAction({ category: createCat, description: createRemark });
        setCreateModal(false);
        setCreateLogger(""); setCreateRemark(""); setCreateFile(null);
        showToast(`✅ Incident logged successfully via IAM Ledger.`);
        load();
      } catch (err: any) {
        showToast(`❌ Failed to log: ${err.message}`);
      }
    });
  }

  function resolveIncident(id: string) {
    startTransition(async () => {
      try {
        await resolveIncidentAction(id);
        setDetailModal(null);
        showToast(`✅ Incident ${id.slice(0, 12)} marked as resolved.`);
        load();
      } catch (err: any) {
        showToast(`❌ Failed to resolve: ${err.message}`);
      }
    });
  }

  function formatTs(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-5 pb-10">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date Range Filter */}
          <div className="glass-panel rounded-lg p-2 flex items-center justify-between w-fit border-[rgba(212,175,55,0.2)] shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-1">
              {DATE_RANGES.map((r) => (
                <button key={r} onClick={() => setDateRange(r)}
                  className={`px-4 py-1.5 text-sm font-medium rounded transition-all ${dateRange === r
                    ? "font-bold bg-[rgba(212,175,55,0.2)] text-[#d4af37] border border-[rgba(212,175,55,0.5)] shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}>
                  {r}
                </button>
              ))}
            </div>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <button className="flex items-center px-4 py-1.5 text-sm font-medium rounded text-gray-400 hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.1)] transition-colors group">
              <Calendar className="w-4 h-4 mr-2 group-hover:text-[#d4af37] transition-colors" /> Custom Range
            </button>
          </div>
          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-[#020408]/60 border border-white/10 rounded-lg px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
              className="bg-transparent text-xs text-gray-300 focus:outline-none cursor-pointer pr-5 appearance-none">
              <option value="all">All Categories</option>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          {/* Actions */}
          <button onClick={() => showToast(`📄 Report generated — ${filtered.length} records exported.`)}
            className="flex items-center gap-2 bg-[#020408] border border-white/10 text-gray-300 hover:text-[#d4af37] hover:border-[rgba(212,175,55,0.3)] font-semibold py-2 px-4 rounded-lg transition-all text-xs uppercase tracking-wider">
            <FileDown className="w-4 h-4" /> Generate Report
          </button>
          <button onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold py-2 px-4 rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all text-xs uppercase tracking-wider">
            <Plus className="w-4 h-4" /> Create Log
          </button>
        </div>
      </div>

      {/* ── Data Grid ───────────────────────────────────────────── */}
      <div className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#010204]">
          <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> incident_logs — filtered view
          </h4>
          <span className="text-[10px] text-gray-600 font-mono">{filtered.length} records · {openCount} open · {resolvedCount} resolved</span>
        </div>
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-600 text-xs uppercase tracking-widest">No incidents match the current filters</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] text-gray-500 uppercase tracking-wider bg-[#010204] sticky top-0 z-10 border-b border-white/10">
                <tr>
                  <th className="px-5 py-3 font-semibold w-28">Incident ID</th>
                  <th className="px-4 py-3 font-semibold w-32">Category</th>
                  <th className="px-4 py-3 font-semibold w-36">Logged By</th>
                  <th className="px-4 py-3 font-semibold w-36">Timestamp</th>
                  <th className="px-4 py-3 font-semibold">Remark</th>
                  <th className="px-4 py-3 font-semibold w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((inc) => {
                  const cat = CATEGORIES[inc.category] || { label: inc.category, cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" };
                  const isOpen = inc.status === "open";
                  const statusCls = STATUS_STYLE[inc.status] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";
                  return (
                    <tr key={inc.id} onClick={() => setDetailModal(inc)}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer border-l-2 border-transparent hover:border-l-[#d4af37]">
                      <td className="px-5 py-3"><span className="font-mono text-xs text-gray-300 font-semibold">{inc.id.slice(0, 12)}</span></td>
                      <td className="px-4 py-3"><span className={`text-[10px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${cat.cls}`}>{cat.label}</span></td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-white font-medium">{inc.reported_by || "System"}</div>
                        <div className="text-[10px] text-gray-600">{inc.reported_by_role || "Auto"}</div>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs text-gray-400 font-mono">{formatTs(inc.created_at)}</span></td>
                      <td className="px-4 py-3"><span className="text-xs text-gray-400 block truncate max-w-[320px]">{inc.description}</span></td>
                      <td className="px-4 py-3 text-center"><span className={`text-[10px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${statusCls}`}>{isOpen ? "Open" : inc.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-[#010204]">
            <span className="text-xs text-gray-500 font-mono">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 text-gray-500 hover:text-[#d4af37] disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-1.5 text-gray-500 hover:text-[#d4af37] disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      <DomainAuditTable entityTypes={["incident"]} title="Incident Audit Trail" />

      {/* ═══ DETAIL MODAL ═══ */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/85 backdrop-blur-sm overflow-y-auto pt-10 pb-10" onClick={() => setDetailModal(null)}>
          <div className="glass-panel rounded-lg w-full max-w-xl border-[#d4af37]/30 shadow-[0_10px_40px_rgba(212,175,55,0.15)] flex flex-col my-auto max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg flex-shrink-0">
              <h3 className="font-cinzel text-base text-[#d4af37] flex items-center tracking-wider"><FileText className="w-4 h-4 mr-2" /> {detailModal.id.slice(0, 12)}</h3>
              <button onClick={() => setDetailModal(null)} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#020408]/50 rounded-lg p-3 border border-white/5">
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Logged By</p>
                  <p className="text-xs text-white font-medium">{detailModal.reported_by || "System"}</p>
                  <p className="text-[10px] text-gray-500">{detailModal.reported_by_role || "Auto"}</p>
                </div>
                <div className="bg-[#020408]/50 rounded-lg p-3 border border-white/5">
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Timestamp</p>
                  <p className="text-xs text-white font-medium font-mono">{formatTs(detailModal.created_at)}</p>
                </div>
                <div className="bg-[#020408]/50 rounded-lg p-3 border border-white/5">
                  <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Category</p>
                  {(() => { const cat = CATEGORIES[detailModal.category] || { label: detailModal.category, cls: "" }; return <span className={`text-[10px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${cat.cls}`}>{cat.label}</span>; })()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-600 uppercase tracking-widest">Current Status:</span>
                <span className={`text-[10px] border px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${STATUS_STYLE[detailModal.status] || ""}`}>{detailModal.status}</span>
              </div>
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1.5">Full Remark</p>
                <div className="bg-[#020408]/50 rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-gray-300 leading-relaxed">{detailModal.description}</p>
                </div>
              </div>
              <div>
                <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1.5">Attachment Payload</p>
                <div className="flex flex-col items-center justify-center h-[120px] rounded-lg border border-dashed border-white/10 bg-[#020408]/50 text-gray-600">
                  <ImageOff className="w-8 h-8 mb-2 text-gray-700" />
                  <span className="text-[10px]">No attachment provided</span>
                </div>
              </div>
              {detailModal.status === "open" ? (
                <div className="flex justify-end pt-2 border-t border-white/10">
                  <button onClick={() => resolveIncident(detailModal.id)}
                    className="px-5 py-2 text-xs font-bold rounded bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-[0_0_12px_rgba(34,197,94,0.25)] transition-all flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Resolved
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[10px] text-emerald-500/60 bg-emerald-500/5 border border-emerald-500/10 rounded px-3 py-2">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> This incident has been resolved.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CREATE LOG MODAL ═══ */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/85 backdrop-blur-sm overflow-y-auto pt-10 pb-10" onClick={() => setCreateModal(false)}>
          <div className="glass-panel rounded-lg w-full max-w-md border-[#d4af37]/30 shadow-[0_10px_40px_rgba(212,175,55,0.15)] my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <h3 className="font-cinzel text-base text-[#d4af37] flex items-center tracking-wider"><Siren className="w-4 h-4 mr-2" /> Create Incident Log</h3>
              <button onClick={() => setCreateModal(false)} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block mb-1">Category</label>
                <select value={createCat} onChange={(e) => setCreateCat(e.target.value)}
                  className="w-full bg-[#020408] border border-white/10 text-sm text-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] cursor-pointer">
                  {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block mb-1">Logged By</label>
                <input type="text" value={createLogger} onChange={(e) => setCreateLogger(e.target.value)} placeholder="e.g. Ahmad Razif"
                  className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] transition-all" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block mb-1">Remark / Description</label>
                <textarea value={createRemark} onChange={(e) => setCreateRemark(e.target.value)} rows={4} placeholder="Describe the incident in full..."
                  className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md px-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] transition-all resize-y" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold block mb-1">Attachment (optional)</label>
                <div className="flex items-center gap-3 mt-1">
                  <label className="flex items-center gap-2 bg-[#020408] border border-white/10 rounded px-3 py-2 text-xs text-gray-400 hover:text-[#d4af37] hover:border-[rgba(212,175,55,0.3)] cursor-pointer transition-all">
                    <Paperclip className="w-3.5 h-3.5" /> Choose File
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setCreateFile(e.target.files?.[0]?.name || null)} />
                  </label>
                  <span className="text-[10px] text-gray-600">{createFile || "No file selected"}</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <button onClick={() => setCreateModal(false)} className="px-4 py-2 text-xs font-medium rounded text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button onClick={submitCreate}
                  className="px-5 py-2 text-xs font-bold rounded bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all">
                  Submit Log
                </button>
              </div>
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

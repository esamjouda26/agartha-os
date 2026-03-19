"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  ClipboardCheck, Search, Calendar, Activity, AlertTriangle, TrendingDown,
  CalendarPlus, X, RefreshCw, Eye, CheckCircle2, EyeOff,
} from "lucide-react";
import { fetchStockLocationsAction, fetchRunnersAction, fetchAuditsAction, fetchAuditItemsAction, reconcileAuditAction } from "../actions";
import DomainAuditTable from "@/components/DomainAuditTable";

// ── Types ───────────────────────────────────────────────────────────────────

interface StockLocation { id: string; name: string; is_sink: boolean }
interface Runner { id: string; employee_id: string; legal_name: string }

interface AuditCycle {
  id: string; date: string; location: string; scope: string; runner: string;
  expectedQty: number | null; countedQty: number | null; varianceRm: number | null;
  status: "Scheduled" | "Active" | "Needs Reconciliation" | "Closed";
  hasVariance: boolean;
}

interface ReconItem {
  id: string; name: string; expected: number; counted: number; costPerUnit: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, { cls: string; icon: typeof Calendar; label: string }> = {
    "Needs Reconciliation": { cls: "text-yellow-400 bg-yellow-400/10 border-yellow-500/20", icon: AlertTriangle, label: "Needs Recon" },
    "Active": { cls: "text-blue-400 bg-blue-400/10 border-blue-500/20", icon: Activity, label: "Counting" },
    "Scheduled": { cls: "text-gray-400 bg-gray-500/10 border-gray-500/20", icon: Calendar, label: "Scheduled" },
    "Closed": { cls: "text-green-400 bg-green-400/10 border-green-500/20", icon: CheckCircle2, label: "Closed" },
  };
  const s = map[status] ?? map["Scheduled"];
  const Icon = s.icon;
  return (
    <span className={`px-2 py-1 rounded border text-[10px] uppercase font-bold font-sans tracking-widest flex items-center w-fit ${s.cls}`}>
      <Icon className="w-3 h-3 mr-1" /> {s.label}
    </span>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function InventoryAuditsPage() {
  const [audits, setAudits] = useState<AuditCycle[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [runners, setRunners] = useState<Runner[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [varianceOnly, setVarianceOnly] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Modal state
  const [scheduleModal, setScheduleModal] = useState(false);
  const [reconModal, setReconModal] = useState<number | null>(null);
  const [reconItems, setReconItems] = useState<ReconItem[]>([]);

  // Schedule form
  const [schedLoc, setSchedLoc] = useState("");
  const [schedScope, setSchedScope] = useState("Full Location Count");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [schedRunner, setSchedRunner] = useState("Auto-Assign");
  const [isPending, startTransition] = useTransition();

  const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); }, []);

  useEffect(() => {
    (async () => {
      const [locs, runnerList, fetchedAudits] = await Promise.all([
        fetchStockLocationsAction(), 
        fetchRunnersAction(),
        fetchAuditsAction()
      ]);
      const typedLocs = locs as StockLocation[];
      setLocations(typedLocs);
      setRunners(runnerList as Runner[]);
      setAudits(fetchedAudits as AuditCycle[]);
      if (typedLocs.length > 0 && !schedLoc) setSchedLoc(typedLocs[0].name);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filters ─────────────────────────────────────────────────────────────

  const filtered = audits.filter((a) => {
    if (search && !a.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (locationFilter !== "all" && a.location !== locationFilter) return false;
    if (varianceOnly && !a.hasVariance) return false;
    return true;
  });

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const kpiScheduled = audits.filter((a) => a.status === "Scheduled").length;
  const kpiActive = audits.filter((a) => a.status === "Active").length;
  const kpiRecon = audits.filter((a) => a.status === "Needs Reconciliation").length;
  const kpiVariance = audits.reduce((sum, a) => sum + (a.varianceRm ?? 0), 0);

  const trackable = locations.filter((l) => !l.is_sink);
  const locationNames = [...new Set(audits.map((a) => a.location))];

  // ── Schedule Modal ──────────────────────────────────────────────────────

  function saveSchedule() {
    if (!schedDate) return;
    const newId = "AUD-" + Math.floor(3045 + Math.random() * 100);
    setAudits((prev) => [{
      id: newId, date: `${schedDate}, Scheduled`, location: schedLoc, scope: schedScope,
      runner: schedRunner, expectedQty: null, countedQty: null, varianceRm: null,
      status: "Scheduled", hasVariance: false,
    }, ...prev]);
    setScheduleModal(false);
    showToast(`Task ${newId} dispatched for blind count at ${schedLoc}.`);
  }

  // ── Reconciliation ────────────────────────────────────────────────────────

  async function openReconModal(globalIdx: number) {
    const auditId = audits[globalIdx].id;
    setReconModal(globalIdx);
    const items = await fetchAuditItemsAction(auditId);
    setReconItems(items as ReconItem[]);
  }

  function requestRecount() {
    if (reconModal === null) return;
    setAudits((prev) => prev.map((a, i) => i === reconModal ? { ...a, status: "Active" as const, date: "Recount Ordered" } : a));
    const auditId = audits[reconModal].id;
    setReconModal(null);
    showToast(`Recount requested for ${auditId}. Runner notified.`);
  }

  function approveWriteOff() {
    if (reconModal === null) return;
    const audit = audits[reconModal];
    
    startTransition(async () => {
      const res = await reconcileAuditAction(audit.id);
      if (res?.error) {
        showToast(`Error: ${res.error}`);
      } else {
        setAudits((prev) => prev.map((a, i) => i === reconModal ? { ...a, status: "Closed" as const } : a));
        setReconModal(null);
        showToast(`Variances written off. Item ledgers adjusted by ${audit.varianceRm?.toFixed(2)} RM.`);
      }
    });
  }

  const reconAudit = reconModal !== null ? audits[reconModal] : null;
  const reconTotalImpact = reconItems.reduce((sum: number, item: ReconItem) => sum + (item.counted - item.expected) * item.costPerUnit, 0);

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider">
            <ClipboardCheck className="w-5 h-5 mr-2" /> Audit & Reconciliation
          </h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Cycle Counts, Discrepancy Investigation & Write-offs</p>
        </div>
        <button onClick={() => { setScheduleModal(true); setSchedDate(new Date().toISOString().split("T")[0]); }}
          className="bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold px-5 py-2.5 rounded shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all flex items-center text-sm uppercase tracking-widest">
          <CalendarPlus className="w-4 h-4 mr-2" /> Schedule Count
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Scheduled", value: kpiScheduled, icon: Calendar, color: "gray", val: "text-white", border: "border-gray-500/50" },
          { label: "Active (Counting)", value: kpiActive, icon: Activity, color: "blue", val: "text-blue-400", border: "border-blue-500/50" },
          { label: "Needs Recon", value: kpiRecon, icon: AlertTriangle, color: "yellow", val: "text-yellow-400", border: "border-yellow-500/50" },
          { label: "Variance Impact (MTD)", value: `- RM ${Math.abs(kpiVariance).toFixed(2)}`, icon: TrendingDown, color: "red", val: "text-red-400", border: "border-red-500/50" },
        ].map((k) => {
          const Icon = k.icon;
          const bg = `bg-${k.color}-500/10 border-${k.color}-500/20`;
          const ic = `text-${k.color}-400`;
          return (
            <div key={k.label} className={`glass-panel rounded-lg p-4 border-l-2 ${k.border}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded border flex items-center justify-center ${bg}`}><Icon className={`w-4 h-4 ${ic}`} /></div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{k.label}</p>
                  <p className={`text-xl font-orbitron font-bold ${k.val}`}>{k.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search Audit ID..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] transition-all" />
          </div>
          <div className="flex items-center gap-3">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[rgba(212,175,55,0.5)] cursor-pointer appearance-none">
              <option value="all">Status: All</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Active">Active (Counting)</option>
              <option value="Needs Reconciliation">Needs Reconciliation</option>
              <option value="Closed">Closed</option>
            </select>
            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-[#020408] border border-white/10 text-xs text-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:border-[rgba(212,175,55,0.5)] cursor-pointer appearance-none">
              <option value="all">Location: All</option>
              {locationNames.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <label className="inline-flex items-center cursor-pointer pl-2">
              <div className="relative">
                <input type="checkbox" checked={varianceOnly} onChange={(e) => setVarianceOnly(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-white/10 peer-checked:bg-red-500/20 rounded-full border border-white/10 peer-checked:border-red-500/40 transition-all" />
                <div className="absolute left-0.5 top-0.5 w-3.5 h-3.5 bg-gray-400 peer-checked:bg-red-500 rounded-full peer-checked:translate-x-4 transition-all" />
              </div>
              <span className="ml-2 text-xs text-gray-300 uppercase tracking-widest font-semibold">With Variances</span>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
              <tr>
                {["Audit Cycle ID", "Scheduled Date / Time", "Location", "Scope", "Assigned Runner", "Expected vs Counted", "Variance Impact", "Status", "Actions"].map((h) => (
                  <th key={h} className={`px-5 py-4 font-semibold ${h === "Expected vs Counted" || h === "Variance Impact" ? "text-center" : ""} ${h === "Variance Impact" ? "text-right" : ""} ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {filtered.map((a, idx) => {
                const globalIdx = audits.indexOf(a);
                return (
                  <tr key={a.id} className={`hover:bg-white/[0.02] transition-colors ${a.status === "Needs Reconciliation" ? "bg-yellow-500/[0.03]" : ""}`}>
                    <td className="px-5 py-4 text-[#d4af37] font-bold">{a.id}</td>
                    <td className="px-5 py-4 text-gray-400 font-sans">{a.date}</td>
                    <td className="px-5 py-4 text-gray-300 font-sans font-semibold">{a.location}</td>
                    <td className="px-5 py-4 text-gray-400 font-sans">{a.scope}</td>
                    <td className="px-5 py-4 text-gray-500">{a.runner}</td>
                    <td className="px-5 py-4 text-center">
                      {a.status === "Scheduled" || a.status === "Active" ? (
                        <span className="text-gray-600 italic">Pending Data</span>
                      ) : (
                        <span className={`font-bold ${a.expectedQty === a.countedQty ? "text-green-400" : "text-yellow-400"}`}>
                          {a.expectedQty} <span className="text-gray-500 font-normal">vs</span> {a.countedQty}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {a.varianceRm !== null ? (
                        <span className={`font-bold ${a.varianceRm < 0 ? "text-red-400" : a.varianceRm > 0 ? "text-green-400" : "text-gray-500"}`}>
                          {a.varianceRm < 0 ? "- " : ""}RM {Math.abs(a.varianceRm).toFixed(2)}
                        </span>
                      ) : <span className="text-gray-600 italic">—</span>}
                    </td>
                    <td className="px-5 py-4">{statusBadge(a.status)}</td>
                    <td className="px-5 py-4 text-right">
                      {a.status === "Needs Reconciliation" ? (
                        <button onClick={() => openReconModal(globalIdx)}
                          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500 hover:text-[#020408] transition-all shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                          Reconcile
                        </button>
                      ) : (
                        <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── System Audit Trail ──────────────────────────────────── */}
      <DomainAuditTable entityTypes={["product", "purchase_order", "inventory_transfer"]} title="Full Inventory Audit Log" />

      {/* ═══ SCHEDULE COUNT MODAL ═══ */}
      {scheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm overflow-y-auto pt-10 pb-10" onClick={() => setScheduleModal(false)}>
          <div className="glass-panel rounded-lg w-full max-w-lg border-[#d4af37]/30 shadow-[0_10px_40px_rgba(212,175,55,0.15)] flex flex-col my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider"><CalendarPlus className="w-5 h-5 mr-2" /> Schedule Count Cycle</h3>
              <button onClick={() => setScheduleModal(false)} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Target Location</label>
                  <select value={schedLoc} onChange={(e) => setSchedLoc(e.target.value)}
                    className="w-full bg-[#020408] border border-white/10 text-sm text-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] cursor-pointer">
                    {trackable.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Count Scope</label>
                  <select value={schedScope} onChange={(e) => setSchedScope(e.target.value)}
                    className="w-full bg-[#020408] border border-white/10 text-sm text-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] cursor-pointer">
                    <option>Full Location Count</option>
                    <option>Raw Ingredients Only</option>
                    <option>Prepackaged Only</option>
                    <option>Consumables Only</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Date</label>
                  <input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full bg-[#020408] border border-white/10 text-sm font-sans text-white rounded-md px-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Time</label>
                  <input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)}
                    className="w-full bg-[#020408] border border-white/10 text-sm font-sans text-white rounded-md px-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Assign Runner Crew</label>
                <select value={schedRunner} onChange={(e) => setSchedRunner(e.target.value)}
                  className="w-full bg-[#020408] border border-white/10 text-sm text-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] cursor-pointer">
                  <option value="Auto-Assign">Auto-Assign (Next Available)</option>
                  {runners.map((r) => <option key={r.id} value={r.legal_name}>{r.legal_name} ({r.employee_id})</option>)}
                </select>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded flex items-start gap-3">
                <EyeOff className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-300"><strong>Blind Count Enforced:</strong> The assigned Runner Crew will receive the list of items to count, but the system&apos;s expected quantities will be hidden from them.</p>
              </div>
            </div>
            <div className="p-5 border-t border-white/10 bg-[#020408]/80 rounded-b-lg flex justify-end gap-3">
              <button onClick={() => setScheduleModal(false)} className="px-4 py-2 text-sm font-medium rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={saveSchedule}
                className="px-6 py-2 text-sm font-bold rounded bg-[rgba(212,175,55,0.2)] text-[#d4af37] border border-[rgba(212,175,55,0.5)] hover:bg-[#d4af37] hover:text-[#020408] transition-all shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                Generate Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ RECONCILIATION MODAL ═══ */}
      {reconAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm overflow-y-auto pt-10 pb-10" onClick={() => setReconModal(null)}>
          <div className="glass-panel rounded-lg w-full max-w-5xl border-[#d4af37]/30 shadow-[0_10px_40px_rgba(212,175,55,0.15)] flex flex-col my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <div>
                <h3 className="font-cinzel text-lg text-[#d4af37] flex items-center tracking-wider"><Search className="w-5 h-5 mr-2" /> Reconciliation Dashboard</h3>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-mono">Audit ID: {reconAudit.id} | Location: {reconAudit.location} | Runner: {reconAudit.runner}</p>
              </div>
              <button onClick={() => setReconModal(null)} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <p className="text-sm text-yellow-300"><strong>Variances Detected.</strong> Review the discrepancies below. You must assign a reason code to write off missing stock.</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Total Impact</p>
                  <p className="font-orbitron text-red-400 font-bold">- RM {Math.abs(reconTotalImpact).toFixed(2)}</p>
                </div>
              </div>
              <div className="border border-white/5 rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold text-center border-l border-white/5">System Expected</th>
                      <th className="px-4 py-3 font-semibold text-center">Runner Counted</th>
                      <th className="px-4 py-3 font-semibold text-center text-yellow-400 border-r border-white/5">Unit Variance</th>
                      <th className="px-4 py-3 font-semibold text-right">Impact (RM)</th>
                      <th className="px-4 py-3 font-semibold">Write-Off Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-xs">
                    {reconItems.map((item: ReconItem) => {
                      const variance = item.counted - item.expected;
                      const impact = variance * item.costPerUnit;
                      return (
                        <tr key={item.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <p className="text-gray-200 font-bold font-sans">{item.name}</p>
                            <p className="text-[10px] text-gray-500">{item.id}</p>
                          </td>
                          <td className="px-4 py-3 text-center border-l border-white/5 text-gray-400">{item.expected}</td>
                          <td className="px-4 py-3 text-center text-white font-bold">{item.counted}</td>
                          <td className="px-4 py-3 text-center border-r border-white/5 text-yellow-400 font-bold">{variance}</td>
                          <td className="px-4 py-3 text-right text-red-400 font-bold">- RM {Math.abs(impact).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <select className="w-full bg-[#020408] border border-white/10 text-xs text-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-red-500 cursor-pointer">
                              <option value="">Select Reason...</option>
                              <option value="Shrinkage" selected>Shrinkage / Unexplained Loss</option>
                              <option value="Spoilage">Spoilage</option>
                              <option value="Damaged">Damaged in Location</option>
                              <option value="Prep Waste">Unlogged Prep Waste (FnB)</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-5 border-t border-white/10 bg-[#020408]/80 rounded-b-lg flex justify-between items-center">
              <button onClick={requestRecount}
                className="px-4 py-2 text-sm font-bold rounded bg-[#020408] border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 transition-colors flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Order Recount
              </button>
              <div className="flex gap-3">
                <button onClick={() => setReconModal(null)} disabled={isPending} className="px-4 py-2 text-sm font-medium rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50">Cancel</button>
                <button onClick={approveWriteOff} disabled={isPending}
                  className="px-6 py-2 text-sm font-bold rounded bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)] disabled:opacity-50">
                  {isPending ? "Approving..." : "Approve Write-Off & Close"}
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

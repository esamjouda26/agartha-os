"use client";

import { useState, useMemo } from "react";
import {
  Shield, CheckCircle2, AlertTriangle, Clock, Users, CalendarOff,
  ChevronDown, Eye, ThumbsUp, ThumbsDown, X, FileCheck, MessageSquare,
  Filter,
} from "lucide-react";

// ── Types & Data ────────────────────────────────────────────────────────────

const ROLES: Record<string, string> = {
  fnb_crew: "F&B Crew", service_crew: "Service Crew", giftshop_crew: "Giftshop Crew",
  runner_crew: "Runner Crew", security_crew: "Security Crew", health_crew: "Health Crew",
  cleaning_crew: "Cleaning Crew", experience_crew: "Experience Crew",
  internal_maintainence_crew: "Internal Maintenance Crew",
  fnb_manager: "F&B Manager", operations_manager: "Operations Manager",
};

interface ComplianceRow {
  empId: string; name: string; role: string;
  scheduledHrs: number; actualHrs: number; justifiedHrs: number; unjustifiedHrs: number;
  lateArrivals: number; earlyDepartures: number; absences: number; overtimeHrs: number;
  complianceRate: number; status: "compliant" | "flagged" | "critical";
}

interface LeaveRequest {
  id: string; empName: string; role: string;
  type: "annual" | "medical" | "emergency" | "unpaid";
  startDate: string; endDate: string; reason: string;
  status: "pending" | "approved" | "rejected";
}

interface Discrepancy {
  id: string; empName: string; role: string;
  date: string; type: "late_arrival" | "early_departure" | "missing_checkout" | "unauthorized_absence";
  detail: string;
  status: "unresolved" | "justified" | "overridden";
  justification?: string;
}

const COMPLIANCE_DATA: ComplianceRow[] = [
  { empId: "EMP-8F2A", name: "Ahmad Razif", role: "fnb_crew", scheduledHrs: 160, actualHrs: 158, justifiedHrs: 2, unjustifiedHrs: 0, lateArrivals: 1, earlyDepartures: 0, absences: 0, overtimeHrs: 4, complianceRate: 100, status: "compliant" },
  { empId: "EMP-1D4E", name: "Chen Wei Lin", role: "security_crew", scheduledHrs: 176, actualHrs: 170, justifiedHrs: 4, unjustifiedHrs: 2, lateArrivals: 3, earlyDepartures: 1, absences: 0, overtimeHrs: 8, complianceRate: 96.6, status: "flagged" },
  { empId: "EMP-9A2B", name: "Nur Aisyah", role: "giftshop_crew", scheduledHrs: 160, actualHrs: 160, justifiedHrs: 0, unjustifiedHrs: 0, lateArrivals: 0, earlyDepartures: 0, absences: 0, overtimeHrs: 2, complianceRate: 100, status: "compliant" },
  { empId: "EMP-5E6F", name: "Rajesh Krishnan", role: "health_crew", scheduledHrs: 160, actualHrs: 152, justifiedHrs: 0, unjustifiedHrs: 8, lateArrivals: 5, earlyDepartures: 3, absences: 1, overtimeHrs: 0, complianceRate: 95, status: "flagged" },
  { empId: "EMP-7G8H", name: "Muhammad Irfan", role: "internal_maintainence_crew", scheduledHrs: 160, actualHrs: 160, justifiedHrs: 0, unjustifiedHrs: 0, lateArrivals: 0, earlyDepartures: 0, absences: 0, overtimeHrs: 6, complianceRate: 100, status: "compliant" },
  { empId: "EMP-3K4L", name: "Tan Siew Ling", role: "fnb_manager", scheduledHrs: 176, actualHrs: 176, justifiedHrs: 0, unjustifiedHrs: 0, lateArrivals: 0, earlyDepartures: 0, absences: 0, overtimeHrs: 12, complianceRate: 100, status: "compliant" },
  { empId: "EMP-8O9P", name: "Amirul Hakim", role: "security_crew", scheduledHrs: 176, actualHrs: 168, justifiedHrs: 8, unjustifiedHrs: 0, lateArrivals: 0, earlyDepartures: 0, absences: 1, overtimeHrs: 0, complianceRate: 100, status: "compliant" },
  { empId: "EMP-0A1B", name: "Fatimah Abdullah", role: "cleaning_crew", scheduledHrs: 160, actualHrs: 140, justifiedHrs: 8, unjustifiedHrs: 12, lateArrivals: 7, earlyDepartures: 4, absences: 2, overtimeHrs: 0, complianceRate: 87.5, status: "critical" },
  { empId: "EMP-4E5F", name: "Vikram Singh", role: "operations_manager", scheduledHrs: 176, actualHrs: 174, justifiedHrs: 2, unjustifiedHrs: 0, lateArrivals: 1, earlyDepartures: 0, absences: 0, overtimeHrs: 20, complianceRate: 100, status: "compliant" },
  { empId: "EMP-6W7X", name: "Lee Jia Hao", role: "fnb_crew", scheduledHrs: 160, actualHrs: 148, justifiedHrs: 0, unjustifiedHrs: 12, lateArrivals: 4, earlyDepartures: 2, absences: 1, overtimeHrs: 0, complianceRate: 92.5, status: "flagged" },
  { empId: "EMP-F1G2", name: "Zainab Kamil", role: "fnb_crew", scheduledHrs: 160, actualHrs: 156, justifiedHrs: 4, unjustifiedHrs: 0, lateArrivals: 2, earlyDepartures: 0, absences: 0, overtimeHrs: 3, complianceRate: 100, status: "compliant" },
  { empId: "EMP-J5K6", name: "Daniel Lim", role: "service_crew", scheduledHrs: 160, actualHrs: 160, justifiedHrs: 0, unjustifiedHrs: 0, lateArrivals: 0, earlyDepartures: 0, absences: 0, overtimeHrs: 5, complianceRate: 100, status: "compliant" },
];

const LEAVE_REQUESTS: LeaveRequest[] = [
  { id: "LR-001", empName: "Rajesh Krishnan", role: "health_crew", type: "medical", startDate: "2026-03-20", endDate: "2026-03-22", reason: "Scheduled medical procedure", status: "pending" },
  { id: "LR-002", empName: "Fatimah Abdullah", role: "cleaning_crew", type: "annual", startDate: "2026-03-25", endDate: "2026-03-28", reason: "Family event", status: "pending" },
  { id: "LR-003", empName: "Chen Wei Lin", role: "security_crew", type: "emergency", startDate: "2026-03-18", endDate: "2026-03-18", reason: "Family emergency — child hospitalization", status: "pending" },
  { id: "LR-004", empName: "Ahmad Razif", role: "fnb_crew", type: "annual", startDate: "2026-04-01", endDate: "2026-04-03", reason: "Personal travel", status: "approved" },
  { id: "LR-005", empName: "Lee Jia Hao", role: "fnb_crew", type: "unpaid", startDate: "2026-03-19", endDate: "2026-03-19", reason: "Personal errand", status: "rejected" },
];

const DISCREPANCIES: Discrepancy[] = [
  { id: "DS-001", empName: "Fatimah Abdullah", role: "cleaning_crew", date: "2026-03-15", type: "late_arrival", detail: "Arrived 47 mins late (07:47 vs 07:00)", status: "unresolved" },
  { id: "DS-002", empName: "Rajesh Krishnan", role: "health_crew", date: "2026-03-14", type: "early_departure", detail: "Left 2h early (13:00 vs 15:00)", status: "unresolved" },
  { id: "DS-003", empName: "Chen Wei Lin", role: "security_crew", date: "2026-03-13", type: "missing_checkout", detail: "No checkout recorded for night shift", status: "unresolved" },
  { id: "DS-004", empName: "Lee Jia Hao", role: "fnb_crew", date: "2026-03-12", type: "unauthorized_absence", detail: "No-show, no prior leave request filed", status: "unresolved" },
  { id: "DS-005", empName: "Fatimah Abdullah", role: "cleaning_crew", date: "2026-03-10", type: "late_arrival", detail: "Arrived 22 mins late (07:22 vs 07:00)", status: "justified", justification: "Traffic accident on route — verified by GPS logs." },
];

const DISCREP_TYPE_LABELS: Record<string, string> = { late_arrival: "Late Arrival", early_departure: "Early Departure", missing_checkout: "Missing Checkout", unauthorized_absence: "Unauthorized Absence" };
const DISCREP_TYPE_COLOR: Record<string, string> = { late_arrival: "text-amber-400 bg-amber-500/10", early_departure: "text-blue-400 bg-blue-500/10", missing_checkout: "text-purple-400 bg-purple-500/10", unauthorized_absence: "text-red-400 bg-red-500/10" };

const LEAVE_TYPE_LABELS: Record<string, string> = { annual: "Annual", medical: "Medical", emergency: "Emergency", unpaid: "Unpaid" };
const LEAVE_TYPE_COLOR: Record<string, string> = { annual: "text-green-400 bg-green-500/10", medical: "text-sky-400 bg-sky-500/10", emergency: "text-red-400 bg-red-500/10", unpaid: "text-gray-400 bg-gray-500/10" };

// ── Page ────────────────────────────────────────────────────────────────────

export default function AttendanceCompliancePage() {
  const [complianceData, setComplianceData] = useState(COMPLIANCE_DATA);
  const [leaveReqs, setLeaveReqs] = useState(LEAVE_REQUESTS);
  const [discrepancies, setDiscrepancies] = useState(DISCREPANCIES);

  const [ledgerFilter, setLedgerFilter] = useState<"all" | "compliant" | "flagged" | "critical">("all");
  const [collapsedRoles, setCollapsedRoles] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // Modals
  const [rejectModal, setRejectModal] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [justifyModal, setJustifyModal] = useState<Discrepancy | null>(null);
  const [justifyText, setJustifyText] = useState("");
  const [detailModal, setDetailModal] = useState<ComplianceRow | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  // ─ Summary Stats ─
  const stats = useMemo(() => {
    const total = complianceData.length;
    const compliant = complianceData.filter((r) => r.status === "compliant").length;
    const flagged = complianceData.filter((r) => r.status === "flagged").length;
    const pendingLeave = leaveReqs.filter((r) => r.status === "pending").length;
    const avgRate = complianceData.reduce((a, r) => a + r.complianceRate, 0) / total;
    const totalLate = complianceData.reduce((a, r) => a + r.lateArrivals, 0);
    return { total, compliant, flagged, pendingLeave, avgRate, totalLate };
  }, [complianceData, leaveReqs]);

  // ─ Grouped & filtered ledger ─
  const filteredLedger = useMemo(() => {
    const rows = ledgerFilter === "all" ? complianceData : complianceData.filter((r) => r.status === ledgerFilter);
    const grouped: Record<string, ComplianceRow[]> = {};
    rows.forEach((r) => { if (!grouped[r.role]) grouped[r.role] = []; grouped[r.role].push(r); });
    return grouped;
  }, [complianceData, ledgerFilter]);

  function toggleRole(role: string) {
    setCollapsedRoles((prev) => { const n = new Set(prev); n.has(role) ? n.delete(role) : n.add(role); return n; });
  }

  // ─ Leave Actions ─
  function approveLeave(id: string) {
    setLeaveReqs((prev) => prev.map((r) => r.id === id ? { ...r, status: "approved" as const } : r));
    showToast("✅ Leave request approved.");
  }

  function openReject(lr: LeaveRequest) { setRejectModal(lr); setRejectReason(""); }
  function confirmReject() {
    if (!rejectModal || !rejectReason.trim()) { showToast("Rejection reason is required."); return; }
    setLeaveReqs((prev) => prev.map((r) => r.id === rejectModal!.id ? { ...r, status: "rejected" as const } : r));
    showToast(`⚠ Leave request rejected for ${rejectModal.empName}.`);
    setRejectModal(null);
  }

  // ─ Discrepancy Actions ─
  function openJustify(d: Discrepancy) { setJustifyModal(d); setJustifyText(""); }
  function confirmJustify() {
    if (!justifyModal || !justifyText.trim()) { showToast("Justification text is required."); return; }
    setDiscrepancies((prev) => prev.map((d) => d.id === justifyModal!.id ? { ...d, status: "justified" as const, justification: justifyText } : d));
    showToast(`✅ Discrepancy justified for ${justifyModal.empName}.`);
    setJustifyModal(null);
  }

  function overrideDiscrepancy(id: string) {
    setDiscrepancies((prev) => prev.map((d) => d.id === id ? { ...d, status: "overridden" as const } : d));
    showToast("Override applied.");
  }

  // ─ Status badge helpers ─
  function statusBadge(status: "compliant" | "flagged" | "critical") {
    if (status === "compliant") return "bg-green-500/12 text-green-400 border-green-500/30";
    if (status === "flagged") return "bg-amber-400/12 text-amber-400 border-amber-400/30";
    return "bg-red-500/12 text-red-400 border-red-500/30";
  }

  return (
    <div className="space-y-5 pb-10">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-cinzel text-xl text-[#d4af37] flex items-center tracking-wider"><Shield className="w-6 h-6 mr-3" /> Attendance & Compliance</h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Monthly Compliance Ledger · Exception Resolution</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-[#020408] border border-white/10 text-sm text-gray-400 rounded-md px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] cursor-pointer appearance-none">
            <option>March 2026</option>
            <option>February 2026</option>
            <option>January 2026</option>
          </select>
        </div>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Active Staff", val: stats.total, icon: <Users className="w-5 h-5" />, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
          { label: "Fully Compliant", val: stats.compliant, icon: <CheckCircle2 className="w-5 h-5" />, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
          { label: "Flagged Employees", val: stats.flagged, icon: <AlertTriangle className="w-5 h-5" />, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Pending Leave", val: stats.pendingLeave, icon: <CalendarOff className="w-5 h-5" />, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10 border-fuchsia-500/20" },
        ].map((c) => (
          <div key={c.label} className={`glass-panel rounded-lg p-4 border ${c.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`${c.color} opacity-60`}>{c.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.val}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Aggregate Row ────────────────────────────────────────── */}
      <div className="glass-panel rounded-lg p-4 flex items-center gap-8 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">Avg Compliance</span>
          <span className={`text-lg font-bold tabular-nums ${stats.avgRate >= 98 ? "text-green-400" : stats.avgRate >= 95 ? "text-amber-400" : "text-red-400"}`}>{stats.avgRate.toFixed(1)}%</span>
        </div>
        <div className="h-4 border-l border-white/10" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">Total Late Arrivals</span>
          <span className="text-lg font-bold tabular-nums text-amber-400">{stats.totalLate}</span>
        </div>
        <div className="h-4 border-l border-white/10" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">Open Discrepancies</span>
          <span className="text-lg font-bold tabular-nums text-red-400">{discrepancies.filter((d) => d.status === "unresolved").length}</span>
        </div>
      </div>

      {/* ═══ MASTER COMPLIANCE LEDGER ═══ */}
      <div className="glass-panel rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#010204]">
          <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Master Compliance Ledger
          </h4>
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-gray-500 mr-1" />
            {(["all", "compliant", "flagged", "critical"] as const).map((f) => (
              <button key={f} onClick={() => setLedgerFilter(f)}
                className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded transition-all ${ledgerFilter === f ? "text-[#d4af37] bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.3)]" : "text-gray-500 hover:text-[#d4af37]"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-gray-500 uppercase tracking-wider bg-[#010204] sticky top-0 z-10 border-b border-white/10">
              <tr>
                {["Employee", "Sched", "Actual", "Justified", "Unjust.", "Late", "Early", "Absent", "OT", "Rate", "Status", ""].map((h) => (
                  <th key={h} className={`px-3 py-3 font-semibold ${h === "" ? "w-10" : ""} ${["Sched", "Actual", "Justified", "Unjust.", "Late", "Early", "Absent", "OT", "Rate"].includes(h) ? "text-center" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(filteredLedger).map(([role, rows]) => {
                const isCollapsed = collapsedRoles.has(role);
                return [
                  <tr key={`rg-${role}`} className="cursor-pointer hover:bg-[rgba(212,175,55,0.04)]" onClick={() => toggleRole(role)}>
                    <td colSpan={12} className="bg-[rgba(2,4,8,0.95)] border-b border-[rgba(212,175,55,0.15)] px-4 py-2">
                      <div className="flex items-center gap-2">
                        <ChevronDown className={`w-3.5 h-3.5 text-[#d4af37]/60 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                        <span className="text-xs font-bold text-[#d4af37]/80 uppercase tracking-wider">{ROLES[role] || role}</span>
                        <span className="text-[10px] text-gray-500 font-mono ml-1">{rows.length} staff</span>
                      </div>
                    </td>
                  </tr>,
                  ...(!isCollapsed ? rows.map((r) => (
                    <tr key={r.empId} className="border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors">
                      <td className="px-3 py-2">
                        <div className="text-xs text-white font-medium">{r.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{r.empId}</div>
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-gray-400 tabular-nums">{r.scheduledHrs}h</td>
                      <td className="px-3 py-2 text-center text-xs text-white tabular-nums font-semibold">{r.actualHrs}h</td>
                      <td className="px-3 py-2 text-center text-xs text-green-400 tabular-nums">{r.justifiedHrs}h</td>
                      <td className="px-3 py-2 text-center text-xs text-red-400 tabular-nums">{r.unjustifiedHrs > 0 ? r.unjustifiedHrs + "h" : "—"}</td>
                      <td className="px-3 py-2 text-center text-xs tabular-nums"><span className={r.lateArrivals > 3 ? "text-red-400 font-bold" : r.lateArrivals > 0 ? "text-amber-400" : "text-gray-500"}>{r.lateArrivals}</span></td>
                      <td className="px-3 py-2 text-center text-xs tabular-nums"><span className={r.earlyDepartures > 0 ? "text-amber-400" : "text-gray-500"}>{r.earlyDepartures}</span></td>
                      <td className="px-3 py-2 text-center text-xs tabular-nums"><span className={r.absences > 0 ? "text-red-400 font-bold" : "text-gray-500"}>{r.absences}</span></td>
                      <td className="px-3 py-2 text-center text-xs tabular-nums"><span className={r.overtimeHrs > 0 ? "text-sky-400" : "text-gray-500"}>{r.overtimeHrs > 0 ? "+" + r.overtimeHrs + "h" : "—"}</span></td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs font-bold tabular-nums ${r.complianceRate >= 98 ? "text-green-400" : r.complianceRate >= 95 ? "text-amber-400" : "text-red-400"}`}>{r.complianceRate}%</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadge(r.status)}`}>{r.status}</span>
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={() => setDetailModal(r)} className="text-gray-500 hover:text-[#d4af37] transition-colors p-1"><Eye className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  )) : []),
                ];
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ EXCEPTION RESOLUTION COMMAND CENTER ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Pending Leave Requests ── */}
        <div className="glass-panel rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 bg-[#010204]">
            <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
              <CalendarOff className="w-3.5 h-3.5 text-fuchsia-400/60" /> Pending Leave Requests
              <span className="ml-auto text-[10px] font-mono text-fuchsia-400">{leaveReqs.filter((l) => l.status === "pending").length} pending</span>
            </h4>
          </div>
          <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
            {leaveReqs.length === 0 ? <p className="text-center text-gray-600 text-xs py-8 italic">No leave requests.</p> : leaveReqs.map((lr) => (
              <div key={lr.id} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-white font-medium">{lr.empName}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${LEAVE_TYPE_COLOR[lr.type]}`}>{LEAVE_TYPE_LABELS[lr.type]}</span>
                      {lr.status !== "pending" && <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${lr.status === "approved" ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}`}>{lr.status}</span>}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">{lr.startDate} → {lr.endDate}</div>
                    <div className="text-xs text-gray-400 mt-1">{lr.reason}</div>
                  </div>
                  {lr.status === "pending" && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => approveLeave(lr.id)} className="p-1.5 rounded text-green-400 hover:bg-green-500/15 transition-colors" title="Approve"><ThumbsUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => openReject(lr)} className="p-1.5 rounded text-red-400 hover:bg-red-500/15 transition-colors" title="Reject"><ThumbsDown className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Discrepancy Queue ── */}
        <div className="glass-panel rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 bg-[#010204]">
            <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400/60" /> Discrepancy Resolution Queue
              <span className="ml-auto text-[10px] font-mono text-amber-400">{discrepancies.filter((d) => d.status === "unresolved").length} open</span>
            </h4>
          </div>
          <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
            {discrepancies.length === 0 ? <p className="text-center text-gray-600 text-xs py-8 italic">No discrepancies.</p> : discrepancies.map((d) => (
              <div key={d.id} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-white font-medium">{d.empName}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${DISCREP_TYPE_COLOR[d.type]}`}>{DISCREP_TYPE_LABELS[d.type]}</span>
                      {d.status !== "unresolved" && <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${d.status === "justified" ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-blue-400 bg-blue-500/10 border-blue-500/20"}`}>{d.status}</span>}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">{d.date}</div>
                    <div className="text-xs text-gray-400 mt-1">{d.detail}</div>
                    {d.justification && <div className="text-xs text-green-400/80 mt-1 italic">Justification: {d.justification}</div>}
                  </div>
                  {d.status === "unresolved" && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openJustify(d)} className="p-1.5 rounded text-green-400 hover:bg-green-500/15 transition-colors" title="Justify"><FileCheck className="w-3.5 h-3.5" /></button>
                      <button onClick={() => overrideDiscrepancy(d.id)} className="p-1.5 rounded text-blue-400 hover:bg-blue-500/15 transition-colors" title="Override"><MessageSquare className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ DETAIL MODAL ═══ */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm p-4" onClick={() => setDetailModal(null)}>
          <div className="glass-panel rounded-lg w-full max-w-md border-[rgba(212,175,55,0.3)] shadow-[0_10px_40px_rgba(212,175,55,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <h3 className="font-cinzel text-lg text-[#d4af37] tracking-wider">{detailModal.name}</h3>
              <button onClick={() => setDetailModal(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between"><span className="text-xs text-gray-400">Role</span><span className="text-xs text-white">{ROLES[detailModal.role]}</span></div>
              <div className="flex justify-between"><span className="text-xs text-gray-400">Compliance Rate</span><span className={`text-xs font-bold ${detailModal.complianceRate >= 98 ? "text-green-400" : detailModal.complianceRate >= 95 ? "text-amber-400" : "text-red-400"}`}>{detailModal.complianceRate}%</span></div>
              <div className="border-t border-white/5 pt-2 mt-2" />
              {[
                ["Scheduled Hours", `${detailModal.scheduledHrs}h`], ["Actual Hours", `${detailModal.actualHrs}h`],
                ["Justified Hours", `${detailModal.justifiedHrs}h`], ["Unjustified Hours", `${detailModal.unjustifiedHrs}h`],
                ["Late Arrivals", `${detailModal.lateArrivals}`], ["Early Departures", `${detailModal.earlyDepartures}`],
                ["Absences", `${detailModal.absences}`], ["Overtime", `${detailModal.overtimeHrs}h`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between"><span className="text-[10px] text-gray-500 uppercase tracking-widest">{l}</span><span className="text-xs text-white font-mono tabular-nums">{v}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ REJECT LEAVE MODAL ═══ */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm p-4" onClick={() => setRejectModal(null)}>
          <div className="glass-panel rounded-lg w-full max-w-md border-red-500/30 shadow-[0_10px_40px_rgba(239,68,68,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-red-500/20 flex justify-between items-center bg-red-950/30 rounded-t-lg">
              <h3 className="font-cinzel text-lg text-red-400 tracking-wider">Reject Leave Request</h3>
              <button onClick={() => setRejectModal(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-400">Rejecting leave for <strong className="text-white">{rejectModal.empName}</strong> ({LEAVE_TYPE_LABELS[rejectModal.type]} — {rejectModal.startDate} → {rejectModal.endDate})</div>
              <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Rejection Reason</label><textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Provide reason for rejection..." className="w-full bg-[#020408] border border-red-500/20 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-red-500/50 resize-none" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setRejectModal(null)} className="px-5 py-2.5 text-sm text-gray-400 hover:text-white">Cancel</button>
                <button onClick={confirmReject} className={`px-6 py-2.5 text-sm font-bold rounded transition-all ${rejectReason.trim() ? "bg-red-600 text-white hover:bg-red-500" : "bg-red-600/40 text-red-300 cursor-not-allowed"}`}>Reject Leave</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ JUSTIFY DISCREPANCY MODAL ═══ */}
      {justifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm p-4" onClick={() => setJustifyModal(null)}>
          <div className="glass-panel rounded-lg w-full max-w-md border-[rgba(212,175,55,0.3)] shadow-[0_10px_40px_rgba(212,175,55,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <h3 className="font-cinzel text-lg text-[#d4af37] tracking-wider flex items-center gap-2"><FileCheck className="w-5 h-5" /> Justify Discrepancy</h3>
              <button onClick={() => setJustifyModal(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-400">
                <strong className="text-white">{justifyModal.empName}</strong> — {DISCREP_TYPE_LABELS[justifyModal.type]} on {justifyModal.date}
                <p className="text-xs text-gray-500 mt-1">{justifyModal.detail}</p>
              </div>
              <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Justification</label><textarea value={justifyText} onChange={(e) => setJustifyText(e.target.value)} rows={3} placeholder="Explain why this discrepancy is excusable..." className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] resize-none" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setJustifyModal(null)} className="px-5 py-2.5 text-sm text-gray-400 hover:text-white">Cancel</button>
                <button onClick={confirmJustify} className="px-6 py-2.5 text-sm font-bold rounded bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all">Submit Justification</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 bg-[#020408] border-l-4 border-l-[#d4af37] border border-white/10 text-white px-6 py-4 rounded-lg shadow-xl backdrop-blur-md text-sm font-semibold flex items-center gap-3 z-[60]">
          <CheckCircle2 className="w-5 h-5 text-[#d4af37]" /><span>{toast}</span>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck, Users, Key, UserX, Shield,
  Bell, X,
  CheckCircle, Crown,
  UserPlus, ArrowRightLeft, ShieldPlus,
  Ban, PlayCircle, AlertTriangle,
} from "lucide-react";
import DomainAuditTable from "@/components/DomainAuditTable";
import {
  DataTable,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableToolbar,
  TableEmptyState,
  TablePagination,
} from "@/components/ui/data-table";
import {
  fetchStaffUsersAction,
  updateEmploymentStatusAction,
  type StaffUser,
} from "../actions";
import {
  fetchIamRequestsAction,
  approveIamRequestAction,
  rejectIamRequestAction,
  type IamRequest,
} from "../admin-analytics-actions";

// ── Helpers ──────────────────────────────────────────────────────────────────

const roleTier = (role: string | null) => {
  if (!role) return "none";
  if (role.includes("admin")) return "admin";
  if (role.includes("manager")) return "management";
  return "crew";
};

const RoleBadge = ({ role }: { role: string | null }) => {
  const tier = roleTier(role);
  const styles: Record<string, string> = {
    admin: "bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.35)] text-[#d4af37]",
    management: "bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] text-blue-300",
    crew: "bg-[rgba(148,163,184,0.08)] border border-[rgba(255,255,255,0.12)] text-[#94a3b8]",
    none: "bg-[rgba(148,163,184,0.08)] border border-[rgba(255,255,255,0.12)] text-[#94a3b8]",
  };
  const Icon = tier === "admin" ? Crown : tier === "management" ? Shield : undefined;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded font-mono text-[11px] font-medium tracking-wide ${styles[tier]}`}>
      {Icon && <Icon className="w-3 h-3 mr-1.5 opacity-60" />}
      {role ?? "unassigned"}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { cls: string; label: string }> = {
    active:     { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Active" },
    pending:    { cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",   label: "Pending" },
    on_leave:   { cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",          label: "On Leave" },
    suspended:  { cls: "bg-red-500/10 text-red-400 border-red-500/20",             label: "Suspended" },
    terminated: { cls: "bg-orange-500/10 text-orange-400 border-orange-500/20",   label: "Terminated" },
  };
  const s = map[status] ?? { cls: "bg-white/5 text-gray-400 border-white/10", label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold border ${s.cls}`}>
      {s.label}
    </span>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AccessControlPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionWorking, setActionWorking] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const [iamRequests, setIamRequests] = useState<IamRequest[]>([]);
  const [iamLoading, setIamLoading] = useState(true);
  const [iamWorking, setIamWorking] = useState<string | null>(null);

  // ── Data loading ───────────────────────────────────────────────────────────

  async function load() {
    setLoading(true);
    const data = await fetchStaffUsersAction();
    setUsers(data);
    setLoading(false);
  }

  async function loadIam() {
    setIamLoading(true);
    const data = await fetchIamRequestsAction();
    setIamRequests(data);
    setIamLoading(false);
  }

  useEffect(() => { load(); loadIam(); }, []);

  // ── IAM handlers ──────────────────────────────────────────────────────────

  async function handleApprove(id: string) {
    setIamWorking(id);
    const result = await approveIamRequestAction(id);
    if (result.success) {
      const detail = result.workEmail ? ` — work email: ${result.workEmail}` : "";
      setMessage({ type: "success", text: `Request approved and executed${detail}.` });
      loadIam();
      load();
    } else {
      setMessage({ type: "error", text: result.error ?? "Approval failed" });
    }
    setIamWorking(null);
    setTimeout(() => setMessage(null), 6000);
  }

  async function handleReject(id: string) {
    const remark = window.prompt("Enter rejection reason (required):");
    if (!remark?.trim()) return;
    setIamWorking(id);
    const result = await rejectIamRequestAction(id, remark.trim());
    if (result.success) {
      setMessage({ type: "success", text: "Request rejected." });
      loadIam();
    } else {
      setMessage({ type: "error", text: result.error ?? "Rejection failed" });
    }
    setIamWorking(null);
    setTimeout(() => setMessage(null), 4000);
  }

  // ── Status action handler ──────────────────────────────────────────────────

  async function handleStatusChange(
    userId: string,
    newStatus: "active" | "on_leave" | "suspended" | "terminated"
  ) {
    if (
      newStatus === "terminated" &&
      !window.confirm("Permanently terminate this account? This will ban the user from logging in.")
    ) return;

    setActionWorking(userId);
    const result = await updateEmploymentStatusAction(userId, newStatus);
    if (result.success) {
      const labels: Record<string, string> = {
        active: "Account reactivated.",
        suspended: "Account suspended.",
        terminated: "Account terminated.",
        on_leave: "Account set to On Leave.",
      };
      setMessage({ type: "success", text: labels[newStatus] ?? "Status updated." });
      load();
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed to update status" });
    }
    setActionWorking(null);
    setTimeout(() => setMessage(null), 4000);
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const totalUsers = users.length;
  const mfaUnenrolled = users.filter((u) => !u.is_mfa_enrolled).length;
  const suspended = users.filter((u) => u.employment_status === "suspended" || u.employment_status === "terminated").length;
  const privileged = users.filter((u) => roleTier(u.staff_role) !== "crew" && roleTier(u.staff_role) !== "none").length;

  const filtered = users.filter((u) =>
    !search ||
    (u.employee_id?.toLowerCase().includes(search.toLowerCase())) ||
    (u.display_name?.toLowerCase().includes(search.toLowerCase())) ||
    (u.email?.toLowerCase().includes(search.toLowerCase())) ||
    (u.staff_role?.toLowerCase().includes(search.toLowerCase())) ||
    u.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 relative">

      {/* ── IAM Engine Status Bar ──────────────────────────────────────── */}
      <div className="glass-panel rounded-lg p-3 flex items-center justify-between border-[rgba(212,175,55,0.2)] shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
        <div className="flex items-center space-x-4 px-2 text-sm text-gray-400">
          <span className="flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1.5 text-[#d4af37]" />
            IAM Engine: <span className="text-green-400 ml-1">Active</span>
          </span>
        </div>
        <button
          onClick={() => setAuditOpen(!auditOpen)}
          className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 hover:border-red-500/50 hover:bg-red-500/5 transition-all group"
          title="Security Audit Feed"
        >
          <Bell className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-[#020408] animate-pulse" />
        </button>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"}`}>
          {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* ── Stats Cards ───────────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel rounded-lg p-5">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-semibold flex items-center">
              <Users className="w-3.5 h-3.5 mr-1.5 text-[#d4af37]" /> Total Identities
            </p>
            <div className="flex items-end justify-between">
              <h4 className="font-orbitron text-3xl font-bold text-white">{loading ? "—" : totalUsers}</h4>
              <span className="text-xs text-gray-500">Active Accounts</span>
            </div>
          </div>

          <div className="glass-panel rounded-lg p-5 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
            <p className="text-xs text-yellow-500 uppercase tracking-widest mb-2 font-semibold flex items-center">
              <Key className="w-3.5 h-3.5 mr-1.5" /> MFA Unenrolled
            </p>
            <div className="flex items-end justify-between">
              <h4 className="font-orbitron text-3xl font-bold text-white">{loading ? "—" : mfaUnenrolled}</h4>
              <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">Security Risk</span>
            </div>
          </div>

          <div className="glass-panel rounded-lg p-5 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <p className="text-xs text-red-400 uppercase tracking-widest mb-2 font-semibold flex items-center">
              <UserX className="w-3.5 h-3.5 mr-1.5" /> Suspended / Terminated
            </p>
            <div className="flex items-end justify-between">
              <h4 className="font-orbitron text-3xl font-bold text-white">{loading ? "—" : suspended}</h4>
              <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-500/20">Access Revoked</span>
            </div>
          </div>

          <div className="glass-panel rounded-lg p-5">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-semibold flex items-center">
              <Shield className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> Privileged Access
            </p>
            <div className="flex items-end justify-between">
              <h4 className="font-orbitron text-3xl font-bold text-white">{loading ? "—" : privileged}</h4>
              <span className="text-xs text-gray-400">Admin / Manager Roles</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pending IAM Requests Panel ────────────────────────────────── */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden border-[rgba(212,175,55,0.2)] shadow-[0_0_20px_rgba(212,175,55,0.08)]">
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-[rgba(212,175,55,0.05)] to-transparent flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)]">
                <Bell className="w-4 h-4 text-[#d4af37]" />
              </div>
              <div>
                <h3 className="font-cinzel text-base text-white tracking-wide">Pending IAM Requests</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">HR / IT Action Queue — Approve & Credential</p>
              </div>
            </div>
            {iamLoading ? (
              <div className="w-4 h-4 border border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-xs text-[#d4af37] bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)] px-3 py-1 rounded-full font-semibold">
                {iamRequests.length} Awaiting Review
              </span>
            )}
          </div>
          <div className="p-4 space-y-3">
            {iamLoading ? (
              <div className="flex items-center gap-2 py-4 text-xs text-gray-500">
                <div className="w-4 h-4 border border-gray-600 border-t-[#d4af37] rounded-full animate-spin" />
                Loading pending requests…
              </div>
            ) : iamRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="w-8 h-8 text-green-500/40 mb-2" />
                <p className="text-sm text-gray-400 font-medium">No pending requests</p>
                <p className="text-xs text-gray-600 mt-1">All IAM requests have been processed.</p>
              </div>
            ) : (
              iamRequests.map((req) => {
                const isProvisioning = req.request_type === "provisioning";
                const isTransfer = req.request_type === "transfer";
                const isWorking = iamWorking === req.id;

                const IconEl = isProvisioning ? UserPlus : isTransfer ? ArrowRightLeft : ShieldPlus;
                const iconCls = isProvisioning
                  ? "bg-green-500/10 border-green-500/20 text-green-400"
                  : isTransfer
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
                const cardCls = isProvisioning
                  ? "border-[rgba(212,175,55,0.15)] bg-[rgba(212,175,55,0.03)] hover:border-[rgba(212,175,55,0.3)]"
                  : isTransfer
                  ? "border-blue-500/15 bg-blue-500/[0.03] hover:border-blue-500/30"
                  : "border-yellow-500/15 bg-yellow-500/[0.03] hover:border-yellow-500/30";

                const title = isProvisioning ? "Provision New Staff" : isTransfer ? "Role Transfer" : "Termination Request";
                const elapsed = Math.round((Date.now() - new Date(req.created_at).getTime()) / 60000);
                const elapsedStr = elapsed < 60 ? `${elapsed}m ago` : elapsed < 1440 ? `${Math.round(elapsed / 60)}h ago` : `${Math.round(elapsed / 1440)}d ago`;

                const approveBtnCls = isProvisioning
                  ? "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
                  : isTransfer
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20";

                return (
                  <div key={req.id} className={`rounded-lg border p-4 flex items-center justify-between group transition-all ${cardCls}`}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center border ${iconCls}`}>
                        <IconEl className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white font-bold">{title}</p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {req.legal_name ? (
                            <><span className="text-[#d4af37]">{req.legal_name}</span>
                            {req.current_role && <>{" → "}<span className="font-mono text-gray-300">{req.target_role}</span></>}</>
                          ) : (
                            <>Target role: <span className="font-mono text-gray-300">{req.target_role ?? "—"}</span></>
                          )}
                        </p>
                        <p className="text-[9px] text-gray-600 mt-0.5">
                          {elapsedStr} — status: <span className="text-blue-400">{req.status.replace("_", " ")}</span>
                        </p>
                        {req.hr_remark && (
                          <p className="text-[9px] text-gray-500 mt-0.5 italic">"{req.hr_remark}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={isWorking}
                        className={`px-3 py-1.5 text-xs font-bold rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${approveBtnCls}`}
                      >
                        {isWorking ? "…" : "IT Approve"}
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={isWorking}
                        className="px-3 py-1.5 text-xs rounded text-gray-400 border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ── Master IAM Ledger Table ─────────────────────────────────────── */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/10 bg-[#020408]/40 flex items-center justify-between">
            <div>
              <h3 className="font-cinzel text-base text-white tracking-wide">Staff Identity Ledger</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">All provisioned accounts — status management</p>
            </div>
            <span className="text-xs text-gray-500 font-mono">{filtered.length} records</span>
          </div>

          <TableToolbar
            search={search}
            setSearch={(v: string) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search by name, email, role, or ID…"
          />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <DataTable minWidth="900px">
              <TableHeader>
                <tr>
                  <TableHead className="w-36">Employee ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Work Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Security / MFA</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableEmptyState colSpan={8} message="No staff accounts match your search." />
                ) : (
                  paginated.map((u) => {
                    const isWorking = actionWorking === u.id;
                    const isRevoked = u.employment_status === "suspended" || u.employment_status === "terminated";

                    return (
                      <TableRow
                        key={u.id}
                        className={isRevoked ? "opacity-60" : ""}
                      >
                        {/* Employee ID */}
                        <TableCell>
                          <span className="font-mono text-xs font-semibold text-[#d4af37]/80 tracking-wider">
                            {u.employee_id ?? u.id.slice(0, 8).toUpperCase()}
                          </span>
                        </TableCell>

                        {/* Full Name */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold border ${roleTier(u.staff_role) === "admin" ? "border-[rgba(212,175,55,0.3)] text-[#d4af37] bg-[rgba(212,175,55,0.08)]" : roleTier(u.staff_role) === "management" ? "border-blue-500/30 text-blue-400 bg-blue-500/5" : "border-white/10 text-gray-400 bg-white/[0.03]"}`}>
                              {(u.display_name ?? "?")[0].toUpperCase()}
                            </div>
                            <span className={`text-sm font-semibold ${isRevoked ? "text-gray-500 line-through decoration-red-500/50" : "text-gray-200"}`}>
                              {u.display_name ?? "—"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Work Email */}
                        <TableCell>
                          <span className="text-xs text-gray-400 font-mono">{u.email ?? "—"}</span>
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          <RoleBadge role={u.staff_role} />
                        </TableCell>

                        {/* Employment Status */}
                        <TableCell>
                          <StatusBadge status={u.employment_status} />
                        </TableCell>

                        {/* MFA */}
                        <TableCell>
                          {u.is_mfa_enrolled ? (
                            <span className="flex items-center text-green-400 text-xs">
                              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Enrolled
                            </span>
                          ) : (
                            <span className="flex items-center text-yellow-500/80 text-xs">
                              <Key className="w-3.5 h-3.5 mr-1.5" /> Not Enrolled
                            </span>
                          )}
                        </TableCell>

                        {/* Last Sign In */}
                        <TableCell>
                          <span className="text-xs text-gray-500 font-mono">
                            {u.last_sign_in_at
                              ? new Date(u.last_sign_in_at).toLocaleString("en-MY", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : <span className="italic text-gray-600">Never</span>}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isWorking ? (
                              <div className="w-4 h-4 border border-[#d4af37] border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                {/* Activate — show if suspended/terminated */}
                                {(u.employment_status === "suspended" || u.employment_status === "terminated") && (
                                  <button
                                    onClick={() => handleStatusChange(u.id, "active")}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15 transition-colors"
                                    title="Reactivate account"
                                  >
                                    <PlayCircle className="w-3.5 h-3.5" /> Activate
                                  </button>
                                )}

                                {/* Suspend — show if active/pending/on_leave */}
                                {(u.employment_status === "active" || u.employment_status === "pending" || u.employment_status === "on_leave") && (
                                  <button
                                    onClick={() => handleStatusChange(u.id, "suspended")}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/15 transition-colors"
                                    title="Suspend account"
                                  >
                                    <Ban className="w-3.5 h-3.5" /> Suspend
                                  </button>
                                )}

                                {/* Terminate — show only if not already terminated */}
                                {u.employment_status !== "terminated" && (
                                  <button
                                    onClick={() => handleStatusChange(u.id, "terminated")}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded border border-orange-500/30 text-orange-400 bg-orange-500/5 hover:bg-orange-500/15 transition-colors"
                                    title="Permanently terminate"
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" /> Terminate
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </DataTable>
          )}

          <TablePagination
            page={page}
            totalPages={totalPages}
            totalRecords={filtered.length}
            pageSize={PAGE_SIZE}
            setPage={setPage}
          />
        </div>
      </section>

      {/* ── Audit Trail ───────────────────────────────────────────────── */}
      <DomainAuditTable entityTypes={["profile", "role", "device"]} title="Admin Audit Trail" />

      {/* ── Sliding Audit Feed Panel ───────────────────────────────────── */}
      <div
        className={`fixed top-0 right-0 h-full w-96 z-[60] flex flex-col transform transition-transform duration-300 ${auditOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ maxWidth: "90vw" }}
      >
        <div className="h-full border-l border-white/10 flex flex-col" style={{ background: "rgba(5, 10, 18, 0.97)", backdropFilter: "blur(20px)" }}>
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20">
                <Bell className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h3 className="font-cinzel text-sm text-white tracking-wide">Security Audit Feed</h3>
                <p className="text-[9px] text-gray-600 uppercase tracking-widest">Live System Actions</p>
              </div>
            </div>
            <button onClick={() => setAuditOpen(false)} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {message && (
              <div className={`rounded-lg border p-3.5 relative overflow-hidden ${message.type === "success" ? "border-emerald-500/30 bg-emerald-500/[0.06]" : "border-red-500/30 bg-red-500/[0.06]"}`}>
                <div className={`absolute top-0 left-0 w-1 h-full ${message.type === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
                <p className="text-xs text-gray-300 leading-relaxed ml-2">{message.text}</p>
                <div className="flex items-center justify-between mt-2 ml-2">
                  <span className="text-[9px] text-gray-600 font-mono">{new Date().toLocaleString()}</span>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-600 text-center mt-8">Audit events appear here as actions are performed.</p>
          </div>
        </div>
      </div>
      {auditOpen && <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setAuditOpen(false)} />}
    </div>
  );
}

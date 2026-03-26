"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck, Users, Key, UserX, Shield,
  Search, Bell, X,
  CheckCircle, ClipboardList, MoreHorizontal, Crown,
  UserPlus, ArrowRightLeft, ShieldPlus,
} from "lucide-react";
import DomainAuditTable from "@/components/DomainAuditTable";
import {
  fetchStaffUsersAction,
  updateUserRoleAction,
  toggleUserLockAction,
} from "../actions";
import {
  fetchIamRequestsAction,
  approveIamRequestAction,
  rejectIamRequestAction,
  type IamRequest,
} from "../admin-analytics-actions";

const ALL_STAFF_ROLES = [
  "it_admin", "business_admin",
  "fnb_manager", "merch_manager", "maintenance_manager", "inventory_manager",
  "marketing_manager", "human_resources_manager", "compliance_manager", "operations_manager",
  "fnb_crew", "service_crew", "giftshop_crew", "runner_crew", "security_crew",
  "health_crew", "cleaning_crew", "experience_crew", "internal_maintainence_crew",
] as const;

interface StaffUser {
  id: string;
  display_name: string | null;
  staff_role: string | null;
  is_mfa_enabled: boolean;
  is_locked: boolean;
  last_sign_in_at: string | null;
  created_at: string;
}

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
    <span className={`inline-flex items-center px-3 py-1 rounded font-mono text-[11px] font-medium tracking-wide ${styles[tier]}`}>
      {Icon && <Icon className="w-3 h-3 mr-1.5 opacity-60" />}
      {role ?? "unassigned"}
    </span>
  );
};

export default function AccessControlPage() {
  // ── Staff / IAM state ────────────────────────────────────────────────
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  // IAM Requests (Pending HR / IT queue)
  const [iamRequests, setIamRequests] = useState<IamRequest[]>([]);
  const [iamLoading, setIamLoading] = useState(true);
  const [iamWorking, setIamWorking] = useState<string | null>(null);

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

  async function handleApprove(id: string) {
    setIamWorking(id);
    const result = await approveIamRequestAction(id);
    if (result.success) {
      setMessage({ type: "success", text: `Request approved${result.newStatus === "pending_it" ? " (awaiting IT sign-off)" : " and executed"}.` });
      loadIam();
    } else {
      setMessage({ type: "error", text: result.error ?? "Approval failed" });
    }
    setIamWorking(null);
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleReject(id: string) {
    setIamWorking(id);
    const result = await rejectIamRequestAction(id);
    if (result.success) {
      setMessage({ type: "success", text: "Request rejected." });
      loadIam();
    } else {
      setMessage({ type: "error", text: result.error ?? "Rejection failed" });
    }
    setIamWorking(null);
    setTimeout(() => setMessage(null), 4000);
  }

  // ── Preserved handlers (zero changes) ───────────────────────────────
  async function handleRoleChange(userId: string) {
    const result = await updateUserRoleAction(userId, selectedRole);
    if (result.success) {
      setMessage({ type: "success", text: "Role updated and audit logged." });
      setEditingId(null);
      load();
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed" });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleToggleLock(userId: string, lock: boolean) {
    const result = await toggleUserLockAction(userId, lock);
    if (result.success) {
      setMessage({ type: "success", text: lock ? "Account locked." : "Account unlocked." });
      load();
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed" });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  // ── Derived stats from users[] ───────────────────────────────────────
  const totalUsers = users.length;
  const mfaUnenrolled = users.filter((u) => !u.is_mfa_enabled).length;
  const suspended = users.filter((u) => u.is_locked).length;
  const privileged = users.filter((u) => roleTier(u.staff_role) !== "crew" && roleTier(u.staff_role) !== "none").length;

  const filtered = users.filter((u) =>
    !search ||
    (u.display_name?.toLowerCase().includes(search.toLowerCase())) ||
    (u.staff_role?.toLowerCase().includes(search.toLowerCase())) ||
    u.id.toLowerCase().includes(search.toLowerCase())
  );

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
              <UserX className="w-3.5 h-3.5 mr-1.5" /> Suspended Accounts
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

      {/* ── Pending IAM Requests Panel (live from iam_requests) ──────── */}
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
                const isPendingHr = req.status === "pending_hr";

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

                const title = isProvisioning ? "Provision New Staff" : isTransfer ? "Role Transfer" : "RBAC Escalation";
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
                            <><span className="text-[#d4af37]">{req.legal_name}</span>{" "}{req.employee_id ? `(${req.employee_id})` : ""}
                            {req.current_role && <>{" → "}<span className="font-mono text-gray-300">{req.target_role}</span></>}</>
                          ) : (
                            <>Target role: <span className="font-mono text-gray-300">{req.target_role ?? "—"}</span></>
                          )}
                        </p>
                        <p className="text-[9px] text-gray-600 mt-0.5">
                          {elapsedStr} — status: <span className={isPendingHr ? "text-yellow-400" : "text-blue-400"}>{req.status.replace("_", " ")}</span>
                          {isPendingHr && <span className="ml-1 text-yellow-500">— awaiting HR first</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={isWorking}
                        className={`px-3 py-1.5 text-xs font-bold rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${approveBtnCls}`}
                      >
                        {isWorking ? "…" : isPendingHr ? "HR Approve" : "IT Approve"}
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

      {/* ── Master IAM Ledger Table ────────────────────────────────────── */}
      <section>
        <div className="glass-panel rounded-lg overflow-hidden flex flex-col min-h-[500px]">
          {/* Filter bar */}
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#020408]/40">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by Name or Role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#020408] border border-white/10 text-sm text-white rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] focus:ring-1 focus:ring-[rgba(212,175,55,0.3)] transition-all placeholder-gray-600"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-gray-500 py-16">No staff accounts found.</p>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-xs text-gray-500 uppercase tracking-wider bg-[#010204] border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-32">
                      IT Lockout
                    </th>
                    <th className="px-6 py-4 font-semibold">User Identity</th>
                    <th className="px-6 py-4 font-semibold">Assigned Role</th>
                    <th className="px-6 py-4 font-semibold">Security / MFA</th>
                    <th className="px-6 py-4 font-semibold">Last Active</th>
                    <th className="px-6 py-4 font-semibold text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((u) => {
                    const tier = roleTier(u.staff_role);
                    const isEditing = editingId === u.id;
                    const initial = (u.display_name ?? "?")[0].toUpperCase();
                    const avatarColor = tier === "admin" ? "border-[rgba(212,175,55,0.3)] text-[#d4af37]" :
                      tier === "management" ? "border-blue-500/30 text-blue-400" :
                        "border-white/10 text-gray-400";
                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-white/[0.02] transition-colors group ${u.is_locked ? "bg-red-500/[0.05] opacity-75" : ""}`}
                      >
                        {/* Lockout toggle — bound to handleToggleLock */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start">
                            <button
                              onClick={() => handleToggleLock(u.id, !u.is_locked)}
                              className={`relative inline-block w-10 h-5 rounded-full transition-colors duration-200 border ${u.is_locked ? "bg-red-500 border-red-400" : "bg-green-500 border-green-400"}`}
                              title="IT/Cybersecurity Emergency Lockout"
                              aria-label={u.is_locked ? "Unlock account" : "Lock account"}
                            >
                              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${u.is_locked ? "translate-x-0 left-0.5" : "translate-x-5 left-0"}`} />
                            </button>
                            <span className={`text-[8px] mt-1 uppercase tracking-widest font-semibold ${u.is_locked ? "text-red-400" : "text-gray-600"}`}>
                              {u.is_locked ? "Locked Out" : "Active"}
                            </span>
                          </div>
                        </td>

                        {/* User Identity */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded bg-[#020408] border ${avatarColor} flex items-center justify-center font-bold text-sm`}>
                              {initial}
                            </div>
                            <div>
                              <p className={`font-bold mb-0.5 ${u.is_locked ? "text-gray-400 line-through decoration-red-500" : "text-gray-200"}`}>
                                {u.display_name ?? "—"}
                              </p>
                              <p className="text-[10px] text-gray-500 font-mono tracking-wide">{u.id.slice(0, 14)}…</p>
                            </div>
                          </div>
                        </td>

                        {/* Role — editable, bound to updateUserRoleAction */}
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="h-8 rounded border border-white/10 bg-[#020408] px-2 text-xs text-white focus:border-[rgba(212,175,55,0.5)] focus:outline-none"
                              style={{ colorScheme: "dark" }}
                            >
                              <option value="">Select role…</option>
                              {ALL_STAFF_ROLES.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          ) : (
                            <RoleBadge role={u.staff_role} />
                          )}
                        </td>

                        {/* MFA */}
                        <td className="px-6 py-4">
                          {u.is_mfa_enabled ? (
                            <span className="flex items-center text-green-400 text-xs">
                              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> MFA Enrolled
                            </span>
                          ) : (
                            <span className="flex items-center text-gray-400 text-xs">
                              <Key className="w-3.5 h-3.5 mr-1.5 text-yellow-500" /> Not Enrolled
                            </span>
                          )}
                        </td>

                        {/* Last Active */}
                        <td className="px-6 py-4 text-gray-400 text-xs font-mono">
                          {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Never"}
                        </td>

                        {/* Actions — bound to handleRoleChange / handleToggleLock */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isEditing ? (
                              <>
                                <button
                                  disabled={!selectedRole}
                                  onClick={() => handleRoleChange(u.id)}
                                  className="px-2 py-1.5 text-xs font-bold rounded bg-[rgba(212,175,55,0.2)] text-[#d4af37] border border-[rgba(212,175,55,0.4)] hover:bg-[rgba(212,175,55,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setEditingId(u.id); setSelectedRole(u.staff_role ?? ""); }}
                                  className="p-1.5 text-gray-500 hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.1)] rounded transition-colors"
                                  title="Edit Role"
                                >
                                  <ClipboardList className="w-4 h-4" />
                                </button>
                                <button
                                  className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
                                  title="More Actions"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer with Pagination */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 bg-[#020408]/40 mt-auto">
            <span>Showing {Math.min(page * PAGE_SIZE + 1, filtered.length)}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} accounts</span>
            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center space-x-1 font-sans">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50"
                >Prev</button>
                {Array.from({ length: Math.min(Math.ceil(filtered.length / PAGE_SIZE), 5) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`px-3 py-1.5 rounded border transition-colors ${page === i ? "bg-[rgba(212,175,55,0.2)] text-[#d4af37] border-[rgba(212,175,55,0.3)]" : "border-white/10 hover:bg-white/5"}`}
                  >{i + 1}</button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(Math.ceil(filtered.length / PAGE_SIZE) - 1, p + 1))}
                  disabled={page >= Math.ceil(filtered.length / PAGE_SIZE) - 1}
                  className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50"
                >Next</button>
              </div>
            )}
          </div>
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

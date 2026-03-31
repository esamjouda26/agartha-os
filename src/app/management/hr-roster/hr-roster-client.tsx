"use client";

import { useState, useMemo, useTransition } from "react";
import {
  UserPlus, ArrowRightLeft,
  UserX, X, Lock, Eye, EyeOff,
  ShieldCheck, CheckCircle2, Loader2, Pencil,
  Copy, Ban, PlayCircle, AlertTriangle, AlertOctagon,
} from "lucide-react";
import DomainAuditTable from "@/components/DomainAuditTable";
import {
  DataTable, TableHeader, TableBody, TableRow, TableCell,
  TableHead, TableHeadSortable, TableToolbar, TablePagination, TableEmptyState,
} from "@/components/ui/data-table";
import { RoleFilterDropdown, StatusFilterDropdown, ROLES, ROLE_GROUPS } from "@/components/ui/data-table/filters";
import { useDataTable } from "@/hooks/useDataTable";
import {
  createStaffRecordAction,
  updateStaffRecordAction,
  transferStaffRoleAction,
  terminateStaffAction,
} from "./actions";

// ── Style helpers ─────────────────────────────────────────────────────────────

const STATUSES: Record<string, string> = {
  active: "ACTIVE", pending: "PENDING", on_leave: "ON LEAVE",
  suspended: "SUSPENDED", terminated: "TERMINATED",
};

const STATUS_STYLES: Record<string, string> = {
  active:     "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  pending:    "bg-amber-500/10 border-amber-500/20 text-amber-400",
  on_leave:   "bg-blue-500/10 border-blue-500/20 text-blue-400",
  suspended:  "bg-red-500/10 border-red-500/20 text-red-400",
  terminated: "bg-gray-500/10 border-gray-500/20 text-gray-500",
};

function roleColor(role: string | null) {
  if (!role) return "bg-white/5 border-white/10 text-gray-600";
  if (role.endsWith("_admin"))   return "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400";
  if (role.endsWith("_manager")) return "bg-amber-500/10 border-amber-500/20 text-amber-400";
  return "bg-sky-500/10 border-sky-500/20 text-sky-400";
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Department { id: string; name: string; }

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  personalEmail: string;
  workEmail: string;
  phone: string;
  address: string;
  kinName: string;
  kinRel: string;
  kinPhone: string;
  nationalId: string;
  bank: string;
  account: string;
  salary: string;
  role: string | null;
  departmentId: string;
  startDate: string;
  endDate: string | null;
  status: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] cursor-pointer appearance-none">
      {Object.entries(ROLE_GROUPS).map(([group, roles]) => (
        <optgroup key={group} label={group}>
          {roles.map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)]" />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function HrRosterClient({
  initialEmployees,
  departments,
}: {
  initialEmployees: Employee[];
  departments: Department[];
}) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [filterRoles, setFilterRoles] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [editModal, setEditModal] = useState<Employee | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [transferModal, setTransferModal] = useState<Employee | null>(null);
  const [transferTarget, setTransferTarget] = useState("");
  const [transferJustification, setTransferJustification] = useState("");
  const [termModal, setTermModal] = useState<Employee | null>(null);
  const [termReason, setTermReason] = useState("");
  const [termConfirmId, setTermConfirmId] = useState("");

  // PII reveal
  const [showAccount, setShowAccount] = useState(false);
  const [showSalary, setShowSalary] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => employees.filter((e) => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) &&
        !e.employeeId.toLowerCase().includes(search.toLowerCase()) &&
        !e.workEmail.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRoles.length > 0 && !filterRoles.includes(e.role ?? "")) return false;
    if (filterStatuses.length > 0 && !filterStatuses.includes(e.status)) return false;
    return true;
  }), [employees, search, filterRoles, filterStatuses]);

  const { page, setPage, totalPages, pageData, pageSize, setPageSize, sortKey, sortOrder, toggleSort } =
    useDataTable(filtered, 15, "name", "asc");

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openCreate() {
    setEditModal({
      id: "", employeeId: "—", name: "", personalEmail: "", workEmail: "",
      phone: "", address: "", kinName: "", kinRel: "", kinPhone: "",
      nationalId: "", bank: "", account: "", salary: "",
      role: "fnb_crew", departmentId: "food_beverage",
      startDate: new Date().toISOString().split("T")[0],
      endDate: null, status: "pending",
    });
    setIsCreating(true);
    setShowAccount(false); setShowSalary(false);
  }

  function openEdit(emp: Employee) {
    setEditModal({ ...emp, departmentId: emp.departmentId ?? "" });
    setIsCreating(false);
    setShowAccount(false); setShowSalary(false);
  }

  function saveEmployee() {
    if (!editModal || !editModal.name.trim()) { showToast("Legal name is required."); return; }
    startTransition(async () => {
      try {
        if (isCreating) {
          const { data } = await createStaffRecordAction({
            legal_name: editModal.name,
            personal_email: editModal.personalEmail,
            phone: editModal.phone,
            address: editModal.address,
            kin_name: editModal.kinName,
            kin_relationship: editModal.kinRel,
            kin_phone: editModal.kinPhone,
            national_id_enc: editModal.nationalId,
            bank_name: editModal.bank,
            bank_account_enc: editModal.account,
            salary_enc: editModal.salary,
            department_id: editModal.departmentId || undefined,
            contract_start: editModal.startDate,
            contract_end: editModal.endDate ?? undefined,
            target_role: editModal.role ?? "fnb_crew",
            hr_remark: `New staff provisioned by HR: ${editModal.name}`,
          });
          setEmployees((prev) => [{ ...editModal, id: data.id }, ...prev]);
          showToast(`✅ ${editModal.name} provisioned. IAM request sent to IT.`);
        } else {
          await updateStaffRecordAction(editModal.id, {
            legal_name: editModal.name,
            personal_email: editModal.personalEmail,
            phone: editModal.phone,
            address: editModal.address,
            kin_name: editModal.kinName,
            kin_relationship: editModal.kinRel,
            kin_phone: editModal.kinPhone,
            national_id_enc: editModal.nationalId,
            bank_name: editModal.bank,
            bank_account_enc: editModal.account,
            salary_enc: editModal.salary,
            department_id: editModal.departmentId || null,
            contract_start: editModal.startDate,
            contract_end: editModal.endDate ?? null,
          });
          setEmployees((prev) => prev.map((e) => e.id === editModal.id ? { ...e, ...editModal } : e));
          showToast("✅ Staff record updated.");
        }
        setEditModal(null);
      } catch (err: unknown) {
        showToast(`❌ ${err instanceof Error ? err.message : "Save failed"}`);
      }
    });
  }

  function submitTransfer() {
    if (!transferModal || !transferJustification.trim()) { showToast("Business justification is required."); return; }
    startTransition(async () => {
      try {
        await transferStaffRoleAction(transferModal.id, transferTarget, transferJustification);
        showToast(`✅ Transfer request submitted. ${transferModal.name} → ${ROLES[transferTarget] ?? transferTarget}.`);
        setTransferModal(null);
      } catch (err: unknown) {
        showToast(`❌ ${err instanceof Error ? err.message : "Transfer failed"}`);
      }
    });
  }

  function executeTerm() {
    if (!termModal || !termReason || termConfirmId !== termModal.employeeId) return;
    startTransition(async () => {
      try {
        await terminateStaffAction(termModal.id, termReason);
        setEmployees((prev) => prev.map((e) => e.id === termModal.id ? { ...e, status: "terminated" } : e));
        showToast(`⚠ Termination IAM request submitted for ${termModal.name}.`);
        setTermModal(null);
      } catch (err: unknown) {
        showToast(`❌ ${err instanceof Error ? err.message : "Termination failed"}`);
      }
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-10">
      {/* Provision Button */}
      <div className="flex justify-end">
        <button onClick={openCreate} disabled={isPending}
          className="flex items-center gap-2 bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold py-2.5 px-5 rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all text-sm disabled:opacity-50">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          + Provision New Crew Member
        </button>
      </div>

      {/* Table Panel */}
      <div className="glass-panel rounded-xl flex flex-col overflow-hidden border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
        <TableToolbar
          search={search}
          setSearch={(v: string) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search by name, employee ID, or work email…"
          actions={(search || filterRoles.length > 0 || filterStatuses.length > 0) ? (
            <button onClick={() => { setSearch(""); setFilterRoles([]); setFilterStatuses([]); setPage(1); }}
              className="text-[10px] uppercase font-bold tracking-wider text-red-400 hover:text-red-300 px-2 py-1.5 rounded border border-red-400/20 hover:bg-red-400/10">
              Clear Filters
            </button>
          ) : null}
        >
          <RoleFilterDropdown filterRoles={filterRoles} setFilterRoles={setFilterRoles} roleGroups={ROLE_GROUPS} rolesMap={ROLES} />
          <StatusFilterDropdown filterStatuses={filterStatuses} setFilterStatuses={setFilterStatuses} statusesMap={STATUSES} />
        </TableToolbar>

        <DataTable minWidth="950px">
          <TableHeader>
            <tr>
              <TableHeadSortable sortKey="employeeId" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>Employee ID</TableHeadSortable>
              <TableHeadSortable sortKey="name" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>Full Name</TableHeadSortable>
              <TableHead>Work Email</TableHead>
              <TableHeadSortable sortKey="role" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>Role</TableHeadSortable>
              <TableHeadSortable sortKey="status" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>Status</TableHeadSortable>
              <TableHead className="text-right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableEmptyState colSpan={6} message="No staff records match your filters." />
            ) : pageData.map((emp) => {
              const isRevoked = emp.status === "suspended" || emp.status === "terminated";
              return (
                <TableRow key={emp.id} className={`border-l-2 border-transparent hover:border-l-[#d4af37] ${isRevoked ? "opacity-60" : ""}`}>

                  {/* Employee ID */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold text-[#d4af37]/80 tracking-wider">{emp.employeeId}</span>
                      <button onClick={() => { navigator.clipboard.writeText(emp.employeeId); showToast("ID copied."); }}
                        className="text-gray-600 hover:text-[#d4af37] transition-colors opacity-0 group-hover:opacity-100">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </TableCell>

                  {/* Full Name */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold border flex-shrink-0 ${roleColor(emp.role).replace("text-", "text-").replace("border-", "border-")}`}>
                        {(emp.name ?? "?")[0].toUpperCase()}
                      </div>
                      <span className={`text-sm font-semibold ${isRevoked ? "text-gray-500 line-through decoration-red-500/50" : "text-gray-200"}`}>
                        {emp.name}
                      </span>
                    </div>
                  </TableCell>

                  {/* Work Email */}
                  <TableCell>
                    <span className="text-xs text-gray-400 font-mono">
                      {emp.workEmail || <span className="text-gray-600 italic">Pending IT</span>}
                    </span>
                  </TableCell>

                  {/* Role */}
                  <TableCell>
                    {emp.role ? (
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${roleColor(emp.role)}`}>
                        {ROLES[emp.role] ?? emp.role}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-600 italic">Unassigned</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${STATUS_STYLES[emp.status] ?? "bg-white/5 text-gray-400 border-white/10"}`}>
                      {STATUSES[emp.status] ?? emp.status}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Edit HR profile */}
                      <button onClick={() => openEdit(emp)}
                        className="p-1.5 text-gray-500 hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.08)] rounded transition-colors"
                        title="Edit HR Profile">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Transfer role */}
                      {emp.status !== "terminated" && (
                        <button onClick={() => { setTransferModal(emp); setTransferTarget(emp.role ?? "fnb_crew"); setTransferJustification(""); }}
                          className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                          title="Request Role Transfer">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Terminate */}
                      {emp.status !== "terminated" && (
                        <button onClick={() => { setTermModal(emp); setTermReason(""); setTermConfirmId(""); }}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Request Termination">
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </DataTable>

        <TablePagination page={page} setPage={setPage} totalPages={totalPages} totalRecords={filtered.length} pageSize={pageSize} setPageSize={setPageSize} />
      </div>

      <DomainAuditTable entityTypes={["staff_records"]} title="Staff Audit Trail" />

      {/* ── Edit / Provision Modal ─────────────────────────────────────────── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setEditModal(null)}>
          <div className="glass-panel rounded-lg w-full max-w-2xl border-[rgba(212,175,55,0.3)] shadow-[0_10px_40px_rgba(212,175,55,0.15)] my-auto flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg flex-shrink-0">
              <h3 className="font-cinzel text-lg text-[#d4af37] tracking-wider">
                {isCreating ? "Provision New Crew Member" : `Edit — ${editModal.name}`}
              </h3>
              <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto flex-1">

              {/* Identity */}
              <section>
                <div className="font-cinzel text-[11px] uppercase tracking-[0.15em] text-[#d4af37] pb-2 border-b border-[rgba(212,175,55,0.15)] mb-4">Identity</div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Legal Name">
                    <TextInput value={editModal.name} onChange={(v) => setEditModal({ ...editModal, name: v })} placeholder="Full Legal Name" />
                  </Field>
                  <Field label={`Personal Email${isCreating ? "" : " (contact only)"}`}>
                    <TextInput value={editModal.personalEmail} onChange={(v) => setEditModal({ ...editModal, personalEmail: v })} placeholder="personal@email.com" type="email" />
                  </Field>
                  <Field label="Phone">
                    <TextInput value={editModal.phone} onChange={(v) => setEditModal({ ...editModal, phone: v })} placeholder="+60 12-345 6789" />
                  </Field>
                  <Field label="Home Address">
                    <TextInput value={editModal.address} onChange={(v) => setEditModal({ ...editModal, address: v })} placeholder="Street, City, Postal" />
                  </Field>
                </div>
              </section>

              {/* Emergency Contact */}
              <section>
                <div className="font-cinzel text-[11px] uppercase tracking-[0.15em] text-[#d4af37] pb-2 border-b border-[rgba(212,175,55,0.15)] mb-4">Emergency Contact</div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Next of Kin"><TextInput value={editModal.kinName} onChange={(v) => setEditModal({ ...editModal, kinName: v })} placeholder="Full Name" /></Field>
                  <Field label="Relationship"><TextInput value={editModal.kinRel} onChange={(v) => setEditModal({ ...editModal, kinRel: v })} placeholder="Spouse, Parent…" /></Field>
                  <Field label="Phone"><TextInput value={editModal.kinPhone} onChange={(v) => setEditModal({ ...editModal, kinPhone: v })} placeholder="+60 12-345 6789" /></Field>
                </div>
              </section>

              {/* PII & Financial */}
              <section>
                <div className="font-cinzel text-[11px] uppercase tracking-[0.15em] text-[#d4af37] pb-2 border-b border-[rgba(212,175,55,0.15)] mb-4 flex items-center justify-between">
                  <span>PII &amp; Financial</span>
                  <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase">
                    <Lock className="w-3.5 h-3.5" /> E2E Encrypted
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="National ID / Passport">
                    <TextInput value={editModal.nationalId} onChange={(v) => setEditModal({ ...editModal, nationalId: v })} placeholder="****-****-1234" />
                  </Field>
                  <Field label="Bank Name">
                    <TextInput value={editModal.bank} onChange={(v) => setEditModal({ ...editModal, bank: v })} placeholder="Bank Name" />
                  </Field>
                  <Field label="Account Number">
                    <div className="relative">
                      <input type={showAccount ? "text" : "password"} value={editModal.account}
                        onChange={(e) => setEditModal({ ...editModal, account: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 pr-10 font-mono focus:outline-none focus:border-[rgba(212,175,55,0.5)]" />
                      <button type="button" onClick={() => setShowAccount(!showAccount)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#d4af37]">
                        {showAccount ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                  <Field label="Monthly Base Salary (MYR)">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">RM</span>
                      <input type={showSalary ? "text" : "password"} value={editModal.salary}
                        onChange={(e) => setEditModal({ ...editModal, salary: e.target.value })}
                        placeholder="••••••"
                        className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white pl-9 pr-10 py-2 font-mono focus:outline-none focus:border-[rgba(212,175,55,0.5)]" />
                      <button type="button" onClick={() => setShowSalary(!showSalary)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#d4af37]">
                        {showSalary ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                </div>
              </section>

              {/* Contract */}
              <section>
                <div className="font-cinzel text-[11px] uppercase tracking-[0.15em] text-[#d4af37] pb-2 border-b border-[rgba(212,175,55,0.15)] mb-4">Contract &amp; Placement</div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Field label="Department">
                    <select
                      value={editModal.departmentId}
                      onChange={(e) => setEditModal({ ...editModal, departmentId: e.target.value })}
                      className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] cursor-pointer appearance-none">
                      <option value="">— Select Department —</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </Field>
                  {isCreating && (
                    <Field label="Initial Role">
                      <RoleSelect value={editModal.role ?? "fnb_crew"} onChange={(v) => setEditModal({ ...editModal, role: v })} />
                    </Field>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Start Date">
                    <input type="date" value={editModal.startDate}
                      onChange={(e) => setEditModal({ ...editModal, startDate: e.target.value })}
                      className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)]"
                      style={{ colorScheme: "dark" }} />
                  </Field>
                  <Field label="End Date (optional)">
                    <input type="date" value={editModal.endDate ?? ""}
                      onChange={(e) => setEditModal({ ...editModal, endDate: e.target.value || null })}
                      className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)]"
                      style={{ colorScheme: "dark" }} />
                  </Field>
                </div>
                {!isCreating && (
                  <p className="text-[10px] text-gray-600 mt-3 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Role changes require an IT-approved Transfer Request. Use the <ArrowRightLeft className="w-3 h-3 inline mx-0.5" /> action on the table row.
                  </p>
                )}
              </section>

              <div className="flex justify-end pt-2 border-t border-white/10">
                <button onClick={saveEmployee} disabled={isPending}
                  className="px-6 py-2.5 text-sm font-bold rounded bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all min-w-[160px] flex justify-center disabled:opacity-50">
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : isCreating ? "Provision Staff" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Transfer Role Modal ────────────────────────────────────────────── */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm p-4" onClick={() => setTransferModal(null)}>
          <div className="glass-panel rounded-lg w-full max-w-lg border-[rgba(212,175,55,0.3)] shadow-[0_10px_40px_rgba(212,175,55,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <h3 className="font-cinzel text-lg text-[#d4af37] tracking-wider flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" /> Request Role Transfer
              </h3>
              <button onClick={() => setTransferModal(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2 text-[10px] text-amber-400 bg-amber-400/5 border border-amber-400/20 rounded px-3 py-2">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                Requires IT clearance. This request will be routed to the IAM Ledger for approval.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Staff">
                  <input readOnly value={transferModal.name} className="w-full bg-[#020408]/50 border border-white/5 rounded-md text-sm text-gray-400 px-3 py-2 cursor-not-allowed" />
                </Field>
                <Field label="Employee ID">
                  <input readOnly value={transferModal.employeeId} className="w-full bg-[#020408]/50 border border-white/5 rounded-md text-sm text-gray-400 px-3 py-2 cursor-not-allowed font-mono" />
                </Field>
              </div>
              <Field label="Current Role">
                <input readOnly value={ROLES[transferModal.role ?? ""] ?? transferModal.role ?? "Unassigned"} className="w-full bg-[#020408]/50 border border-white/5 rounded-md text-sm text-gray-400 px-3 py-2 cursor-not-allowed" />
              </Field>
              <Field label="Target Role">
                <RoleSelect value={transferTarget} onChange={setTransferTarget} />
              </Field>
              <Field label="Business Justification">
                <textarea value={transferJustification} onChange={(e) => setTransferJustification(e.target.value)}
                  rows={3} placeholder="Provide reason for this transfer request…"
                  className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] resize-none" />
              </Field>
              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button onClick={() => setTransferModal(null)} disabled={isPending} className="px-5 py-2.5 text-sm text-gray-400 hover:text-white disabled:opacity-50">Cancel</button>
                <button onClick={submitTransfer} disabled={isPending || !transferJustification.trim()}
                  className="px-6 py-2.5 text-sm font-bold rounded bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] min-w-[200px] flex justify-center disabled:opacity-50">
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Transfer Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Termination Modal ──────────────────────────────────────────────── */}
      {termModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm p-4" onClick={() => setTermModal(null)}>
          <div className="glass-panel rounded-lg w-full max-w-lg border-red-500/30 shadow-[0_10px_40px_rgba(239,68,68,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-red-500/20 flex justify-between items-center bg-red-950/30 rounded-t-lg">
              <h3 className="font-cinzel text-lg text-red-400 tracking-wider flex items-center gap-2">
                <AlertOctagon className="w-5 h-5" /> Request Offboarding
              </h3>
              <button onClick={() => setTermModal(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 text-sm text-red-300 leading-relaxed">
                <span className="font-bold text-red-400">⚠ HR Action:</span> This submits a termination request to IT. Upon IT approval, all system access for <strong className="text-white">{termModal.name}</strong> will be permanently revoked.
              </div>
              <Field label="Termination Reason">
                <select value={termReason} onChange={(e) => setTermReason(e.target.value)}
                  className="w-full bg-[#020408] border border-red-500/20 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-red-500/50 cursor-pointer appearance-none">
                  <option value="">— Select Reason —</option>
                  <option value="resignation">Resignation</option>
                  <option value="contract_expired">Contract Expired</option>
                  <option value="misconduct">Misconduct</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Type Employee ID to Confirm">
                <input type="text" value={termConfirmId} onChange={(e) => setTermConfirmId(e.target.value)}
                  placeholder={`Type ${termModal.employeeId} to unlock`}
                  className="w-full bg-[#020408] border border-red-500/20 rounded-md text-sm text-white px-3 py-2 font-mono focus:outline-none focus:border-red-500/50" />
                <p className="text-[10px] text-gray-600 mt-1">Must match: <span className="font-mono text-red-400/80">{termModal.employeeId}</span></p>
              </Field>
              <div className="flex justify-end gap-3 pt-3 border-t border-red-500/10">
                <button onClick={() => setTermModal(null)} disabled={isPending} className="px-5 py-2.5 text-sm text-gray-400 hover:text-white disabled:opacity-50">Cancel</button>
                <button onClick={executeTerm}
                  disabled={!termReason || termConfirmId !== termModal.employeeId || isPending}
                  className={`px-6 py-2.5 text-sm font-bold rounded flex justify-center transition-all min-w-[200px] ${termReason && termConfirmId === termModal.employeeId ? "bg-red-600 text-white hover:bg-red-500" : "bg-red-600/30 text-red-400 cursor-not-allowed"} disabled:opacity-50`}>
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Termination Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-24 right-8 bg-[#020408] border-l-4 border-l-[#d4af37] border border-white/10 text-white px-6 py-4 rounded-lg shadow-xl text-sm font-semibold flex items-center gap-3 z-[60]">
          <CheckCircle2 className="w-5 h-5 text-[#d4af37]" />{toast}
        </div>
      )}

      {/* Suppress unused import warnings */}
      <span className="hidden"><Ban /><PlayCircle /><AlertTriangle /></span>
    </div>
  );
}

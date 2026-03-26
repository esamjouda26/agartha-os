"use client";

import { useState, useMemo, useTransition } from "react";
import {
  UserPlus, MoreHorizontal, Pencil, ArrowRightLeft,
  UserX, X, Lock, Eye, EyeOff, Copy,
  ShieldCheck, CheckCircle2, AlertOctagon, Loader2
} from "lucide-react";
import DomainAuditTable from "@/components/DomainAuditTable";
import { DataTable, TableHeader, TableBody, TableRow, TableCell, TableHead, TableHeadSortable, TableToolbar, TablePagination, TableEmptyState } from "@/components/ui/data-table";
import { RoleFilterDropdown, StatusFilterDropdown, ROLES, ROLE_GROUPS } from "@/components/ui/data-table/filters";
import { useDataTable } from "@/hooks/useDataTable";
import { 
  createStaffRecordAction, 
  updateStaffRecordAction, 
  transferStaffRoleAction, 
  terminateStaffAction 
} from "./actions";



const STATUSES: Record<string, string> = { active: "ACTIVE", pending: "PENDING", on_leave: "ON LEAVE", suspended: "SUSPENDED", terminated: "TERMINATED" };

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-500/10 border-green-500/20 text-green-400",
  suspended: "bg-red-500/10 border-red-500/20 text-red-400",
  terminated: "bg-gray-500/10 border-gray-500/20 text-gray-500",
  on_leave: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
  pending: "bg-amber-500/10 border-amber-500/20 text-amber-400",
};

function roleColor(role: string) {
  if (role?.endsWith("_admin")) return "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400";
  if (role?.endsWith("_manager")) return "bg-amber-500/10 border-amber-500/20 text-amber-400";
  return "bg-sky-500/10 border-sky-500/20 text-sky-400";
}

interface Employee {
  id: string; employeeId: string; name: string; email: string; phone: string; address: string;
  kinName: string; kinRel: string; kinPhone: string;
  nationalId: string; bank: string; account: string; salary: string;
  role: string; startDate: string; endDate: string | null; status: string;
}

const PAGE_SIZE = 10;

function RoleSelect({ value, onChange, id }: { value: string; onChange: (v: string) => void; id?: string }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] cursor-pointer appearance-none">
      {Object.entries(ROLE_GROUPS).map(([group, roles]) => (
        <optgroup key={group} label={group}>
          {roles.map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

export default function HrRosterClient({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [filterRoles, setFilterRoles] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modals
  const [editModal, setEditModal] = useState<Employee | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [transferModal, setTransferModal] = useState<Employee | null>(null);
  const [transferTarget, setTransferTarget] = useState("");
  const [transferJustification, setTransferJustification] = useState("");
  const [termModal, setTermModal] = useState<Employee | null>(null);
  const [termReason, setTermReason] = useState("");
  const [termConfirmId, setTermConfirmId] = useState("");

  const [showAccount, setShowAccount] = useState(false);
  const [showSalary, setShowSalary] = useState(false);
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  const showToastMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      if (search && !emp.name.toLowerCase().includes(search.toLowerCase()) && !(emp.employeeId || emp.id).toLowerCase().includes(search.toLowerCase())) return false;
      if (filterRoles.length > 0 && !filterRoles.includes(emp.role)) return false;
      if (filterStatuses.length > 0 && !filterStatuses.includes(emp.status)) return false;
      return true;
    });
  }, [employees, search, filterRoles, filterStatuses]);

  const { page, setPage, totalPages, pageData, pageSize, setPageSize, sortKey, sortOrder, toggleSort } = useDataTable(filtered, 10, "name", "asc");

  function openEdit(emp: Employee | null) {
    if (emp) { setEditModal({ ...emp }); setIsCreating(false); }
    else {
      setEditModal({ 
        id: "", 
        employeeId: `EMP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 
        name: "", email: "", phone: "", address: "", kinName: "", kinRel: "", kinPhone: "", 
        nationalId: "", bank: "", account: "", salary: "", role: "fnb_crew", 
        startDate: new Date().toISOString().split("T")[0], endDate: null, status: "pending" 
      });
      setIsCreating(true);
    }
    setShowAccount(false); setShowSalary(false); setOpenMenuId(null);
  }

  function saveEmployee() {
    if (!editModal || !editModal.name.trim()) { showToastMsg("Legal name is required."); return; }
    
    startTransition(async () => {
      try {
        const payload = {
          employee_id: editModal.employeeId,
          legal_name: editModal.name,
          email: editModal.email,
          phone: editModal.phone,
          address: editModal.address,
          kin_name: editModal.kinName,
          kin_relationship: editModal.kinRel,
          kin_phone: editModal.kinPhone,
          national_id_enc: editModal.nationalId,
          bank_name: editModal.bank,
          bank_account_enc: editModal.account,
          salary_enc: editModal.salary,
          role: editModal.role || "fnb_crew",
          contract_start: editModal.startDate,
          contract_end: editModal.endDate || null,
          employment_status: editModal.status || "pending",
        };

        if (isCreating) {
          const { data } = await createStaffRecordAction(payload);
          setEmployees(prev => [
            {...editModal, id: data.id}, ...prev
          ]);
          showToastMsg(`✅ ${editModal.name} provisioned successfully in Supabase.`);
        } else {
          await updateStaffRecordAction(editModal.id, payload);
          setEmployees(prev => prev.map(e => e.id === editModal.id ? editModal : e));
          showToastMsg(`✅ Profile updated securely.`);
        }
        setEditModal(null);
      } catch(err: any) {
        showToastMsg(`❌ Save failed: ${err.message}`);
      }
    });
  }

  function openTransfer(emp: Employee) { setTransferModal(emp); setTransferTarget(emp.role); setTransferJustification(""); setOpenMenuId(null); }
  
  function submitTransfer() {
    if (!transferModal || !transferJustification.trim()) { showToastMsg("Business justification is required."); return; }
    startTransition(async () => {
      try {
        await transferStaffRoleAction(transferModal.id, transferTarget, transferJustification);
        setEmployees((prev) => prev.map((e) => e.id === transferModal.id ? { ...e, role: transferTarget } : e));
        showToastMsg(`✅ Transfer request processed via IAM ledger. ${transferModal.name} → ${ROLES[transferTarget]}.`);
        setTransferModal(null);
      } catch (err: any) {
        showToastMsg(`❌ Transfer failed: ${err.message}`);
      }
    });
  }

  function openTerm(emp: Employee) { setTermModal(emp); setTermReason(""); setTermConfirmId(""); setOpenMenuId(null); }
  
  function executeTerm() {
    if (!termModal || !termReason || termConfirmId !== termModal.employeeId) return;
    startTransition(async () => {
      try {
        await terminateStaffAction(termModal.id, termReason as any);
        setEmployees((prev) => prev.map((e) => e.id === termModal.id ? { ...e, status: "terminated" } : e));
        showToastMsg(`⚠ ${termModal.name} terminated. All access revoked and Auth tokens destroyed.`);
        setTermModal(null);
      } catch (err: any) {
        showToastMsg(`❌ Termination failed: ${err.message}`);
      }
    });
  }

  function toggleFilterRole(r: string) { setFilterRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]); setPage(1); }
  function toggleFilterStatus(s: string) { setFilterStatuses((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]); setPage(1); }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        <button onClick={() => openEdit(null)} disabled={isPending}
          className="flex items-center gap-2 bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] font-bold py-2.5 px-5 rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all whitespace-nowrap text-sm disabled:opacity-50">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} + Provision New Crew Member
        </button>
      </div>

      <div className="glass-panel rounded-xl flex flex-col overflow-hidden min-h-[520px] border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
        <TableToolbar 
           search={search} 
           setSearch={(v: string) => { setSearch(v); setPage(1); }} 
           searchPlaceholder="Search by Name or Employee ID..."
           actions={(search || filterRoles.length > 0 || filterStatuses.length > 0) ? (
             <button onClick={() => { setSearch(""); setFilterRoles([]); setFilterStatuses([]); setPage(1); }} className="text-[10px] uppercase font-bold tracking-wider text-red-400 hover:text-red-300 transition-colors px-2 py-1.5 rounded border border-red-400/20 hover:bg-red-400/10 whitespace-nowrap">
               Clear Filters
             </button>
           ) : null}
        >
          <RoleFilterDropdown filterRoles={filterRoles} setFilterRoles={setFilterRoles} roleGroups={ROLE_GROUPS} rolesMap={ROLES} />
          <StatusFilterDropdown filterStatuses={filterStatuses} setFilterStatuses={setFilterStatuses} statusesMap={STATUSES} />
        </TableToolbar>

        <DataTable>
          <TableHeader>
            <tr>
               <TableHeadSortable sortKey="employeeId" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>Employee ID</TableHeadSortable>
               <TableHeadSortable sortKey="name" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>Legal Name</TableHeadSortable>
               <TableHeadSortable sortKey="role" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>Role</TableHeadSortable>
               <TableHeadSortable sortKey="endDate" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>Employment Term</TableHeadSortable>
               <TableHeadSortable sortKey="status" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>Status</TableHeadSortable>
               <TableHead className="text-right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableEmptyState colSpan={6} message="No employees match your current filters." />
            ) : pageData.map((emp) => (
              <TableRow key={emp.id} className={`${isPending ? "opacity-50" : ""} border-l-2 border-transparent hover:border-l-[#d4af37]`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-400">{emp.employeeId}</span>
                    <button onClick={() => { navigator.clipboard.writeText(emp.employeeId); showToastMsg("ID copied."); }} className="text-gray-600 hover:text-[#d4af37] transition-colors opacity-0 group-hover:opacity-100"><Copy className="w-3 h-3" /></button>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-white font-medium tracking-wide">{emp.name}</TableCell>
                <TableCell><span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border shadow-sm ${roleColor(emp.role)}`}>{ROLES[emp.role] || emp.role}</span></TableCell>
                <TableCell className="text-xs text-gray-400 font-mono">{emp.endDate ? `${emp.startDate} → ${emp.endDate}` : <span className="text-white">Permanent</span>}</TableCell>
                <TableCell><span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border shadow-sm ${STATUS_STYLES[emp.status] ?? ""}`}>{STATUSES[emp.status] || emp.status}</span></TableCell>
                <TableCell className="text-right">
                  <div className="relative inline-block">
                    <button onClick={() => setOpenMenuId(openMenuId === emp.id ? null : emp.id)} className="text-gray-500 hover:text-[#d4af37] transition-colors p-1.5 rounded hover:bg-[rgba(212,175,55,0.1)]"><MoreHorizontal className="w-4 h-4" /></button>
                    {openMenuId === emp.id && (
                      <div className="absolute right-0 top-full mt-1 z-30 min-w-[11rem] bg-[rgba(10,20,30,0.95)] border border-white/10 rounded-lg py-1 shadow-xl text-left">
                        <button onClick={() => openEdit(emp)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-300 hover:bg-[rgba(212,175,55,0.1)] hover:text-[#d4af37]"><Pencil className="w-3.5 h-3.5" /> Edit Profile</button>
                        <button onClick={() => openTransfer(emp)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-300 hover:bg-[rgba(212,175,55,0.1)] hover:text-[#d4af37]"><ArrowRightLeft className="w-3.5 h-3.5" /> Transfer Role</button>
                        <div className="my-1 border-t border-white/5" />
                        <button onClick={() => openTerm(emp)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"><UserX className="w-3.5 h-3.5" /> Terminate</button>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>

        <TablePagination page={page} setPage={setPage} totalPages={totalPages} totalRecords={filtered.length} pageSize={pageSize} setPageSize={setPageSize} />
      </div>

      <DomainAuditTable entityTypes={["staff_records"]} title="Staff Audit Trail" />

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setEditModal(null)}>
          <div className="glass-panel rounded-lg w-full max-w-2xl border-[rgba(212,175,55,0.3)] shadow-[0_10px_40px_rgba(212,175,55,0.15)] my-auto flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg flex-shrink-0">
              <h3 className="font-cinzel text-lg text-[#d4af37] tracking-wider">{isCreating ? "Provision New Crew Member" : "Edit Profile"}</h3>
              <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <div className="font-cinzel text-[11px] uppercase tracking-[0.15em] text-[#d4af37] pb-2 border-b border-[rgba(212,175,55,0.15)] mb-3">Identity</div>
                <div className="grid grid-cols-2 gap-4">
                  {[{ label: "Legal Name", key: "name" as const, type: "text", placeholder: "Full Legal Name" }, { label: "Primary Email", key: "email" as const, type: "email", placeholder: "email@agartha.com" }, { label: "Phone Number", key: "phone" as const, type: "tel", placeholder: "+60 12-345 6789" }, { label: "Home Address", key: "address" as const, type: "text", placeholder: "Street, City, Postal" }].map((f) => (
                    <div key={f.key}><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{f.label}</label><input type={f.type} value={editModal[f.key]} onChange={(e) => setEditModal({ ...editModal, [f.key]: e.target.value })} placeholder={f.placeholder} className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)]" /></div>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-cinzel text-[11px] uppercase tracking-[0.15em] text-[#d4af37] pb-2 border-b border-[rgba(212,175,55,0.15)] mb-3">Emergency Contact</div>
                <div className="grid grid-cols-3 gap-4">
                  {[{ label: "Next of Kin", key: "kinName" as const, ph: "Full Name" }, { label: "Relationship", key: "kinRel" as const, ph: "e.g. Spouse" }, { label: "Phone", key: "kinPhone" as const, ph: "+60 12-345 6789" }].map((f) => (
                    <div key={f.key}><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{f.label}</label><input type="text" value={editModal[f.key]} onChange={(e) => setEditModal({ ...editModal, [f.key]: e.target.value })} placeholder={f.ph} className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)]" /></div>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-cinzel text-[11px] uppercase tracking-[0.15em] text-[#d4af37] pb-2 border-b border-[rgba(212,175,55,0.15)] mb-3 flex items-center justify-between">
                  <span>PII & Financial</span>
                  <span className="flex items-center gap-1 text-[#d4af37] text-[9px] font-bold tracking-widest uppercase"><Lock className="w-3.5 h-3.5" /> E2E Encrypted</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">National ID / Passport</label><input type="text" value={editModal.nationalId} onChange={(e) => setEditModal({ ...editModal, nationalId: e.target.value })} placeholder="****-****-1234" className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 font-mono focus:outline-none focus:border-[rgba(212,175,55,0.5)]" /></div>
                  <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Bank Name</label><input type="text" value={editModal.bank} onChange={(e) => setEditModal({ ...editModal, bank: e.target.value })} placeholder="Bank Name" className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)]" /></div>
                  <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Account Number</label>
                    <div className="relative"><input type={showAccount ? "text" : "password"} value={editModal.account} onChange={(e) => setEditModal({ ...editModal, account: e.target.value })} placeholder="••••••••••••" className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 pr-10 font-mono focus:outline-none focus:border-[rgba(212,175,55,0.5)]" /><button type="button" onClick={() => setShowAccount(!showAccount)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#d4af37] transition-colors">{showAccount ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
                  </div>
                  <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Monthly Base Salary (MYR)</label>
                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">RM</span><input type={showSalary ? "text" : "password"} value={editModal.salary} onChange={(e) => setEditModal({ ...editModal, salary: e.target.value })} placeholder="••••••" className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white pl-9 pr-10 py-2 font-mono focus:outline-none focus:border-[rgba(212,175,55,0.5)]" /><button type="button" onClick={() => setShowSalary(!showSalary)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#d4af37] transition-colors">{showSalary ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
                  </div>
                </div>
              </div>
              <div>
                <div className="font-cinzel text-[11px] uppercase tracking-[0.15em] text-[#d4af37] pb-2 border-b border-[rgba(212,175,55,0.15)] mb-3">Contract</div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Start Date</label><input type="date" value={editModal.startDate} onChange={(e) => setEditModal({ ...editModal, startDate: e.target.value })} className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)]" style={{ colorScheme: "dark" }} /></div>
                  <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">End Date <span className="text-gray-600 normal-case">(optional)</span></label><input type="date" value={editModal.endDate ?? ""} onChange={(e) => setEditModal({ ...editModal, endDate: e.target.value || null })} className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)]" style={{ colorScheme: "dark" }} /></div>
                  <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Assigned Role</label><RoleSelect value={editModal.role} onChange={(v) => setEditModal({ ...editModal, role: v })} /></div>
                </div>
              </div>
              <div className="flex justify-end pt-3 border-t border-white/10">
                <button onClick={saveEmployee} disabled={isPending} className="px-6 py-2.5 text-sm font-bold rounded bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all min-w-[160px] flex justify-center disabled:opacity-50">
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Profile"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm p-4" onClick={() => setTransferModal(null)}>
          <div className="glass-panel rounded-lg w-full max-w-lg border-[rgba(212,175,55,0.3)] shadow-[0_10px_40px_rgba(212,175,55,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#020408]/50 rounded-t-lg">
              <h3 className="font-cinzel text-lg text-[#d4af37] tracking-wider flex items-center gap-2"><ArrowRightLeft className="w-5 h-5" /> Request Role Transfer</h3>
              <button onClick={() => setTransferModal(null)} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2 text-[10px] text-amber-400 bg-amber-400/5 border border-amber-400/20 rounded px-3 py-2">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Requires IT Clearance. This request will be routed to the IAM Ledger.</span>
              </div>
              <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Current Role</label><input readOnly value={ROLES[transferModal.role] || transferModal.role} className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 opacity-60 cursor-not-allowed" /></div>
              <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Target Role</label><RoleSelect value={transferTarget} onChange={setTransferTarget} /></div>
              <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Business Justification</label><textarea value={transferJustification} onChange={(e) => setTransferJustification(e.target.value)} rows={3} placeholder="Provide reason for this transfer request..." className="w-full bg-[#020408] border border-white/10 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-[rgba(212,175,55,0.5)] resize-none" /></div>
              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button onClick={() => setTransferModal(null)} disabled={isPending} className="px-5 py-2.5 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50">Cancel</button>
                <button onClick={submitTransfer} disabled={isPending} className="px-6 py-2.5 text-sm font-bold rounded bg-gradient-to-r from-[#806b45] to-[#d4af37] hover:from-[#d4af37] hover:to-yellow-300 text-[#020408] shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all min-w-[210px] flex justify-center disabled:opacity-50">
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Transfer Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {termModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020408]/80 backdrop-blur-sm p-4" onClick={() => setTermModal(null)}>
          <div className="glass-panel rounded-lg w-full max-w-lg border-red-500/30 shadow-[0_10px_40px_rgba(239,68,68,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-red-500/20 flex justify-between items-center bg-red-950/30 rounded-t-lg">
              <h3 className="font-cinzel text-lg text-red-400 tracking-wider flex items-center gap-2"><AlertOctagon className="w-5 h-5" /> Execute Offboarding</h3>
              <button onClick={() => setTermModal(null)} className="text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 text-sm text-red-300 leading-relaxed">
                <span className="font-bold text-red-400">⚠ CRITICAL ACTION:</span> You are about to instantly terminate <strong className="text-white">{termModal.name}</strong> and revoke all digital and physical access. This action triggers an immediate authentication kill-switch destroying all active JWTs, session cookies, and physical gate clearances.
              </div>
              <div><label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Termination Reason</label>
                <select value={termReason} onChange={(e) => setTermReason(e.target.value)} className="w-full bg-[#020408] border border-red-500/20 rounded-md text-sm text-white px-3 py-2 focus:outline-none focus:border-red-500/50 cursor-pointer appearance-none">
                  <option value="">— Select Reason —</option>
                  <option value="resignation">Resignation</option>
                  <option value="contract_expired">Contract Expired</option>
                  <option value="misconduct">Misconduct</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Type Employee ID to Confirm</label>
                <input type="text" value={termConfirmId} onChange={(e) => setTermConfirmId(e.target.value)} placeholder="Type EMP-XXXX... to unlock" className="w-full bg-[#020408] border border-red-500/20 rounded-md text-sm text-white px-3 py-2 font-mono focus:outline-none focus:border-red-500/50" />
                <p className="text-[10px] text-gray-600 mt-1">Must match: <span className="font-mono text-red-400/80">{termModal.employeeId}</span></p>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-red-500/10">
                <button onClick={() => setTermModal(null)} disabled={isPending} className="px-5 py-2.5 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50">Cancel</button>
                <button onClick={executeTerm} disabled={!termReason || termConfirmId !== termModal.employeeId || isPending}
                  className={`px-6 py-2.5 text-sm font-bold rounded flex justify-center transition-all min-w-[200px] ${termReason && termConfirmId === termModal.employeeId ? "bg-red-600 text-white hover:bg-red-500 shadow-lg" : "bg-red-600/40 text-red-300 cursor-not-allowed"} disabled:opacity-50`}>
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "EXECUTE TERMINATION"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 right-8 bg-[#020408] border-l-4 border-l-[#d4af37] border border-white/10 text-white px-6 py-4 rounded-lg shadow-xl backdrop-blur-md text-sm font-semibold flex items-center gap-3 z-[60]">
          <CheckCircle2 className="w-5 h-5 text-[#d4af37]" /><span>{toast}</span>
        </div>
      )}
    </div>
  );
}

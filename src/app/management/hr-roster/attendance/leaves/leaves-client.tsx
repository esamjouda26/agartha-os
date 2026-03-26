"use client";

import { useState, useTransition, useMemo } from "react";
import { CheckCircle2, XCircle, Search, Inbox, Archive, Calendar as CalendarIcon, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { approveLeave, rejectLeave } from "../actions";
import { DataTable, TableHeader, TableBody, TableRow, TableCell, TableHead, TableHeadSortable, TableToolbar, TablePagination, TableEmptyState } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/useDataTable";

import { TimeFilterDropdown, RoleFilterDropdown, ROLES, ROLE_GROUPS } from "@/components/ui/data-table/filters";

const TIME_OPTIONS = { all: "All Time", "7d": "Last 7 Days", mtd: "Month to Date", ytd: "Year to Date" };

export default function LeavesClient({ initialLeaves }: any) {
  const [subTab, setSubTab] = useState<"pending" | "history">("pending");
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [filterRoles, setFilterRoles] = useState<string[]>([]);
  const [leavesData, setLeavesData] = useState(initialLeaves);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleApprove = (id: string) => {
    startTransition(async () => {
      try {
        await approveLeave(id);
        const updated = leavesData.map((L: any) => L.id === id ? {...L, status: "approved"} : L);
        setLeavesData(updated);
        showToast("Leave approved & shifts linked mathematically.");
      } catch(e: any) { showToast(e.message); }
    });
  };

  const handleReject = () => {
    if (!rejectModal || !rejectReason.trim()) return;
    startTransition(async () => {
      try {
        await rejectLeave(rejectModal, rejectReason);
        const updated = leavesData.map((L: any) => L.id === rejectModal ? {...L, status: "rejected", rejection_reason: rejectReason} : L);
        setLeavesData(updated);
        setRejectModal(null);
        setRejectReason("");
        showToast("Leave formally rejected.");
      } catch(e: any) { showToast(e.message); }
    });
  };

  const filteredData = useMemo(() => {
    let arr = leavesData.filter((L: any) => subTab === "pending" ? L.status === "pending" : L.status !== "pending");
    if (filterRoles.length > 0) {
        arr = arr.filter((L: any) => filterRoles.includes(L.staff_records?.role));
    }
    if (search.trim()) {
        const s = search.toLowerCase();
        arr = arr.filter((L: any) => (L.staff_records?.legal_name || "").toLowerCase().includes(s) || (L.staff_records?.employee_id || "").toLowerCase().includes(s));
    }
    if (subTab === "history" && timeFilter !== "all") {
        const now = new Date();
        const tOffset = now.getTimezoneOffset() * 60000;
        let bound = new Date(0);
        if (timeFilter === "7d") bound = new Date(now.getTime() - (7*86400000));
        if (timeFilter === "mtd") bound = new Date(now.getFullYear(), now.getMonth(), 1);
        if (timeFilter === "ytd") bound = new Date(now.getFullYear(), 0, 1);
        const boundIso = new Date(bound.getTime() - tOffset).toISOString().split("T")[0];
        arr = arr.filter((L: any) => L.start_date >= boundIso);
    }
    return arr;
  }, [leavesData, subTab, search, timeFilter, filterRoles]);

  const { page, setPage, totalPages, pageData, pageSize, setPageSize, sortKey, sortOrder, toggleSort } = useDataTable(filteredData, 10, "created_at", "desc");

  const generateHistoryCSV = () => {
    if (filteredData.length === 0) return showToast("No history to export.");
    let csv = "Employee,Role,Leave Type,Start Date,End Date,Status,Reason/Rejection\\n";
    filteredData.forEach((r: any) => {
        csv += `"${r.staff_records?.legal_name}","${r.staff_records?.role}","${r.type}","${r.start_date}","${r.end_date}","${r.status}","${r.reason || r.rejection_reason || ''}"\\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const ink = document.createElement("a");
    ink.href = URL.createObjectURL(blob);
    ink.download = `Leave_History_Export.csv`;
    ink.click();
  };

  return (
    <div className={`space-y-6 ${isPending ? 'opacity-70 pointer-events-none' : ''} transition-opacity`}>
       <div className="flex bg-[#020408] border border-[rgba(212,175,55,0.15)] rounded-lg w-fit overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.6)]">
          <button onClick={() => { setSubTab("pending"); setPage(1); }} className={`flex items-center gap-2 px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all ${subTab === 'pending' ? 'bg-[rgba(212,175,55,0.1)] text-[#d4af37]' : 'text-gray-500 hover:text-gray-300'}`}>
            <Inbox className="w-4 h-4" /> Actionable Pending
          </button>
          <button onClick={() => { setSubTab("history"); setPage(1); }} className={`flex items-center gap-2 px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all border-l border-white/5 ${subTab === 'history' ? 'bg-[rgba(212,175,55,0.1)] text-[#d4af37]' : 'text-gray-500 hover:text-gray-300'}`}>
            <Archive className="w-4 h-4" /> Historical Ledger
          </button>
       </div>

       <div className="glass-panel p-6 rounded-xl bg-gradient-to-b from-[#020408] to-[#0a0f18] border border-white/5 shadow-2xl">
          <TableToolbar
            search={search}
            setSearch={(v: string) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search staff exceptions..."
            actions={(search || filterRoles.length > 0 || (subTab === 'history' && timeFilter !== "all")) ? (
             <button onClick={() => { setSearch(""); setFilterRoles([]); setTimeFilter("all"); setPage(1); }} className="text-[10px] uppercase font-bold tracking-wider text-red-400 hover:text-red-300 transition-colors px-2 py-1.5 rounded border border-red-400/20 hover:bg-red-400/10 whitespace-nowrap">
               Clear Filters
             </button>
            ) : null}
          >
             <RoleFilterDropdown filterRoles={filterRoles} setFilterRoles={setFilterRoles} roleGroups={ROLE_GROUPS} rolesMap={ROLES} />
             {subTab === 'history' && (
                 <>
                     <TimeFilterDropdown timeFilter={timeFilter} setTimeFilter={(v: string) => { setTimeFilter(v); setPage(1); }} optionsMap={TIME_OPTIONS} />
                     <button onClick={generateHistoryCSV} className="flex items-center gap-2 px-4 py-2 bg-[rgba(212,175,55,0.1)] hover:bg-[rgba(212,175,55,0.15)] text-[#d4af37] text-xs font-bold uppercase tracking-widest border border-[#d4af37]/30 rounded transition-all">
                        <Download className="w-3.5 h-3.5" /> Export Grid
                     </button>
                 </>
             )}
          </TableToolbar>

          <DataTable>
            <TableHeader>
              <tr>
                <TableHeadSortable sortKey="staff_records.legal_name" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>Initiator</TableHeadSortable>
                <TableHeadSortable sortKey="type" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>Leave Type</TableHeadSortable>
                <TableHeadSortable sortKey="start_date" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} className="text-center">Total Frame</TableHeadSortable>
                <TableHeadSortable sortKey="reason" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} className="border-r border-white/5">Submitted Reasoning</TableHeadSortable>
                {subTab === 'history' ? (
                  <TableHeadSortable sortKey="status" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} className="text-center">Status Signature</TableHeadSortable>
                ) : (
                  <TableHead className="text-right">Approval Transaction</TableHead>
                )}
              </tr>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 ? (
                 <TableEmptyState colSpan={5} message="No formal records bound to this physical queue state." />
              ) : pageData.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-bold text-white text-sm">{row.staff_records?.legal_name}</div>
                    <div className="text-[10px] text-[#d4af37]/70 uppercase tracking-wider">{row.staff_records?.role.replace(/_/g, ' ')}</div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 rounded-sm">
                       {row.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono opacity-80 text-xs">
                    <CalendarIcon className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                    {row.start_date} <span className="text-gray-600 mx-1">→</span> {row.end_date}
                  </TableCell>
                  <TableCell className="border-r border-white/5 max-w-xs truncate overflow-hidden">
                    <span className="text-gray-400 text-xs italic">{row.reason || "No explicit reasoning provided"}</span>
                  </TableCell>
                  {subTab === 'history' ? (
                     <TableCell className="text-center">
                         <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm ${row.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                            {row.status}
                         </span>
                         {row.status === 'rejected' && <div className="text-[10px] text-gray-500 mt-1 max-w-xs truncate pl-2">{row.rejection_reason}</div>}
                     </TableCell>
                  ) : (
                     <TableCell className="text-right">
                         <div className="flex items-center justify-end gap-2">
                             <button onClick={() => setRejectModal(row.id)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded transition-all">Reject</button>
                             <button onClick={() => handleApprove(row.id)} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded transition-all">Approve</button>
                         </div>
                     </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
          <TablePagination page={page} setPage={setPage} totalPages={totalPages} totalRecords={filteredData.length} pageSize={pageSize} setPageSize={setPageSize} />
       </div>

       {/* Reject Modal */}
       {rejectModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4" onClick={() => setRejectModal(null)}>
             <div className="glass-panel w-full max-w-md p-6 bg-[#020408] rounded-xl border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.1)]" onClick={e=>e.stopPropagation()}>
                 <h3 className="text-lg font-cinzel font-bold text-red-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                     <XCircle className="w-5 h-5" /> Formal Reject Signature
                 </h3>
                 <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Mandatory formal reasoning for HR audit..." className="w-full h-32 bg-[#010204] border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-red-500/50 resize-none transition-all" />
                 <div className="flex justify-end gap-3 mt-5">
                    <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white">Cancel</button>
                    <button onClick={handleReject} disabled={!rejectReason.trim()} className="px-6 py-2 text-xs font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 rounded disabled:opacity-50 disabled:cursor-not-allowed">Execute Ban</button>
                 </div>
             </div>
          </div>
       )}

      {toast && (
        <div className="fixed bottom-24 right-8 bg-[#020408] border-l-4 border-l-[#d4af37] border border-[rgba(212,175,55,0.2)] text-white px-6 py-4 rounded-lg shadow-xl backdrop-blur-md text-sm font-bold flex items-center gap-3 z-[60]">
          <CheckCircle2 className="w-5 h-5 text-[#d4af37]" /><span>{toast}</span>
        </div>
      )}
    </div>
  );
}

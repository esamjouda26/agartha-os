"use client";

import { useState, useTransition, useMemo } from "react";
import { CheckCircle2, AlertTriangle, Search, Inbox, Archive, Download, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { resolveDiscrepancy } from "../actions";
import { DataTable, TableHeader, TableBody, TableRow, TableCell, TableHead, TableHeadSortable, TableToolbar, TablePagination, TableEmptyState } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/useDataTable";
import { TimeFilterDropdown, RoleFilterDropdown, ROLES, ROLE_GROUPS } from "@/components/ui/data-table/filters";

const TIME_OPTIONS = { all: "All Time", "7d": "Last 7 Days", mtd: "Month to Date", ytd: "Year to Date" };

export default function QueueClient({ initialDiscrepancies }: any) {
  const [subTab, setSubTab] = useState<"pending" | "history">("pending");
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [filterRoles, setFilterRoles] = useState<string[]>([]);
  const [discrepancies, setDiscrepancies] = useState(initialDiscrepancies);
  
  const [actionModal, setActionModal] = useState<{ id: string, shiftId: string, type: 'justify' | 'reject' } | null>(null);
  const [reason, setReason] = useState("");
  
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleAction = () => {
    if (!actionModal || !reason.trim()) return;
    const isApproved = actionModal.type === 'justify';
    
    startTransition(async () => {
      try {
        await resolveDiscrepancy(actionModal.id, actionModal.shiftId, isApproved, reason);
        const st = isApproved ? "justified" : "unjustified";
        const updated = discrepancies.map((d: any) => d.id === actionModal.id ? {...d, status: st, justification_reason: reason} : d);
        setDiscrepancies(updated);
        setActionModal(null);
        setReason("");
        showToast(isApproved ? "Anomaly completely Justified & Math Restored." : "Anomaly Rejected and Archived.");
      } catch(e: any) { showToast(e.message); }
    });
  };

  const filteredData = useMemo(() => {
    let arr = discrepancies.filter((d: any) => subTab === "pending" ? d.status === "unresolved" : d.status !== "unresolved");
    if (filterRoles.length > 0) {
        arr = arr.filter((d: any) => filterRoles.includes(d.shift_schedules?.staff_records?.role));
    }
    if (search.trim()) {
        const s = search.toLowerCase();
        arr = arr.filter((d: any) => 
           (d.shift_schedules?.staff_records?.legal_name || "").toLowerCase().includes(s) || 
           (d.shift_schedules?.staff_records?.employee_id || "").toLowerCase().includes(s)
        );
    }
    if (subTab === "history" && timeFilter !== "all") {
        const now = new Date();
        const tOffset = now.getTimezoneOffset() * 60000;
        let bound = new Date(0);
        if (timeFilter === "7d") bound = new Date(now.getTime() - (7*86400000));
        if (timeFilter === "mtd") bound = new Date(now.getFullYear(), now.getMonth(), 1);
        if (timeFilter === "ytd") bound = new Date(now.getFullYear(), 0, 1);
        const boundIso = new Date(bound.getTime() - tOffset).toISOString().split("T")[0];
        arr = arr.filter((d: any) => (d.shift_schedules?.shift_date) >= boundIso);
    }
    return arr;
  }, [discrepancies, subTab, search, timeFilter, filterRoles]);

  const { page, setPage, totalPages, pageData, pageSize, setPageSize, sortKey, sortOrder, toggleSort } = useDataTable(filteredData, 10, "created_at", "desc");

  const generateHistoryCSV = () => {
    if (filteredData.length === 0) return showToast("No history to export.");
    let csv = "Employee,Role,Anomaly Date,Exception Type,Recorded Status,Resolution Reason\\n";
    filteredData.forEach((d: any) => {
        const legal = d.shift_schedules?.staff_records?.legal_name || "Unknown";
        const role = d.shift_schedules?.staff_records?.role || "Unknown";
        csv += `"${legal}","${role}","${d.shift_schedules?.shift_date}","${d.type}","${d.status}","${d.justification_reason || ''}"\\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const ink = document.createElement("a");
    ink.href = URL.createObjectURL(blob);
    ink.download = `Exception_History_Export.csv`;
    ink.click();
  };

  return (
    <div className={`space-y-6 ${isPending ? 'opacity-70 pointer-events-none' : ''} transition-opacity`}>
       <div className="flex bg-[#020408] border border-[rgba(212,175,55,0.15)] rounded-lg w-fit overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.6)]">
          <button onClick={() => { setSubTab("pending"); setPage(1); }} className={`flex items-center gap-2 px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all ${subTab === 'pending' ? 'bg-[rgba(212,175,55,0.1)] text-[#d4af37]' : 'text-gray-500 hover:text-gray-300'}`}>
            <Inbox className="w-4 h-4" /> Unresolved Alerts
          </button>
          <button onClick={() => { setSubTab("history"); setPage(1); }} className={`flex items-center gap-2 px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all border-l border-white/5 ${subTab === 'history' ? 'bg-[rgba(212,175,55,0.1)] text-[#d4af37]' : 'text-gray-500 hover:text-gray-300'}`}>
            <Archive className="w-4 h-4" /> Finalized Logs
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

          <DataTable minWidth="1000px">
            <TableHeader>
              <tr>
                <TableHeadSortable sortKey="shift_schedules.staff_records.legal_name" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>Identified Actor</TableHeadSortable>
                <TableHeadSortable sortKey="shift_schedules.shift_date" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} className="text-center">System Date</TableHeadSortable>
                <TableHeadSortable sortKey="type" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} className="text-center text-orange-400">Exception Flag</TableHeadSortable>
                <TableHead className="text-center text-blue-400 border-r border-white/5">Expected vs Recorded</TableHead>
                {subTab === 'history' ? (
                  <TableHeadSortable sortKey="status" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} className="text-center">Resolution Signature</TableHeadSortable>
                ) : (
                  <TableHead className="text-right">Override Actions</TableHead>
                )}
              </tr>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 ? (
                 <TableEmptyState colSpan={5} message="Zero active anomalies detected in current physical array." />
              ) : pageData.map((row: any) => {
                 const stf = row.shift_schedules?.staff_records;
                 const shf = row.shift_schedules;
                 return (
                 <TableRow key={row.id}>
                   <TableCell>
                      <div className="font-bold text-white text-sm">{stf?.legal_name || 'System Exception'}</div>
                      <div className="text-[10px] text-[#d4af37]/70 uppercase tracking-wider">{stf?.role?.replace(/_/g, ' ') || 'N/A'}</div>
                   </TableCell>
                   <TableCell className="text-center font-mono opacity-80 text-xs">
                       {shf?.shift_date}
                   </TableCell>
                   <TableCell className="text-center">
                      <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded border-orange-500/30 text-orange-400 bg-orange-500/5">
                         {row.type.replace(/_/g, ' ')}
                      </span>
                   </TableCell>
                   <TableCell className="text-center font-mono text-[10px] border-r border-white/5">
                      <div className="text-blue-300">SCHED: {shf?.expected_start_time?.substring(0,5) || 'OFF'} - {shf?.expected_end_time?.substring(0,5) || 'OFF'}</div>
                      <div className="text-emerald-400 mt-1">LOG: {shf?.clock_in ? new Date(shf.clock_in).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit', timeZone: 'Asia/Kuala_Lumpur'}) : 'NULL'} - {shf?.clock_out ? new Date(shf.clock_out).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit', timeZone: 'Asia/Kuala_Lumpur'}) : 'NULL'}</div>
                   </TableCell>
                   {subTab === 'history' ? (
                       <TableCell className="text-center">
                           <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm border ${row.status === 'justified' ? 'border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-500/5' : 'border-red-500/30 text-red-500 bg-red-500/5'}`}>
                              {row.status}
                           </span>
                           <div className="text-[10px] text-gray-500 mt-1.5 max-w-[200px] truncate mx-auto italic">"{row.justification_reason}"</div>
                       </TableCell>
                   ) : (
                       <TableCell className="text-right">
                           <div className="flex items-center justify-end gap-2">
                               <button onClick={() => setActionModal({id: row.id, shiftId: row.shift_schedule_id, type: 'reject'})} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded transition-all">Reject / Penalize</button>
                               <button onClick={() => setActionModal({id: row.id, shiftId: row.shift_schedule_id, type: 'justify'})} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 rounded transition-all">Justify Math</button>
                           </div>
                       </TableCell>
                   )}
                 </TableRow>
              )})}
            </TableBody>
          </DataTable>

          <TablePagination page={page} setPage={setPage} totalPages={totalPages} totalRecords={filteredData.length} pageSize={pageSize} setPageSize={setPageSize} />
       </div>

       {/* Resolution Modal */}
       {actionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4" onClick={() => setActionModal(null)}>
             <div className="glass-panel w-full max-w-md p-6 bg-[#020408] rounded-xl border shadow-[0_0_40px_rgba(0,0,0,0.8)]" style={{ borderColor: actionModal.type === 'justify' ? 'rgba(212,175,55,0.3)' : 'rgba(239,68,68,0.3)' }} onClick={e=>e.stopPropagation()}>
                 <h3 className={`text-lg font-cinzel font-bold uppercase tracking-widest flex items-center gap-2 mb-4 ${actionModal.type==='justify'?'text-[#d4af37]':'text-red-400'}`}>
                     {actionModal.type === 'justify' ? <Clock className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
                     {actionModal.type === 'justify' ? 'Override & Restore Parity' : 'Enforce Absence Penalty'}
                 </h3>
                 <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Formal Action Reasoning</label>
                    <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Attach reason/ticket # to the permanent log..." className="w-full h-28 bg-[#010204] border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-[#d4af37]/50 resize-none transition-all" />
                 </div>
                 <div className="flex justify-end gap-3 mt-5">
                    <button onClick={() => setActionModal(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all">Abort</button>
                    <button onClick={handleAction} disabled={!reason.trim()} className={`px-6 py-2 text-xs font-bold uppercase tracking-widest border rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all ${actionModal.type === 'justify' ? 'bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37]/20 border-[#d4af37]/40' : 'bg-red-500/10 text-red-500 border-red-500/40 hover:bg-red-500/20'}`}>
                        Execute Stamp
                    </button>
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

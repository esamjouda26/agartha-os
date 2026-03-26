"use client";

import { useState, useTransition, useMemo } from "react";
import { FileText, CheckCircle2, XCircle, Search, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { getLedger } from "../actions";
import { DataTable, TableHeader, TableBody, TableRow, TableCell, TableHead, TableHeadSortable, TableToolbar, TablePagination, TableEmptyState } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/useDataTable";
import { TimeFilterDropdown, RoleFilterDropdown, ROLES, ROLE_GROUPS } from "@/components/ui/data-table/filters";

const TIME_OPTIONS = { today: "Today", "7d": "Last 7 Days", mtd: "Month to Date", ytd: "Year to Date", custom: "Custom Range" };

export default function LedgerClient({ initialLedger, initialDiscrepancies }: any) {
  const [timeFilter, setTimeFilter] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [search, setSearch] = useState("");
  const [filterRoles, setFilterRoles] = useState<string[]>([]);
  
  const [ledgerData, setLedgerData] = useState(initialLedger);
  const [discrepanciesData, setDiscrepanciesData] = useState(initialDiscrepancies);
  
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const calculateExpectedHours = (startFn: string, endFn: string) => {
    if (!startFn || !endFn) return 0;
    const s = new Date(`1970-01-01T${startFn}Z`);
    let e = new Date(`1970-01-01T${endFn}Z`);
    if (e < s) e = new Date(`1970-01-02T${endFn}Z`); // Handle native 24-hr midnight crossover loops
    return (e.getTime() - s.getTime()) / 3600000;
  };

  const ledgerAggregates = useMemo(() => {
    const agg: Record<string, any> = {};
    
    const today = new Date();
    const tOffset = today.getTimezoneOffset() * 60000;
    const todayStr = new Date(today.getTime() - tOffset).toISOString().split("T")[0];
    
    ledgerData.forEach((row: any) => {
      const id = row.staff_record_id;
      if (!agg[id]) {
        agg[id] = { staff: row.staff_records, sched: 0, actual: 0, justified: 0, late: 0, early: 0, absent: 0 };
      }
      agg[id].sched += calculateExpectedHours(row.expected_start_time, row.expected_end_time);
      agg[id].actual += Number(row.actual_hours || 0);
      agg[id].justified += Number(row.justified_hours || 0);

      // Phase 5: Client-Side Implicit Absence Detection
      // Bypass the 03:00 AM Cron sweeper lag by natively counting historical blank cells directly
      if (row.shift_date < todayStr && row.shift_dictionary_id && !row.linked_leave_id) {
         if (!row.clock_in && !row.clock_out) {
             agg[id].absent += 1;
         }
      }
    });

    const loadedRowIds = new Set(ledgerData.map((r: any) => r.id));
    discrepanciesData.forEach((disc: any) => {
       if (loadedRowIds.has(disc.shift_schedule_id)) {
           const id = disc.shift_schedules?.staff_records?.id;
           if (agg[id]) {
               if (disc.type === 'late_arrival') agg[id].late += 1;
               if (disc.type === 'early_departure') agg[id].early += 1;
               // Structural Note: 'absent' / 'missing_checkout' bypass DB triggers here to avoid double-counting the implicit logic above
           }
       }
    });

    let mapped = Object.values(agg).map(v => {
       const unjust = Math.max(0, v.sched - (v.actual + v.justified));
       const rate = v.sched > 0 ? ((v.actual + v.justified) / v.sched) * 100 : 100;
       return { ...v, unjust, rate, status: rate >= 100 ? "Compliant" : "Non-Compliant" };
    });

    if (search.trim()) {
        const s = search.toLowerCase();
        mapped = mapped.filter(r => (r.staff.legal_name || "").toLowerCase().includes(s) || (r.staff.employee_id || "").toLowerCase().includes(s));
    }
    if (filterRoles.length > 0) {
        mapped = mapped.filter(r => filterRoles.includes(r.staff.role));
    }
    
    return mapped;
  }, [ledgerData, discrepanciesData, search, filterRoles]);

  const { page, setPage, totalPages, pageData, pageSize, setPageSize, sortKey, sortOrder, toggleSort } = useDataTable(ledgerAggregates, 10, "staff.legal_name", "asc");

  const applyTimeFilter = (filterParam: string) => {
    setTimeFilter(filterParam);
    setPage(1);
    if (filterParam === "custom") return;

    const today = new Date();
    const tOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = new Date(today.getTime() - tOffset).toISOString().split("T")[0];
    
    let startStr = localISOTime;
    let endStr = localISOTime;

    const d = new Date(today);
    if (filterParam === "7d") {
      d.setDate(d.getDate() - 7);
      startStr = new Date(d.getTime() - tOffset).toISOString().split("T")[0];
    } else if (filterParam === "mtd") {
      d.setDate(1);
      startStr = new Date(d.getTime() - tOffset).toISOString().split("T")[0];
    } else if (filterParam === "ytd") {
      d.setMonth(0, 1);
      startStr = new Date(d.getTime() - tOffset).toISOString().split("T")[0];
    }

    startTransition(async () => {
       const res = await getLedger(startStr, endStr);
       setLedgerData(res);
       showToast(`Ledger synchronized: ${startStr} to ${endStr}`);
    });
  };

  const applyCustomTimeFilter = () => {
    if (!customStart || !customEnd) return;
    startTransition(async () => {
       const res = await getLedger(customStart, customEnd);
       setLedgerData(res);
       showToast(`Ledger synchronized: ${customStart} to ${customEnd}`);
    });
  };

  const generateAndDownloadCSV = (staffRecord: any) => {
    const dates = ledgerData.filter((r: any) => r.staff_record_id === staffRecord.id).sort((a: any, b: any) => a.shift_date.localeCompare(b.shift_date));
    if (dates.length === 0) { showToast("No shift data available to export."); return; }

    let csvContent = "Operational Date,Scheduled Expectation,Clock In,Clock Out,Actual Net (h),Justified Override (h),Formal Leave\\n";
    dates.forEach((r: any) => {
        const shiftStr = r.shift_dictionary_id ? `${r.expected_start_time?.substring(0,5)} - ${r.expected_end_time?.substring(0,5)}` : 'OFF';
        const inStr = r.clock_in ? new Date(r.clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Kuala_Lumpur'}) : 'EXC: NULL';
        const outStr = r.clock_out ? new Date(r.clock_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Kuala_Lumpur'}) : 'EXC: NULL';
        const actualH = Number(r.actual_hours || 0).toFixed(1);
        const justH = Number(r.justified_hours || 0).toFixed(1);
        const leaveStr = r.linked_leave_id ? r.leave_requests?.type : "--";
        csvContent += `"${r.shift_date}","${shiftStr}","${inStr}","${outStr}","${actualH}","${justH}","${leaveStr}"\\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Compliance_Report_${staffRecord.legal_name?.replace(/\\s/g,'_') || staffRecord.employee_id}.csv`;
    link.click();
    showToast("CSV Downloaded Successfully.");
  };

  return (
    <div className={`space-y-6 ${isPending ? 'opacity-70 pointer-events-none' : ''} transition-opacity duration-300`}>
      <div className="flex items-center gap-3 px-2">
         <FileText className="w-5 h-5 text-[#d4af37]" />
         <h2 className="text-sm font-bold text-white uppercase tracking-widest">Master Compliance Matrix</h2>
      </div>
      
      <div className="glass-panel rounded-xl flex flex-col overflow-hidden min-h-[520px] border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
        <TableToolbar 
           search={search} 
           setSearch={(v: string) => { setSearch(v); setPage(1); }} 
           searchPlaceholder="Search employee..."
           actions={(search || timeFilter !== "today" || filterRoles.length > 0) ? (
             <button onClick={() => { setSearch(""); setTimeFilter("today"); applyTimeFilter("today"); setFilterRoles([]); }} className="text-[10px] uppercase font-bold tracking-wider text-red-400 hover:text-red-300 transition-colors px-2 py-1.5 rounded border border-red-400/20 hover:bg-red-400/10 whitespace-nowrap">
               Reset Scope
             </button>
           ) : null}
        >
           <RoleFilterDropdown filterRoles={filterRoles} setFilterRoles={setFilterRoles} roleGroups={ROLE_GROUPS} rolesMap={ROLES} />
           <TimeFilterDropdown timeFilter={timeFilter} setTimeFilter={applyTimeFilter} optionsMap={TIME_OPTIONS} />
           {timeFilter === "custom" && (
              <div className="flex items-center gap-2">
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="bg-[#020408] border border-white/20 px-3 py-1.5 text-xs rounded text-gray-300 focus:outline-none focus:border-[#d4af37]/50" style={{colorScheme: 'dark'}} />
                <span className="text-gray-500 text-xs uppercase font-bold">To</span>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="bg-[#020408] border border-white/20 px-3 py-1.5 text-xs rounded text-gray-300 focus:outline-none focus:border-[#d4af37]/50" style={{colorScheme: 'dark'}} />
                <button onClick={applyCustomTimeFilter} className="px-4 py-1.5 bg-gradient-to-r from-[#202530] to-[#151a25] hover:from-[#303540] border border-white/10 text-xs font-bold tracking-widest rounded transition-all">Execute</button>
              </div>
           )}
        </TableToolbar>

        <DataTable minWidth="1300px">
          <TableHeader>
            <tr>
              <TableHeadSortable sortKey="staff.legal_name" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} className="sticky left-0 z-20 bg-[#0a0f18]/80 backdrop-blur-md">Employee Identification</TableHeadSortable>
              <TableHeadSortable sortKey="sched" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} className="text-center text-blue-400/80">Scheduled</TableHeadSortable>
              <TableHeadSortable sortKey="actual" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} className="text-center text-emerald-400/80">Actual Realized</TableHeadSortable>
              <TableHeadSortable sortKey="justified" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} className="text-center text-fuchsia-400/80">Justified Var</TableHeadSortable>
              <TableHeadSortable sortKey="unjust" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} className="text-center text-red-400/80">Unjust Dlt</TableHeadSortable>
              <TableHeadSortable sortKey="late" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} className="text-center text-orange-400/80">Late Arrv</TableHeadSortable>
              <TableHeadSortable sortKey="early" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} className="text-center text-orange-400/80">Early Dep</TableHeadSortable>
              <TableHeadSortable sortKey="absent" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} className="text-center text-red-500/80">Total Abs</TableHeadSortable>
              <TableHeadSortable sortKey="rate" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} className="text-center text-[#d4af37]/80">Comp Rate</TableHeadSortable>
              <TableHeadSortable sortKey="status" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort} className="text-center">Formal Status</TableHeadSortable>
              <TableHead className="text-right">Ledger Export</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableEmptyState colSpan={11} message="No shift ledger records discovered matching the active geometry." />
            ) : pageData.map((row: any) => (
              <TableRow key={row.staff.id}>
                <TableCell className="sticky left-0 z-10 bg-[#010204]/90 backdrop-blur-sm border-r border-white/5 group-hover:bg-[#0a0f18]/90">
                  <div className="text-sm text-white font-bold tracking-wide">{row.staff.legal_name || row.staff.employee_id}</div>
                  <div className="text-[10px] text-[#d4af37]/70 uppercase tracking-widest mt-0.5">{row.staff.role.replace(/_/g, " ")}</div>
                </TableCell>
                <TableCell className="text-center font-mono opacity-80">{row.sched.toFixed(1)}h</TableCell>
                <TableCell className="text-center font-mono text-emerald-400 font-bold">{row.actual.toFixed(1)}h</TableCell>
                <TableCell className="text-center font-mono text-fuchsia-400">{row.justified.toFixed(1)}h</TableCell>
                <TableCell className="text-center font-mono text-red-400">{row.unjust.toFixed(1)}h</TableCell>
                <TableCell className="text-center font-mono text-orange-400/80">{row.late}</TableCell>
                <TableCell className="text-center font-mono text-orange-400/80">{row.early}</TableCell>
                <TableCell className="text-center font-mono text-red-500 font-bold">{row.absent}</TableCell>
                <TableCell className="text-center font-mono">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest border shadow-sm ${row.rate >= 100 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {row.rate.toFixed(0)}%
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {row.status === "Compliant" ? <CheckCircle2 className="w-5 h-5 text-emerald-500/80 mx-auto" /> : <XCircle className="w-5 h-5 text-red-500/80 mx-auto" />}
                </TableCell>
                <TableCell className="text-right">
                  <button onClick={() => generateAndDownloadCSV(row.staff)} className="px-4 py-1.5 text-[10px] tracking-widest uppercase font-bold text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/10 hover:border-[#d4af37]/60 rounded transition-all whitespace-nowrap">
                    ↓ Export CSV
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
        
        <TablePagination page={page} setPage={setPage} totalPages={totalPages} totalRecords={ledgerAggregates.length} pageSize={pageSize} setPageSize={setPageSize} />
      </div>

      {toast && (
        <div className="fixed bottom-24 right-8 bg-[#020408] border-l-4 border-l-[#d4af37] border border-[rgba(212,175,55,0.2)] text-white px-6 py-4 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl text-sm font-bold flex items-center gap-3 z-[60] animate-in slide-in-from-right-4">
          <CheckCircle2 className="w-5 h-5 text-[#d4af37]" /><span>{toast}</span>
        </div>
      )}
    </div>
  );
}

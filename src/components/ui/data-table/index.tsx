import { Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, Inbox } from "lucide-react";

export function DataTable({ children, minWidth = "1000px" }: { children: React.ReactNode, minWidth?: string }) {
  return (
    <div className="overflow-x-auto w-full rounded-md border border-white/5 bg-[#010204]">
      <table className={`w-full text-left text-sm whitespace-nowrap`} style={{ minWidth }}>
         {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-[#010204]/80 backdrop-blur-md sticky top-0 z-10 border-b border-white/5 shadow-sm">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-white/5">{children}</tbody>;
}

export function TableRow({ children, className = "", ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`hover:bg-white/[0.02] transition-colors relative group border-b border-white/5 last:border-0 ${className}`} {...props}>{children}</tr>;
}

export function TableCell({ children, className = "", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-6 py-4 ${className}`} {...props}>{children}</td>;
}

export function TableHead({ children, className = "", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`px-6 py-3.5 font-semibold text-gray-400 ${className}`} {...props}>{children}</th>;
}

export function TableHeadSortable({ children, sortKey, currentSortKey, sortOrder, onSort, className = "", ...props }: any) {
  const isActive = currentSortKey === sortKey;
  return (
    <th 
      className={`px-6 py-3.5 font-semibold text-gray-400 cursor-pointer hover:bg-white/[0.04] hover:text-white transition-colors select-none group ${className}`} 
      onClick={() => onSort(sortKey)}
      {...props}
    >
      <div className="inline-flex items-center gap-2">
        {children}
        <span className="flex-shrink-0">
          {isActive ? (
            sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-[#d4af37]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#d4af37]" />
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-500 opacity-0 group-hover:opacity-50 transition-all" />
          )}
        </span>
      </div>
    </th>
  );
}

export function TableToolbar({ search, setSearch, searchPlaceholder = "Search...", actions, children }: any) {
  return (
    <div className="flex flex-col md:flex-row gap-5 justify-between md:items-center px-6 pt-6 pb-5 border-b border-white/5">
       <div className="flex items-center gap-4 w-full md:w-auto">
         <div className="relative w-full md:w-[320px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#d4af37] transition-colors" />
            <input 
              type="text" 
              placeholder={searchPlaceholder} 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-[#020408]/50 border border-white/10 rounded-lg text-sm text-white pl-9 pr-4 py-2 focus:outline-none focus:border-[#d4af37]/40 focus:bg-[#020408] focus:ring-1 focus:ring-[#d4af37]/20 transition-all placeholder:text-gray-600 hover:border-white/20" 
            />
         </div>
         {actions && <div className="flex items-center gap-2 border-l border-white/10 pl-4">{actions}</div>}
       </div>
       <div className="flex flex-wrap items-center gap-3">
          {children}
       </div>
    </div>
  );
}

export function TableEmptyState({ colSpan, message = "No records match your current filters.", action }: { colSpan: number, message?: string, action?: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
             <Inbox className="w-5 h-5 text-gray-500" />
          </div>
          <h3 className="text-sm font-bold text-gray-300 mb-1">No Data Available</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">{message}</p>
          {action && <div>{action}</div>}
        </div>
      </td>
    </tr>
  );
}

export function TablePagination({ page, totalPages, totalRecords, pageSize, setPage, setPageSize }: any) {
  const getVisiblePages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, '...', totalPages - 1, totalPages];
    if (page >= totalPages - 2) return [1, 2, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-white/5 bg-transparent rounded-b-lg gap-4">
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-500 font-mono tracking-wide">
          {totalRecords > 0 ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalRecords)} of ${totalRecords}` : "0 records"}
        </span>
        {setPageSize && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Rows per page:</span>
            <select 
              value={pageSize} 
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="bg-[#020408] border border-white/10 rounded text-xs text-gray-400 py-1 px-2 focus:outline-none focus:border-[#d4af37]/50 cursor-pointer hover:border-white/20 transition-colors"
            >
              {[10, 20, 50, 100].map(sz => <option key={sz} value={sz}>{sz}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1.5 text-gray-500 hover:text-[#d4af37] disabled:opacity-30 transition-colors hover:bg-white/5 rounded">
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        {getVisiblePages().map((p, idx) => (
           p === '...' ? (
             <span key={`ellipsis-${idx}`} className="px-1 text-gray-600 text-xs">...</span>
           ) : (
             <button 
               key={p} 
               onClick={() => setPage(p as number)} 
               className={`w-7 h-7 flex items-center justify-center text-xs rounded-md transition-all ${p === page ? "bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 ring-1 ring-[#d4af37]/20 font-bold shadow-[0_0_10px_rgba(212,175,55,0.05)]" : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
             >
               {p}
             </button>
           )
        ))}

        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="p-1.5 text-gray-500 hover:text-[#d4af37] disabled:opacity-30 transition-colors hover:bg-white/5 rounded">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

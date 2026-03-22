"use client";
import { cn } from "@/lib/utils";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, type ReactNode } from "react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

interface BulkAction {
  label: string;
  onClick: (selectedIds: string[]) => void;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  onRowClick?: (row: Record<string, unknown>) => void;
  bulkActions?: BulkAction[];
  className?: string;
}

export function DataTable({
  columns,
  data,
  searchable = false,
  searchPlaceholder = "Search...",
  pageSize = 10,
  onRowClick,
  bulkActions,
  className,
}: DataTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const hasBulk = bulkActions && bulkActions.length > 0;

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => String(row[col.key] ?? "").toLowerCase().includes(q))
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((r) => String(r.id ?? paginated.indexOf(r)))));
    }
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className={cn(
      "rounded-lg border border-border bg-card/60 backdrop-blur-xl overflow-hidden",
      className
    )}>
      {/* toolbar */}
      {(searchable || (hasBulk && selected.size > 0)) && (
        <div className="flex items-center gap-3 p-3 border-b border-border">
          {searchable && (
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className={cn(
                  "w-full rounded-lg border border-border bg-card/40 py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-1 focus:ring-[#d4af37]/50 focus:border-[#d4af37]/50 transition-colors"
                )}
              />
            </div>
          )}
          {hasBulk && selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{selected.size} selected</span>
              {bulkActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => action.onClick(Array.from(selected))}
                  className="px-3 py-1 rounded text-[10px] uppercase tracking-wider font-bold bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-card/80">
              {hasBulk && (
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selected.size === paginated.length}
                    onChange={toggleAll}
                    className="rounded border-border accent-[#d4af37]"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "text-left p-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium",
                    col.sortable && "cursor-pointer select-none hover:text-foreground"
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === "asc"
                        ? <ChevronUp className="h-3 w-3" />
                        : <ChevronDown className="h-3 w-3" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => {
              const rowId = String(row.id ?? i);
              return (
                <tr
                  key={rowId}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-border/50 transition-colors",
                    onRowClick && "cursor-pointer",
                    "hover:bg-[#d4af37]/5"
                  )}
                >
                  {hasBulk && (
                    <td className="w-10 p-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(rowId)}
                        onChange={() => toggleRow(rowId)}
                        className="rounded border-border accent-[#d4af37]"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="p-3 text-foreground">
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={columns.length + (hasBulk ? 1 : 0)} className="p-8 text-center text-muted-foreground text-xs">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-border">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {page * pageSize + 1}-{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground px-2">
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from "react";

export type SortOrder = "asc" | "desc" | null;

export function useDataTable<T extends Record<string, any>>(filteredData: T[], initialPageSize = 10, initialSortKey: string | null = null, initialSortOrder: SortOrder = "asc") {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === "asc") setSortOrder("desc");
      else if (sortOrder === "desc") { setSortOrder(null); setSortKey(null); }
      else setSortOrder("asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const processedData = useMemo(() => {
    if (!sortKey || !sortOrder) return filteredData;
    return [...filteredData].sort((a, b) => {
      // Support nested dot notation parsing (e.g., 'staff.legal_name')
      const aVal = sortKey.split('.').reduce((o, i) => (o ? o[i] : null), a);
      const bVal = sortKey.split('.').reduce((o, i) => (o ? o[i] : null), b);
      
      if (aVal === bVal) return 0;
      if (aVal == null) return sortOrder === "asc" ? 1 : -1;
      if (bVal == null) return sortOrder === "asc" ? -1 : 1;
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      const comparison = !isNaN(Number(aVal)) && !isNaN(Number(bVal)) 
         ? Number(aVal) - Number(bVal)
         : aStr.localeCompare(bStr);
         
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(processedData.length / pageSize));
  
  // Safe bounds guard (if typing search reduces array length below current page)
  const safePage = Math.min(page, totalPages);
  if (page !== safePage && safePage >= 1) {
      setTimeout(() => setPage(safePage), 0);
  }

  const pageData = processedData.slice((safePage - 1) * pageSize, safePage * pageSize);
  
  return { 
     page: safePage, 
     setPage, 
     totalPages, 
     pageData,
     pageSize,
     setPageSize,
     sortKey,
     sortOrder,
     toggleSort
  };
}

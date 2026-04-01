"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHeadSortable, TableHeader, TablePagination, TableRow, TableToolbar, TableEmptyState } from "./data-table-suite";
import { Badge } from "../ui/badge";
import { useDataTable } from "@/hooks/useDataTable";

const mockAuditLogs = [
  { id: "LOG-01", action: "User Login", user: "Admin", timestamp: "2026-04-01 08:30:12", status: "success" },
  { id: "LOG-02", action: "Failed Authentication", user: "Unknown", timestamp: "2026-04-01 08:45:00", status: "destructive" },
  { id: "LOG-03", action: "Configuration Update", user: "System", timestamp: "2026-04-01 09:12:44", status: "warning" },
  { id: "LOG-04", action: "Record Deletion", user: "SubAdmin", timestamp: "2026-04-01 10:05:22", status: "success" },
  { id: "LOG-05", action: "Export Report", user: "Analyst", timestamp: "2026-04-01 11:15:33", status: "info" },
  { id: "LOG-06", action: "System Reboot", user: "System", timestamp: "2026-04-01 12:00:00", status: "warning" },
  { id: "LOG-07", action: "User Logout", user: "SubAdmin", timestamp: "2026-04-01 13:30:11", status: "success" },
];

export function DomainAuditTable() {
  const [search, setSearch] = useState("");

  const filteredLogs = mockAuditLogs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) || 
    log.user.toLowerCase().includes(search.toLowerCase()) ||
    log.id.toLowerCase().includes(search.toLowerCase())
  );

  const {
    page,
    totalPages,
    pageData,
    pageSize,
    setPage,
    setPageSize,
    sortKey,
    sortOrder,
    toggleSort
  } = useDataTable(filteredLogs, 5, "timestamp", "desc");

  return (
    <div className="w-full space-y-4">
      <TableToolbar search={search} setSearch={setSearch} searchPlaceholder="Search audit logs..." />
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeadSortable sortKey="id" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>Log ID</TableHeadSortable>
            <TableHeadSortable sortKey="action" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>Action Taken</TableHeadSortable>
            <TableHeadSortable sortKey="user" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>User</TableHeadSortable>
            <TableHeadSortable sortKey="timestamp" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>Timestamp</TableHeadSortable>
            <TableHeadSortable sortKey="status" currentSortKey={sortKey} sortOrder={sortOrder} onSort={toggleSort}>Status</TableHeadSortable>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageData.length > 0 ? pageData.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-mono text-xs">{log.id}</TableCell>
              <TableCell className="font-semibold">{log.action}</TableCell>
              <TableCell>{log.user}</TableCell>
              <TableCell className="text-gray-500 dark:text-gray-400 font-mono text-xs">{log.timestamp}</TableCell>
              <TableCell>
                <Badge variant={log.status as any}>{log.status === "success" ? "Valid" : log.status === "destructive" ? "Failed" : log.status}</Badge>
              </TableCell>
            </TableRow>
          )) : (
            <TableEmptyState colSpan={5} message="No audit logs matched your search terms." />
          )}
        </TableBody>
      </Table>
      
      {totalPages > 0 && (
        <TablePagination 
          page={page} 
          totalPages={totalPages} 
          totalRecords={filteredLogs.length} 
          pageSize={pageSize} 
          setPage={setPage} 
          setPageSize={setPageSize} 
        />
      )}
    </div>
  );
}

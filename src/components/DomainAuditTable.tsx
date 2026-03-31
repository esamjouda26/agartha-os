"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchDomainAuditLogs } from "@/app/management/actions";

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  performed_by: string | null;
  performer_role?: string;
  ip_address: string | null;
  created_at: string;
}

interface DomainAuditTableProps {
  /** Hardcoded entity types this portal instance is allowed to view */
  entityTypes: string[];
  title?: string;
}

export default function DomainAuditTable({ entityTypes, title = "Audit Trail" }: DomainAuditTableProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 25;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const result = await fetchDomainAuditLogs(entityTypes, page, pageSize);
    setEntries(result.data as unknown as AuditEntry[]);
    setTotal(result.total);
    setLoading(false);
  }, [entityTypes, page]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const totalPages = Math.ceil(total / pageSize);

  const actionColor = (action: string) => {
    if (action.includes("create") || action.includes("generate")) return "success" as const;
    if (action.includes("delete") || action.includes("revoke")) return "destructive" as const;
    return "outline" as const;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
          <Badge variant="outline" className="text-[10px]">{total} entries</Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-12">No audit entries found for your access level.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Time</th>
                    <th className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Action</th>
                    <th className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Entity Type (ID)</th>
                    <th className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Operator / IP</th>
                    <th className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Delta Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/30 transition">
                      <td className="py-2.5 px-3 text-muted-foreground text-xs whitespace-nowrap font-mono">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={actionColor(entry.action)}>{entry.action}</Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-foreground font-medium">{entry.entity_type}</span>
                        {entry.entity_id && (
                          <div className="text-muted-foreground text-[10px] font-mono mt-0.5">{entry.entity_id}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 flex flex-col items-start justify-center">
                        <span className="text-foreground text-xs font-semibold">{entry.performer_role ? entry.performer_role.replace(/_/g, ' ') : (entry.performed_by ? entry.performed_by.slice(0, 8) : "System")}</span>
                        {entry.ip_address && (
                          <span className="text-muted-foreground text-[10px] font-mono mt-0.5">{entry.ip_address}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground max-w-sm truncate whitespace-normal">
                        {entry.new_values && Object.keys(entry.new_values).length > 0 ? (
                           <div className="font-mono text-[10px] text-gray-400 bg-muted/20 px-2 py-1.5 rounded">{JSON.stringify(entry.new_values)}</div>
                        ) : entry.old_values ? (
                           <div className="font-mono text-[8px] text-red-500/80 bg-red-500/10 px-2 py-1.5 rounded">DEL: {JSON.stringify(entry.old_values)}</div>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>←</Button>
                  <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>→</Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DomainAuditTable from "@/components/DomainAuditTable";
import { fetchIncidentsAction } from "../actions";

interface Incident {
  id: string;
  category: string;
  status: string;
  description: string;
  created_at: string;
  zones: { name: string } | null;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchIncidentsAction({ page, pageSize });
    setIncidents(result.data as unknown as Incident[]);
    setTotal(result.total);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);
  const totalPages = Math.ceil(total / pageSize);

  const statusColor = (s: string) => {
    switch (s) {
      case "resolved": case "closed": return "success" as const;
      case "open": return "destructive" as const;
      case "investigating": return "gold" as const;
      default: return "outline" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Incident Ledger</h1>
          <p className="text-muted-foreground text-sm mt-1">Safety, security, and operational incident tracking</p>
        </div>
        <Badge variant="outline">{total} incidents</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : incidents.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">No incidents reported.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Time", "Category", "Zone", "Description", "Status"].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="border-b border-border/50 hover:bg-muted/20 transition">
                      <td className="py-3 px-4 text-xs text-muted-foreground font-mono whitespace-nowrap">{new Date(inc.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4"><Badge variant="outline">{inc.category}</Badge></td>
                      <td className="py-3 px-4 text-muted-foreground">{inc.zones?.name ?? "—"}</td>
                      <td className="py-3 px-4 text-foreground max-w-xs truncate">{inc.description}</td>
                      <td className="py-3 px-4"><Badge variant={statusColor(inc.status)}>{inc.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</Button>
                <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DomainAuditTable entityTypes={["incident"]} title="Incident Audit Trail" />
    </div>
  );
}

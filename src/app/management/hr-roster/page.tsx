"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchShiftsAction } from "../actions";

interface Shift {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  staff_records: { legal_name: string; role: string } | null;
}

export default function HrRosterPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchShiftsAction({ page, pageSize });
    setShifts(result.data as unknown as Shift[]);
    setTotal(result.total);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);
  const totalPages = Math.ceil(total / pageSize);

  const statusBadge = (s: string) => {
    switch (s) {
      case "completed": return "success" as const;
      case "absent": case "cancelled": return "destructive" as const;
      case "checked_in": return "gold" as const;
      default: return "outline" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">HR Roster & Shifts</h1>
          <p className="text-muted-foreground text-sm mt-1">Staff shift scheduling and attendance</p>
        </div>
        <Badge variant="outline">{total} shifts</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : shifts.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">No shifts scheduled.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Staff", "Role", "Date", "Start", "End", "Status", "Notes"].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((s) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20 transition">
                      <td className="py-3 px-4 font-medium text-foreground">{s.staff_records?.legal_name ?? "—"}</td>
                      <td className="py-3 px-4"><Badge variant="outline">{s.staff_records?.role ?? "—"}</Badge></td>
                      <td className="py-3 px-4 text-muted-foreground">{s.shift_date}</td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.start_time}</td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.end_time}</td>
                      <td className="py-3 px-4"><Badge variant={statusBadge(s.status)}>{s.status}</Badge></td>
                      <td className="py-3 px-4 text-muted-foreground text-xs max-w-xs truncate">{s.notes ?? "—"}</td>
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
    </div>
  );
}

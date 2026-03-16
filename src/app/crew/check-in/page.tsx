"use client";

import { useState, useOptimistic, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { scanTicketAction, type ScanResult } from "../actions";

type ScanState = { status: "idle" } | { status: "scanning" } | { status: "success"; data: ScanResult } | { status: "error"; message: string };

export default function TicketScannerPage() {
  const [qrInput, setQrInput] = useState("");
  const [scanHistory, setScanHistory] = useState<Array<{ result: ScanResult | null; error?: string; timestamp: Date }>>([]);
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  // Optimistic UI: immediately shows "scanning" state
  const [optimisticState, setOptimisticState] = useOptimistic(
    scanState,
    (_current, _newState: ScanState) => _newState
  );

  async function handleScan() {
    if (!qrInput.trim()) return;

    // Optimistic: show scanning immediately
    setOptimisticState({ status: "scanning" });

    startTransition(async () => {
      const result = await scanTicketAction(qrInput.trim());

      if (result.success && result.data) {
        const newState: ScanState = { status: "success", data: result.data };
        setScanState(newState);
        setScanHistory((prev) => [{ result: result.data!, timestamp: new Date() }, ...prev.slice(0, 9)]);
      } else {
        const newState: ScanState = { status: "error", message: result.error ?? "Scan failed" };
        setScanState(newState);
        setScanHistory((prev) => [{ result: null, error: result.error, timestamp: new Date() }, ...prev.slice(0, 9)]);
      }

      setQrInput("");
    });
  }

  const displayState = isPending ? optimisticState : scanState;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ticket Scanner</h1>
        <p className="text-muted-foreground text-sm mt-1">Scan guest QR codes for entry validation</p>
      </div>

      {/* Scanner Input */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-3">
            <Input
              placeholder="Scan or paste QR code..."
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              className="flex-1 font-mono text-sm"
              autoFocus
            />
            <Button onClick={handleScan} disabled={!qrInput.trim() || isPending} size="lg">
              {isPending ? "..." : "Scan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scan Result */}
      {displayState.status === "scanning" && (
        <Card className="border-primary/30 animate-pulse">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            </div>
            <p className="text-sm font-bold text-foreground">Verifying ticket...</p>
          </CardContent>
        </Card>
      )}

      {displayState.status === "success" && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-emerald-400 text-lg">ENTRY APPROVED</h3>
                <p className="text-muted-foreground text-xs">Ticket verified successfully</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-background/50 p-4 rounded-lg">
              <div>
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Guest</span>
                <span className="font-bold text-foreground">{displayState.data.booker_name}</span>
              </div>
              <div>
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Reference</span>
                <span className="font-mono font-bold text-foreground">{displayState.data.booking_ref}</span>
              </div>
              <div>
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Tier</span>
                <Badge variant="gold">{displayState.data.tier_name}</Badge>
              </div>
              <div>
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Party</span>
                <span className="font-bold text-foreground">
                  {displayState.data.adult_count}A{displayState.data.child_count > 0 ? ` + ${displayState.data.child_count}C` : ""}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {displayState.status === "error" && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-destructive text-lg">ENTRY DENIED</h3>
                <p className="text-muted-foreground text-sm">{displayState.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {scanHistory.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Scan History</h3>
          <div className="space-y-2">
            {scanHistory.map((entry, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg border text-sm ${entry.result ? "bg-card border-border" : "bg-destructive/5 border-destructive/20"}`}>
                <div className="flex items-center gap-2">
                  {entry.result ? (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  ) : (
                    <svg className="w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  )}
                  <span className="font-medium">{entry.result?.booker_name ?? "Failed scan"}</span>
                  {entry.result && <Badge variant="outline" className="ml-2">{entry.result.booking_ref}</Badge>}
                </div>
                <span className="text-[10px] text-muted-foreground">{entry.timestamp.toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Device {
  id: string;
  name: string;
  serial_number: string | null;
  device_type: string;
  status: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  type: "turnstile" | "crew-badge";
  input: string;
  device_serial: string;
  status: number;
  response: Record<string, unknown>;
}

export default function IoTSimulatorPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [fetchingDevices, setFetchingDevices] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [psk, setPsk] = useState("");

  // ── Turnstile form state ──────────────────────────────────────────────
  const [qrCode, setQrCode] = useState("");
  const [turnstileDevice, setTurnstileDevice] = useState("");
  const [turnstileLoading, setTurnstileLoading] = useState(false);

  // ── Crew badge form state ─────────────────────────────────────────────
  const [employeeId, setEmployeeId] = useState("");
  const [badgeDevice, setBadgeDevice] = useState("");
  const [badgeLoading, setBadgeLoading] = useState(false);

  // ── Active tab ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"turnstile" | "crew-badge">("turnstile");

  const fetchDevices = useCallback(async () => {
    setFetchingDevices(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from as any)("devices")
      .select("id, name, serial_number, device_type, status")
      .order("name");
    setDevices((data as Device[]) ?? []);
    if (data && data.length > 0) {
      const first = data.find((d: Device) => d.serial_number) || data[0];
      const serial = first.serial_number || first.name;
      if (!turnstileDevice) setTurnstileDevice(serial);
      if (!badgeDevice) setBadgeDevice(serial);
    }
    setFetchingDevices(false);
  }, [turnstileDevice, badgeDevice]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  useEffect(() => {
    if (logContainerRef.current) logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
  }, [logs]);

  // ── Turnstile scan ────────────────────────────────────────────────────
  async function handleTurnstileScan() {
    if (!qrCode.trim() || turnstileLoading) return;
    setTurnstileLoading(true);
    try {
      const res = await fetch("/api/iot/turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${psk}` },
        body: JSON.stringify({ qr_code_ref: qrCode.trim(), device_serial: turnstileDevice || "TURN-SIM-001", timestamp: new Date().toISOString() }),
      });
      const body = await res.json();
      setLogs((prev) => [...prev, {
        id: ++logIdRef.current, timestamp: new Date().toISOString(), type: "turnstile",
        input: qrCode.trim(), device_serial: turnstileDevice || "TURN-SIM-001", status: res.status, response: body,
      }]);
    } catch (err) {
      setLogs((prev) => [...prev, {
        id: ++logIdRef.current, timestamp: new Date().toISOString(), type: "turnstile",
        input: qrCode.trim(), device_serial: turnstileDevice || "TURN-SIM-001", status: 0, response: { error: "Network error", details: String(err) },
      }]);
    }
    setTurnstileLoading(false);
  }

  // ── Crew badge scan ───────────────────────────────────────────────────
  async function handleCrewBadgeScan() {
    if (!employeeId.trim() || badgeLoading) return;
    setBadgeLoading(true);
    try {
      const res = await fetch("/api/iot/crew-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${psk}` },
        body: JSON.stringify({ employee_id: employeeId.trim(), device_serial: badgeDevice || "SCAN-SIM-001", timestamp: new Date().toISOString() }),
      });
      const body = await res.json();
      setLogs((prev) => [...prev, {
        id: ++logIdRef.current, timestamp: new Date().toISOString(), type: "crew-badge",
        input: employeeId.trim(), device_serial: badgeDevice || "SCAN-SIM-001", status: res.status, response: body,
      }]);
    } catch (err) {
      setLogs((prev) => [...prev, {
        id: ++logIdRef.current, timestamp: new Date().toISOString(), type: "crew-badge",
        input: employeeId.trim(), device_serial: badgeDevice || "SCAN-SIM-001", status: 0, response: { error: "Network error", details: String(err) },
      }]);
    }
    setBadgeLoading(false);
  }

  function getStatusDisplay(status: number, type: string) {
    if (status === 200) return { label: `${status} OK`, cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    if (status === 401) return { label: `${status} UNAUTHORIZED`, cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    if (status === 0) return { label: "NETWORK ERROR", cls: "text-red-400 bg-red-500/10 border-red-500/20" };
    return { label: `${status} ${type === "turnstile" ? "LOCK RED" : "REJECTED"}`, cls: "text-red-400 bg-red-500/10 border-red-500/20" };
  }

  const DeviceSelect = ({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) => (
    fetchingDevices ? (
      <div className="h-[38px] bg-input border border-border rounded-md flex items-center px-3 text-xs text-muted-foreground animate-pulse">Loading…</div>
    ) : (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none" style={{ colorScheme: "dark" }}>
        {devices.length === 0 && <option value="SIM-001">SIM-001 (Default)</option>}
        {devices.map((d) => (
          <option key={d.id} value={d.serial_number || d.name}>{d.serial_number || d.name} — {d.device_type} ({d.status})</option>
        ))}
      </select>
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gradient">IoT Hardware Simulator</h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
            Spoof physical scans — turnstiles & badge readers
          </p>
        </div>
        <div className="flex items-center gap-2 bg-warning/5 border border-warning/20 rounded-full px-4 py-1.5">
          <span className="text-[10px] text-warning tracking-widest uppercase font-bold">⚠ IT Admin Tool</span>
        </div>
      </div>

      {/* PSK Config */}
      <div className="glass rounded-xl p-4 border-warning/20">
        <div className="flex items-start gap-3">
          <span className="text-warning text-lg">🔐</span>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-warning uppercase tracking-widest mb-1">Webhook Secret</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
              Paste <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[10px] font-mono">IOT_WEBHOOK_SECRET</code> — used for both turnstile and crew-scan endpoints.
            </p>
            <input
              type="password"
              placeholder="Paste IOT_WEBHOOK_SECRET value…"
              value={psk}
              onChange={(e) => setPsk(e.target.value)}
              className="w-full max-w-md bg-input border border-border rounded-md px-3 py-2 text-xs font-mono focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-1 bg-card border border-border rounded-lg p-1 w-fit">
        {[
          { key: "turnstile" as const, label: "🎟 Guest Turnstile" },
          { key: "crew-badge" as const, label: "👤 Crew Badge Scan" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scan Forms */}
      <div className="glass rounded-xl p-6">
        {activeTab === "turnstile" ? (
          <>
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Simulate Turnstile Scan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="qr-input" className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">QR Code Reference</label>
                <input
                  id="qr-input" type="text" value={qrCode} onChange={(e) => setQrCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTurnstileScan()}
                  placeholder="e.g. AGT-240316-001"
                  className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm font-mono focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="turnstile-device" className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Device Serial</label>
                <DeviceSelect id="turnstile-device" value={turnstileDevice} onChange={setTurnstileDevice} />
              </div>
              <div className="flex items-end">
                <button onClick={handleTurnstileScan} disabled={turnstileLoading || !qrCode.trim()}
                  className="w-full bg-primary text-primary-foreground font-bold py-2.5 px-6 rounded-md hover:opacity-90 transition-all text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed">
                  {turnstileLoading ? "Scanning…" : "⚡ Fire Scan"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-sm font-bold text-accent uppercase tracking-widest mb-4">Simulate Crew Badge Scan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="emp-input" className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Employee ID</label>
                <input
                  id="emp-input" type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCrewBadgeScan()}
                  placeholder="e.g. EMP-001"
                  className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm font-mono focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="badge-device" className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Badge Reader</label>
                <DeviceSelect id="badge-device" value={badgeDevice} onChange={setBadgeDevice} />
              </div>
              <div className="flex items-end">
                <button onClick={handleCrewBadgeScan} disabled={badgeLoading || !employeeId.trim()}
                  className="w-full bg-accent text-accent-foreground font-bold py-2.5 px-6 rounded-md hover:opacity-90 transition-all text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed">
                  {badgeLoading ? "Scanning…" : "👤 Fire Badge Scan"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Response Log */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background/50">
          <h4 className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            iot_scan_log — raw webhook output
          </h4>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground/50 font-mono">{logs.length} entries</span>
            {logs.length > 0 && (
              <button onClick={() => setLogs([])} className="text-[10px] text-destructive/60 hover:text-destructive uppercase tracking-widest transition">Clear</button>
            )}
          </div>
        </div>
        <div ref={logContainerRef} className="max-h-[400px] overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground/30">
              <p className="text-sm">No scan events yet.</p>
              <p className="text-[10px] mt-1">Fire a scan to see webhook responses here.</p>
            </div>
          ) : (
            logs.map((entry) => {
              const statusDisplay = getStatusDisplay(entry.status, entry.type);
              const typeLabel = entry.type === "turnstile" ? "🎟" : "👤";
              return (
                <div key={entry.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                  <div className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] text-muted-foreground/40 flex-shrink-0 w-16">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <span>{typeLabel}</span>
                      <code className="text-[11px] text-primary truncate">{entry.input}</code>
                      <span className="text-muted-foreground/20">@</span>
                      <code className="text-[11px] text-muted-foreground/60 truncate">{entry.device_serial}</code>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${statusDisplay.cls}`}>
                      {statusDisplay.label}
                    </span>
                  </div>
                  <div className="px-5 pb-3">
                    <pre className="text-[10px] text-muted-foreground/60 bg-background/50 border border-border/30 rounded p-3 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(entry.response, null, 2)}
                    </pre>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

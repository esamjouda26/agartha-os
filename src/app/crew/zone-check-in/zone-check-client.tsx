"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { QrCode, LogOut, CheckCircle2, MapPin, Camera, X, Loader2, AlertTriangle } from "lucide-react";
import jsQR from "jsqr";
import { checkIntoZone, checkOutOfZone } from "./actions";

type ScanState = "idle" | "scanning" | "detected";

export default function ZoneCheckClient({
  zones,
  activeLocation,
}: {
  zones: any[];
  activeLocation: any | null;
}) {
  const [selectedZone, setSelectedZone] = useState("");
  const [isPending, startTransition] = useTransition();
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanError, setScanError] = useState<string | null>(null);
  const [detectedLabel, setDetectedLabel] = useState<string | null>(null);

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number | null>(null);

  // ── Stop camera & RAF ──────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── QR decode loop ────────────────────────────────────────────────────

  const tickQR = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(tickQR);
      return;
    }

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });

    if (code?.data) {
      handleQRDetected(code.data);
      return; // stop loop after detection
    }
    rafRef.current = requestAnimationFrame(tickQR);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Open scanner ──────────────────────────────────────────────────────

  function openScanner() {
    setScanError(null);
    setDetectedLabel(null);
    setScanState("scanning");

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError("Camera not available — use the manual selector below.");
      setScanState("idle");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        requestAnimationFrame(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().then(() => {
              rafRef.current = requestAnimationFrame(tickQR);
            }).catch(() => {});
          }
        });
      })
      .catch((err) => {
        setScanError(`Camera denied: ${err.message}. Use manual selector.`);
        setScanState("idle");
      });
  }

  // Attach stream when video mounts
  useEffect(() => {
    if (scanState === "scanning" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().then(() => {
        rafRef.current = requestAnimationFrame(tickQR);
      }).catch(() => {});
    }
  }, [scanState, tickQR]);

  // ── QR Detected ───────────────────────────────────────────────────────

  function handleQRDetected(data: string) {
    stopCamera();
    setScanState("detected");

    // Try to match data against zone id or zone name (case-insensitive)
    const matched = zones.find(
      (z) => z.id === data || z.name?.toLowerCase() === data.toLowerCase()
    );

    if (matched) {
      setDetectedLabel(matched.name);
      submitZoneCheckIn(matched.id);
    } else {
      // QR value doesn't match any known zone — show error, reset
      setScanError(`QR code "${data}" does not match any zone. Use manual selector.`);
      setScanState("idle");
    }
  }

  // ── Submit zone check-in ──────────────────────────────────────────────

  function submitZoneCheckIn(zoneId: string) {
    startTransition(async () => {
      try {
        await checkIntoZone(zoneId);
        setScanState("idle");
      } catch (err: any) {
        setScanError("Check-in failed: " + err.message);
        setScanState("idle");
      }
    });
  }

  // ── Manual check-in ───────────────────────────────────────────────────

  function handleManualCheckIn() {
    if (!selectedZone) return;
    startTransition(async () => {
      try {
        await checkIntoZone(selectedZone);
      } catch (err: any) {
        setScanError("Check-in failed: " + err.message);
      }
    });
  }

  // ── Check-out ─────────────────────────────────────────────────────────

  function handleCheckOut() {
    if (!activeLocation) return;
    startTransition(async () => {
      try {
        await checkOutOfZone(activeLocation.id);
        setSelectedZone("");
      } catch (err: any) {
        setScanError("Check-out failed: " + err.message);
      }
    });
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="glass-panel-gold p-6 rounded-2xl text-center shadow-lg border border-[#d4af37]/30 transition-all duration-300">
      <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold mb-2">Zone Telemetry</h1>
      <p className="text-sm text-gray-400 mb-6">Scan zone QR code or manually declare your position.</p>

      {/* ── Already checked in ── */}
      {activeLocation ? (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-32 h-32 mx-auto rounded-full border-4 border-green-500/50 flex flex-col items-center justify-center bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <CheckCircle2 className="w-12 h-12 text-green-400 mb-2" />
            <span className="text-[10px] font-bold text-green-400 tracking-widest uppercase">Verified</span>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-left">
            <h3 className="text-xs text-[#d4af37] font-bold uppercase tracking-widest mb-1">Current Position</h3>
            <p className="text-lg text-white font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              {activeLocation.zones?.name || "Unknown Zone"}
            </p>
            <p className="text-[10px] text-gray-500 font-mono mt-2 tracking-widest uppercase">
              Entry: {new Date(activeLocation.scanned_at).toLocaleTimeString()}
            </p>
          </div>

          <button
            disabled={isPending}
            onClick={handleCheckOut}
            className="w-full py-4 bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-bold tracking-widest uppercase rounded-xl active:scale-95 transition-all hover:bg-red-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" /> Execute Exit Log
          </button>
        </div>
      ) : (
        /* ── Check-in flow ── */
        <div className="space-y-5 text-left">

          {/* QR Scanner box — only visible when user clicked Scan */}
          {scanState === "scanning" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Scanning QR Code...</p>
                <button onClick={() => { stopCamera(); setScanState("idle"); }} className="text-gray-500 hover:text-red-400 transition">
                  <X size={16} />
                </button>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-[#d4af37]/30 bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-[#d4af37] rounded-xl relative">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-[#d4af37] rounded-tl" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-[#d4af37] rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-[#d4af37] rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-[#d4af37] rounded-br" />
                    {/* Scan line */}
                    <div className="absolute inset-x-0 h-0.5 bg-[#d4af37] opacity-80 shadow-[0_0_8px_2px_#d4af37] animate-scan" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="text-xs text-gray-400">Point camera at zone QR code</span>
                </div>
              </div>
            </div>
          )}

          {/* Detected state — submitting */}
          {scanState === "detected" && (
            <div className="flex items-center gap-3 p-4 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-xl">
              <Loader2 size={18} className="animate-spin text-[#d4af37] shrink-0" />
              <div>
                <p className="text-sm font-bold text-[#d4af37]">Zone detected</p>
                {detectedLabel && <p className="text-xs text-gray-400">{detectedLabel}</p>}
              </div>
            </div>
          )}

          {/* Scan QR button — idle state only */}
          {scanState === "idle" && (
            <button
              onClick={openScanner}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-xl border-2 border-dashed border-[#d4af37]/40 hover:border-[#d4af37] text-[#d4af37]/70 hover:text-[#d4af37] transition disabled:opacity-50"
            >
              <Camera size={22} />
              <span className="text-sm font-bold tracking-widest uppercase">Scan QR Code</span>
            </button>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-gray-600 uppercase tracking-widest">or manual</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Manual zone selector */}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">
              Manual Override
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full bg-[#020408] border border-white/10 text-white text-sm rounded-xl p-4 focus:outline-none focus:border-[#d4af37] appearance-none"
            >
              <option value="" disabled>Select Sector Designation...</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>

          <button
            disabled={isPending || !selectedZone}
            onClick={handleManualCheckIn}
            className="w-full py-4 bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] text-sm font-bold tracking-widest uppercase rounded-xl active:scale-95 transition-all hover:bg-[#d4af37]/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
          >
            <MapPin className="w-5 h-5" /> Declare Position
          </button>

          {/* Error */}
          {scanError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              <AlertTriangle size={14} className="shrink-0" /> {scanError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

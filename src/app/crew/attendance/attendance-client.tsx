"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import {
  Clock, MapPin, Camera, CheckCircle2, UserCheck, AlertCircle,
  LogOut, Loader2, AlertTriangle, X, ShieldCheck, RotateCcw,
} from "lucide-react";
import { submitCheckIn, submitCheckOut } from "./actions";
import type { AttendanceStatus } from "./actions";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-MY", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status, minutesDiff, type }: {
  status: AttendanceStatus; minutesDiff: number; type: "in" | "out";
}) {
  if (status === "Normal") return (
    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
      <ShieldCheck size={16} className="text-green-400 shrink-0" />
      <span className="text-sm font-bold text-green-400 tracking-widest uppercase">
        {type === "in" ? "On Time" : "Normal Departure"}
      </span>
    </div>
  );
  if (status === "Late") return (
    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
      <AlertTriangle size={16} className="text-red-400 shrink-0" />
      <span className="text-sm font-bold text-red-400">Late by {minutesDiff} min{minutesDiff !== 1 ? "s" : ""}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
      <AlertTriangle size={16} className="text-amber-400 shrink-0" />
      <span className="text-sm font-bold text-amber-400">Early departure by {minutesDiff} min{minutesDiff !== 1 ? "s" : ""}</span>
    </div>
  );
}

// ── GPS State ──────────────────────────────────────────────────────────────

type GpsState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ready"; lat: number; lng: number; accuracy: number; label: string }
  | { state: "error"; message: string };

// Camera state machine: idle → capturing (live feed) → preview (photo taken)
type CameraState = "idle" | "capturing" | "preview";

// ── Main Component ─────────────────────────────────────────────────────────

export default function AttendanceClient({ todaysShift }: { todaysShift: any }) {
  const [isPending, startTransition] = useTransition();

  const isClockedIn = todaysShift?.clock_in && !todaysShift?.clock_out;
  const isCompleted = !!todaysShift?.clock_out;

  // GPS — acquired once on mount
  const [gps, setGps] = useState<GpsState>({ state: "idle" });

  // Camera state
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [pendingAction, setPendingAction] = useState<"in" | "out" | null>(null);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Captured selfie
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);

  // Result
  const [result, setResult] = useState<{ status: AttendanceStatus; minutesDiff: number; type: "in" | "out" } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Stop camera ──────────────────────────────────────────────────────────

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopStream(), [stopStream]);

  // ── GPS acquisition ──────────────────────────────────────────────────────

  useEffect(() => {
    if (isCompleted) return;
    setGps({ state: "loading" });
    if (!navigator.geolocation) { setGps({ state: "error", message: "GPS not supported." }); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng, accuracy } = coords;
        setGps({ state: "ready", lat, lng, accuracy, label: `${lat.toFixed(5)}, ${lng.toFixed(5)} (±${Math.round(accuracy)}m)` });
      },
      (err) => setGps({ state: "error", message: `GPS denied: ${err.message}` }),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [isCompleted]);

  // ── Open camera (called on button click) ────────────────────────────────

  function openCamera(action: "in" | "out") {
    setErrorMsg(null);
    setPendingAction(action);
    setCameraState("capturing");

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg("Camera not available on this device.");
      setCameraState("idle");
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        // videoRef may not be mounted yet — wait one frame
        requestAnimationFrame(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        });
      })
      .catch((err) => {
        setErrorMsg(`Camera access denied: ${err.message}`);
        setCameraState("idle");
        setPendingAction(null);
      });
  }

  // Attach stream when video element mounts into DOM (cameraState = "capturing")
  useEffect(() => {
    if (cameraState === "capturing" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraState]);

  // ── Capture frame ────────────────────────────────────────────────────────

  function captureFrame() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setSelfieBase64(dataUrl);
    stopStream();
    setCameraState("preview");
  }

  // ── Retake ───────────────────────────────────────────────────────────────

  function retake() {
    setSelfieBase64(null);
    setCameraState("idle");
    if (pendingAction) openCamera(pendingAction);
  }

  // ── Cancel camera ────────────────────────────────────────────────────────

  function cancelCamera() {
    stopStream();
    setSelfieBase64(null);
    setCameraState("idle");
    setPendingAction(null);
  }

  // ── Submit after photo confirmed ─────────────────────────────────────────

  function handleConfirm() {
    if (!selfieBase64) return;
    if (gps.state !== "ready") { setErrorMsg("GPS location is required."); return; }

    const gpsJson = JSON.stringify({
      lat: (gps as any).lat,
      lng: (gps as any).lng,
      accuracy: (gps as any).accuracy,
    });

    startTransition(async () => {
      try {
        if (pendingAction === "in") {
          const res = await submitCheckIn(selfieBase64, gpsJson);
          setResult({ status: res.status, minutesDiff: res.minutesDiff, type: "in" });
        } else {
          const res = await submitCheckOut(todaysShift.id, selfieBase64, gpsJson);
          setResult({ status: res.status, minutesDiff: res.minutesDiff, type: "out" });
        }
        setSelfieBase64(null);
        setCameraState("idle");
        setPendingAction(null);
      } catch (err: any) {
        setErrorMsg(err.message);
        cancelCamera();
      }
    });
  }

  // ── GPS pill ─────────────────────────────────────────────────────────────

  function GpsPill() {
    if (gps.state === "loading") return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Loader2 size={12} className="animate-spin text-[#d4af37]" /> Acquiring GPS...
      </div>
    );
    if (gps.state === "ready") return (
      <div className="flex items-center gap-2 text-xs text-green-400">
        <MapPin size={12} className="shrink-0" />
        <span className="truncate font-mono">{(gps as any).label}</span>
      </div>
    );
    if (gps.state === "error") return (
      <div className="flex items-center gap-2 text-xs text-red-400">
        <AlertTriangle size={12} className="shrink-0" /> {(gps as any).message}
      </div>
    );
    return null;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="glass-panel-gold p-6 rounded-2xl border border-[#d4af37]/30 space-y-5 relative overflow-hidden">
      {isClockedIn && <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-cinzel text-[#d4af37] font-bold">Shift Telemetry</h1>
        <p className="text-xs text-gray-400 mt-1">Clock-in requires selfie + GPS verification.</p>
      </div>

      {/* Shift info */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-1.5">
        <h3 className="text-[10px] text-[#d4af37] font-bold uppercase tracking-widest border-b border-white/10 pb-2 mb-3">
          Today's Assignment
        </h3>
        {todaysShift ? (
          <>
            <p className="text-sm text-gray-300">
              Shift: <span className="text-white font-semibold">
                {todaysShift.expected_start_time?.slice(0, 5)} – {todaysShift.expected_end_time?.slice(0, 5)}
              </span>
            </p>
            {isClockedIn && <p className="text-xs text-green-400">Clocked in at {formatTime(todaysShift.clock_in)}</p>}
            {isCompleted && <p className="text-xs text-[#d4af37] font-bold uppercase tracking-widest">Shift Completed ✓</p>}
            {!isClockedIn && !isCompleted && <p className="text-xs text-amber-400 uppercase tracking-widest">Pending Clock-In</p>}
          </>
        ) : (
          <div className="flex items-center gap-2 text-yellow-400/80">
            <AlertCircle size={14} />
            <span className="text-xs font-bold uppercase tracking-widest">No Shift Assigned Today</span>
          </div>
        )}
      </div>

      {/* GPS */}
      {!isCompleted && (
        <div className="bg-black/30 border border-white/10 rounded-xl px-4 py-3">
          <GpsPill />
        </div>
      )}

      {/* Camera box — only visible when user has clicked a button */}
      {(cameraState === "capturing" || cameraState === "preview") && !isCompleted && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              {pendingAction === "in" ? "Clock-In Selfie" : "Clock-Out Selfie"}
            </p>
            <button onClick={cancelCamera} className="text-gray-500 hover:text-red-400 transition">
              <X size={16} />
            </button>
          </div>

          {cameraState === "capturing" ? (
            /* Live camera feed — vertical portrait crop */
            <div className="relative rounded-xl overflow-hidden border border-[#d4af37]/30 bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-80 object-cover scale-x-[-1]"
              />
              <canvas ref={canvasRef} className="hidden" />
              {/* LIVE badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500/20 border border-red-500/40 rounded-full px-2 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[10px] text-red-400 font-bold">LIVE</span>
              </div>
              {/* Capture button */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <button
                  onClick={captureFrame}
                  className="w-16 h-16 rounded-full bg-white border-4 border-[#d4af37] flex items-center justify-center shadow-xl active:scale-95 transition"
                >
                  <Camera size={24} className="text-black" />
                </button>
              </div>
            </div>
          ) : (
            /* Preview after capture */
            <div className="relative">
              <img
                src={selfieBase64!}
                alt="Selfie preview"
                className="w-full h-80 object-cover rounded-xl border border-green-500/30 scale-x-[-1]"
              />
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-green-500/20 border border-green-500/40 rounded-full px-2 py-0.5">
                <CheckCircle2 size={10} className="text-green-400" />
                <span className="text-[10px] text-green-400 font-bold">Captured</span>
              </div>
            </div>
          )}

          {/* Confirm / Retake buttons — only in preview */}
          {cameraState === "preview" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={retake}
                disabled={isPending}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-bold hover:bg-white/5 transition disabled:opacity-50"
              >
                <RotateCcw size={14} /> Retake
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending || gps.state !== "ready"}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#d4af37] text-black text-sm font-bold hover:bg-yellow-300 transition disabled:opacity-50"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Confirm
              </button>
            </div>
          )}
        </div>
      )}

      {/* Post-submit status result */}
      {result && <StatusBadge status={result.status} minutesDiff={result.minutesDiff} type={result.type} />}

      {/* Error */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertTriangle size={14} className="shrink-0" /> {errorMsg}
        </div>
      )}

      {/* Clock IN / OUT buttons — only when camera is idle */}
      {!isCompleted && cameraState === "idle" && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => openCamera("in")}
            disabled={!!isClockedIn || isPending}
            className="py-4 bg-gradient-to-r from-[#d4af37] to-[#806b45] text-[#020408] font-bold tracking-widest uppercase rounded-xl transition active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Clock size={16} /> IN
          </button>
          <button
            onClick={() => openCamera("out")}
            disabled={!isClockedIn || isPending}
            className="py-4 bg-red-500/10 border border-red-500/30 text-red-400 font-bold tracking-widest uppercase rounded-xl hover:bg-red-500/20 transition active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2 min-h-[44px]"
          >
            <LogOut size={16} /> OUT
          </button>
        </div>
      )}

      {/* Completed state */}
      {isCompleted && (
        <div className="flex items-center justify-center gap-3 py-4 bg-green-500/5 border border-green-500/20 rounded-xl">
          <UserCheck size={20} className="text-green-400" />
          <span className="text-sm font-bold text-green-400 tracking-widest uppercase">Shift Complete</span>
        </div>
      )}
    </div>
  );
}

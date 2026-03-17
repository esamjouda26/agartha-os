"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { guestSignOutAction } from "../actions/auth";
import { fetchTimeSlotsAction } from "../actions/booking";
import { generateQrSvg } from "@/lib/qr-svg";

// ── Types ───────────────────────────────────────────────────────────────────

interface Attendee {
  id: string;
  attendee_type: string;
  attendee_index: number;
  nickname: string;
  biometric_ref: string | null;
}

interface BookingData {
  id: string;
  experience_id: string;
  booking_ref: string;
  status: string;
  tier_name: string;
  total_price: number;
  booker_name: string;
  booker_email: string;
  adult_count: number;
  child_count: number;
  qr_code_ref: string;
  face_pay_enabled: boolean;
  auto_capture_opt: boolean;
  is_used: boolean;
  checked_in_at: string | null;
  slot_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  perks: string[];
  attendees: Attendee[];
}

interface TimeSlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  available: number;
}

// ── Safe QR Component ────────────────────────────────────────────────────────

function QrCode({ value, size = 130 }: { value: string; size?: number }) {
  const svg = generateQrSvg(value, size);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return (
    <img
      src={dataUrl}
      alt={`QR code for ${value}`}
      width={size}
      height={size}
      className="block"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

// ── Status Badge Colors ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "confirmed" ? "success" :
    status === "completed" ? "gold" :
    status === "checked_in" ? "success" :
    status === "cancelled" ? "destructive" :
    "outline";
  return <Badge variant={variant as Parameters<typeof Badge>[0]["variant"]}>{status.replace("_", " ")}</Badge>;
}

// ── Component ────────────────────────────────────────────────────────────────

export function GuestDashboardClient({ booking }: { booking: Record<string, unknown> }) {
  const router = useRouter();
  const b = booking as unknown as BookingData;

  const [showModify, setShowModify] = useState(false);
  const [modifyDate, setModifyDate] = useState(b.slot_date);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState<string>("");
  const [slotsLoading, setSlotsLoading] = useState(false);

  const formattedDate = new Date(b.slot_date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // ── Sign Out ──────────────────────────────────────────────────────────────

  async function handleSignOut() {
    await guestSignOutAction();
    router.push("/guest/login");
  }

  // ── Load slots for modify panel ───────────────────────────────────────────

  const loadSlotsForDate = useCallback(async (date: string) => {
    if (!b.experience_id || !date) return;
    setSlotsLoading(true);
    setSelectedNewSlot("");
    const slots = await fetchTimeSlotsAction(b.experience_id, date);
    setAvailableSlots(slots.filter((s) => s.available > 0));
    setSlotsLoading(false);
  }, [b.experience_id]);

  function handleModifyDateChange(date: string) {
    setModifyDate(date);
    loadSlotsForDate(date);
  }

  function handleOpenModify() {
    const next = !showModify;
    setShowModify(next);
    if (next) {
      loadSlotsForDate(modifyDate);
    }
  }

  const canModify = b.status === "confirmed" || b.status === "pending";

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 space-y-4 pb-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <h2 className="text-xl sm:text-2xl text-white font-bold tracking-wider leading-tight" style={{ fontFamily: "'Cinzel', serif" }}>
            BOOKING MANAGEMENT
          </h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">
            Welcome back, <span className="text-[#d4af37]">{b.booker_name}</span>
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex-shrink-0 text-xs text-gray-400 hover:text-[#d4af37] uppercase tracking-widest transition border border-white/10 hover:border-[#d4af37]/30 px-3 py-2 rounded-lg"
        >
          Sign Out
        </button>
      </div>

      {/* ── Digital Pass — FIRST on mobile ─────────────────────────────── */}
      <div className="bg-[#0a0a0a]/95 border border-[#d4af37]/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.08)]">
        <div className="px-5 pt-5 pb-2 border-b border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#d4af37] font-bold tracking-widest uppercase" style={{ fontFamily: "'Cinzel', serif" }}>Digital Pass</span>
            <span className="font-mono text-sm text-white tracking-widest font-bold bg-white/5 px-3 py-1 rounded border border-white/10">{b.booking_ref}</span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* QR Code */}
            <div className="flex justify-center sm:flex-shrink-0">
              <div className="bg-white p-3 rounded-lg inline-block shadow-[0_0_20px_rgba(255,255,255,0.08)]">
                <QrCode value={b.qr_code_ref || b.booking_ref} size={120} />
              </div>
            </div>

            {/* Ticket Details */}
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Date</span>
                  <span className="block text-sm text-white font-bold leading-tight">{formattedDate}</span>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Entry</span>
                  <span className="block text-lg text-[#d4af37] font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>{b.start_time?.slice(0, 5)}</span>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Tier</span>
                  <span className="block text-sm text-[#d4af37] font-bold uppercase tracking-wide">{b.tier_name}</span>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Status</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>

              <div className="flex justify-between items-center bg-black/30 rounded-lg px-4 py-3">
                <div>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Party</span>
                  <span className="text-sm text-white font-bold">
                    {b.adult_count} Adult{b.adult_count > 1 ? "s" : ""}
                    {b.child_count > 0 ? `, ${b.child_count} Child${b.child_count > 1 ? "ren" : ""}` : ""}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Total Paid</span>
                  <span className="text-sm text-white font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>${Number(b.total_price).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Perks */}
          {b.perks && b.perks.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {b.perks.map((perk, i) => (
                <span key={i} className="text-[10px] text-gray-300 border border-white/15 rounded-full px-3 py-1">{perk}</span>
              ))}
            </div>
          )}

          <button
            onClick={() => window.print()}
            className="w-full mt-4 py-3 border border-white/20 rounded-lg text-gray-400 text-xs font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition"
          >
            Save / Print Pass
          </button>
        </div>
      </div>

      {/* ── Itinerary Details ───────────────────────────────────────────── */}
      <div className="bg-[#0a141e]/95 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <div>
            <h3 className="text-base text-white font-bold tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>Itinerary Details</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Current Booking Schedule</p>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 bg-black/30 p-4 rounded-lg border border-white/5">
            <div>
              <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Date</span>
              <span className="block text-base text-white font-bold leading-tight">{formattedDate}</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Entry Time</span>
              <span className="block text-lg text-[#d4af37] font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>{b.start_time?.slice(0, 5)}</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Duration</span>
              <span className="block text-sm text-white font-bold">{b.duration_minutes} min</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Exit</span>
              <span className="block text-sm text-white font-bold">{b.end_time?.slice(0, 5)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modify Schedule ─────────────────────────────────────────────── */}
      <div className="bg-[#0a141e]/95 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <div>
              <h3 className="text-base text-white font-bold tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>Modify Schedule</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Change Date or Time</p>
            </div>
          </div>
          {canModify ? (
            <button
              onClick={handleOpenModify}
              className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg border transition ${
                showModify
                  ? "border-white/20 text-gray-400 hover:bg-white/10"
                  : "border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10"
              }`}
            >
              {showModify ? "Cancel" : "Modify"}
            </button>
          ) : (
            <span className="text-[10px] text-gray-600 uppercase tracking-widest border border-white/5 px-3 py-2 rounded-lg">
              {b.status === "checked_in" || b.status === "completed" ? "Used" : "Unavailable"}
            </span>
          )}
        </div>

        {showModify && (
          <div className="p-5 space-y-4 animate-[fadeIn_0.3s_ease-in-out]">
            <p className="text-xs text-gray-400 leading-relaxed">Select a new date and time for your visit. Changes are subject to availability.</p>

            {/* Date Picker */}
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2">New Date</label>
              <input
                type="date"
                value={modifyDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => handleModifyDateChange(e.target.value)}
                className="w-full sm:w-auto bg-black/40 border border-white/20 text-sm text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#d4af37]/50 transition-all"
                style={{ colorScheme: "dark" }}
              />
            </div>

            {/* Time Slots — fetched from Supabase */}
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2">
                Available Slots {modifyDate && <span className="text-gray-600">for {modifyDate}</span>}
              </label>
              {slotsLoading ? (
                <div className="flex items-center gap-2 py-3 text-xs text-gray-500">
                  <div className="w-4 h-4 border border-gray-600 border-t-[#d4af37] rounded-full animate-spin" />
                  Loading available times…
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedNewSlot(slot.id)}
                      className={`px-4 py-2.5 border rounded-lg text-xs transition ${
                        selectedNewSlot === slot.id
                          ? "bg-[#d4af37] text-black border-[#d4af37] font-bold"
                          : "border-white/20 bg-white/5 text-gray-300 hover:border-[#d4af37]/50"
                      }`}
                    >
                      <span className="block font-bold">{slot.start_time.slice(0, 5)}</span>
                      <span className="block text-[9px] mt-0.5 opacity-70">{slot.available} left</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-2">No available slots for this date. Try another date.</p>
              )}
            </div>

            <button
              disabled
              className="w-full py-3 bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37]/50 rounded-lg text-sm font-bold uppercase tracking-widest cursor-not-allowed"
              title="Backend modification RPC not yet available"
            >
              Confirm Changes
            </button>
            <p className="text-[10px] text-gray-600 text-center">
              {/* TODO: Bind to Server Action once rpc_modify_booking is added */}
              Booking modification requires backend integration.
            </p>
          </div>
        )}
      </div>

      {/* ── Guest Details & Biometrics ──────────────────────────────────── */}
      <div className="bg-[#0a141e]/95 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base text-white font-bold tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>Guest Details</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Attendee Roster</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Feature Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div>
                <span className="block text-sm font-bold text-white">Auto-Capture</span>
                <span className="block text-[10px] text-gray-400">Ride action photos</span>
              </div>
              <Badge variant={b.auto_capture_opt ? "success" : "outline"}>{b.auto_capture_opt ? "Enabled" : "Disabled"}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div>
                <span className="block text-sm font-bold text-[#d4af37]">Face Pay</span>
                <span className="block text-[10px] text-gray-400">Hands-free purchases</span>
              </div>
              <Badge variant={b.face_pay_enabled ? "gold" : "outline"}>{b.face_pay_enabled ? "Enabled" : "Disabled"}</Badge>
            </div>
          </div>

          {/* Biometric Vault Link */}
          <button
            onClick={() => router.push("/guest/manage/biometrics")}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#d4af37]/5 to-transparent border border-[#d4af37]/20 rounded-lg cursor-pointer hover:border-[#d4af37]/40 hover:bg-[#d4af37]/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold text-[#d4af37] group-hover:text-[#e5c040] transition">Biometric Vault</span>
                <span className="block text-[10px] text-gray-400">Manage enrollment & privacy settings</span>
              </div>
            </div>
            <span className="text-gray-500 group-hover:text-[#d4af37] transition text-lg">→</span>
          </button>

          {/* Attendee List */}
          {b.attendees && b.attendees.length > 0 && (
            <div className="space-y-2">
              {b.attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition ${
                    attendee.biometric_ref
                      ? "bg-white/5 border-white/10"
                      : "bg-yellow-900/10 border-yellow-500/20"
                  }`}
                >
                  <div>
                    <p className="text-white font-bold text-sm">{attendee.nickname || `Guest ${attendee.attendee_index}`}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                      {attendee.attendee_type} #{attendee.attendee_index}
                    </p>
                  </div>
                  <Badge variant={attendee.biometric_ref ? "success" : "outline"}>
                    {attendee.biometric_ref ? "Enrolled" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Add Guest — disabled, shows info */}
          <div>
            <button
              disabled
              className="w-full py-3 border border-dashed border-white/15 rounded-lg text-xs text-gray-600 uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <span className="text-base leading-none">+</span> Add Guest to Party
            </button>
            <p className="text-center text-[10px] text-gray-700 mt-1">Guest additions require staff assistance at the park entrance.</p>
          </div>
        </div>
      </div>

      {/* ── Memories Vault ──────────────────────────────────────────────── */}
      <div className="bg-[#0a141e]/95 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75" />
            </svg>
          </div>
          <div>
            <h3 className="text-base text-white font-bold tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>Memories Vault</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Auto-Captured Ride Photos</p>
          </div>
        </div>

        <div className="p-5">
          <div className="text-center py-8 border border-dashed border-white/10 rounded-lg bg-white/[0.02]">
            <svg className="w-7 h-7 text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <h4 className="text-sm font-bold text-gray-400 mb-1">Awaiting Memories</h4>
            <p className="text-xs text-gray-600 max-w-xs mx-auto leading-relaxed">
              Your photos will sync here automatically during your visit on{" "}
              <span className="text-[#d4af37]">{formattedDate}</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

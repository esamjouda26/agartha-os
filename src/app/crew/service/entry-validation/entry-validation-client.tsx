"use client";

import { useState, useRef, useTransition } from "react";
import {
  ScanLine, Search, Mail, TicketCheck, Users,
  CheckCircle2, XCircle, Clock, Loader2, AlertTriangle, Star, Calendar
} from "lucide-react";
import {
  searchByRef, searchByEmail, searchByQr, checkInBooking
} from "./actions";
import type { BookingResult } from "./actions";

type Tab = "qr" | "ref" | "email";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  confirmed:   { label: "Confirmed",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30", icon: CheckCircle2 },
  checked_in:  { label: "Checked In",  color: "text-blue-400 bg-blue-400/10 border-blue-400/30",       icon: CheckCircle2 },
  pending:     { label: "Pending",     color: "text-amber-400 bg-amber-400/10 border-amber-400/30",     icon: Clock },
  completed:   { label: "Completed",   color: "text-gray-400 bg-white/5 border-white/10",               icon: CheckCircle2 },
  cancelled:   { label: "Cancelled",   color: "text-red-400 bg-red-400/10 border-red-400/30",           icon: XCircle },
  refunded:    { label: "Refunded",    color: "text-orange-400 bg-orange-400/10 border-orange-400/30",  icon: AlertTriangle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "text-gray-400 bg-white/5 border-white/10", icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${cfg.color}`}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

function BookingCard({
  booking,
  onCheckIn,
  isPending,
}: {
  booking: BookingResult;
  onCheckIn: (id: string) => void;
  isPending: boolean;
}) {
  const canCheckIn = booking.status === "confirmed" && !booking.is_used;

  return (
    <div className="bg-black/30 border border-white/8 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white font-semibold truncate">{booking.booker_name ?? "Guest"}</p>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{booking.booking_ref ?? booking.id.slice(0, 8)}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Details */}
      <div className="px-5 py-4 space-y-3">
        {booking.booker_email && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Mail size={13} className="shrink-0" />
            <span className="truncate">{booking.booker_email}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Users size={13} className="text-[#d4af37] shrink-0" />
            <span>{booking.adult_count} Adult{booking.adult_count !== 1 ? "s" : ""}{booking.child_count > 0 ? ` · ${booking.child_count} Child${booking.child_count !== 1 ? "ren" : ""}` : ""}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Star size={13} className="text-[#d4af37] shrink-0" />
            <span>{booking.tier_name}</span>
          </div>
        </div>

        {booking.special_requests && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2 text-xs text-amber-300">
            <span className="font-bold uppercase tracking-wider">Special: </span>
            {booking.special_requests}
          </div>
        )}

        {booking.slot && (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Calendar size={13} className="text-[#d4af37] shrink-0" />
            <span>
              {new Date(booking.slot.slot_date).toLocaleDateString("en-MY", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
              {" · "}
              {booking.slot.start_time.slice(0, 5)} – {booking.slot.end_time.slice(0, 5)}
            </span>
          </div>
        )}

        {booking.checked_in_at && (
          <p className="text-xs text-gray-600 flex items-center gap-1.5">
            <Clock size={10} />
            Checked in at {new Date(booking.checked_in_at).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {/* Action */}
      {canCheckIn && (
        <div className="px-5 pb-5">
          <button
            onClick={() => onCheckIn(booking.id)}
            disabled={isPending}
            className="w-full py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500/20 active:scale-95 transition disabled:opacity-50 min-h-[44px]"
          >
            {isPending ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><CheckCircle2 size={16} /> Confirm Check-In</>}
          </button>
        </div>
      )}
    </div>
  );
}

export default function EntryValidationClient() {
  const [tab, setTab] = useState<Tab>("qr");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookingResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const qrInputRef = useRef<HTMLInputElement>(null);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setSearchError(null);
    setResults([]);
    setSuccessId(null);
    setIsSearching(true);
    try {
      if (tab === "ref") {
        const r = await searchByRef(q);
        setResults(r ? [r] : []);
        if (!r) setSearchError("No booking found with reference: " + q);
      } else if (tab === "email") {
        const r = await searchByEmail(q);
        setResults(r);
        if (!r.length) setSearchError("No bookings found for: " + q);
      }
    } catch {
      setSearchError("Search failed.");
    } finally {
      setIsSearching(false);
    }
  }

  function handleQrCapture(e: React.ChangeEvent<HTMLInputElement>) {
    // In production, decode QR from image. Here we read filename as QR ref fallback.
    // Real integration: use a JS QR library (e.g. jsQR) on the captured frame.
    const file = e.target.files?.[0];
    if (!file) return;
    // Simulate: if filename matches UUID-like pattern, search for it
    const filename = file.name.replace(/\.[^.]+$/, "");
    setQuery(filename);
    setIsSearching(true);
    searchByQr(filename).then((r) => {
      setResults(r ? [r] : []);
      if (!r) setSearchError("QR code not recognized.");
    }).finally(() => setIsSearching(false));
    e.target.value = "";
  }

  function handleCheckIn(bookingId: string) {
    setCheckingInId(bookingId);
    startTransition(async () => {
      const res = await checkInBooking(bookingId);
      if (res.success) {
        setSuccessId(bookingId);
        setResults((prev) =>
          prev.map((b) =>
            b.id === bookingId
              ? { ...b, status: "checked_in", is_used: true, checked_in_at: new Date().toISOString() }
              : b
          )
        );
      } else {
        setSearchError(res.error ?? "Check-in failed.");
      }
      setCheckingInId(null);
    });
  }

  const TABS: { id: Tab; label: string; icon: typeof ScanLine }[] = [
    { id: "qr",    label: "QR Scan",  icon: ScanLine },
    { id: "ref",   label: "Ref",      icon: TicketCheck },
    { id: "email", label: "Email",    icon: Mail },
  ];

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24">
      {/* Header */}
      <div className="glass-panel-gold p-4 rounded-2xl border border-[#d4af37]/30 flex items-center gap-3">
        <TicketCheck className="text-[#d4af37] shrink-0" size={24} />
        <div>
          <h2 className="text-xl font-cinzel text-[#d4af37] font-bold">Entry Validation</h2>
          <p className="text-xs text-gray-400">Verify guest bookings</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-black/40 rounded-2xl border border-white/8">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setResults([]); setSearchError(null); setQuery(""); setSuccessId(null); }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition min-h-[44px] ${
              tab === id
                ? "bg-[#d4af37] text-black shadow-md"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon size={15} />
            <span className="hidden xs:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* QR Scan tab */}
      {tab === "qr" && (
        <div className="space-y-3">
          <button
            onClick={() => qrInputRef.current?.click()}
            className="w-full py-6 rounded-2xl bg-black/30 border-2 border-dashed border-[#d4af37]/30 hover:border-[#d4af37]/60 flex flex-col items-center gap-3 text-[#d4af37]/60 hover:text-[#d4af37] transition active:scale-95 min-h-[44px]"
          >
            <ScanLine size={36} />
            <div className="text-center">
              <p className="text-sm font-bold">Tap to Scan QR Code</p>
              <p className="text-xs text-gray-500 mt-1">Opens camera for QR capture</p>
            </div>
          </button>
          <input
            ref={qrInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleQrCapture}
          />
          {/* Manual QR ref fallback */}
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Or paste QR ref manually..."
              className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:border-[#d4af37] focus:outline-none transition min-h-[44px]"
            />
            <button
              onClick={() => { setTab("qr"); searchByQr(query).then((r) => { setResults(r ? [r] : []); if (!r) setSearchError("Not found."); }); }}
              disabled={!query}
              className="px-4 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] font-bold text-sm hover:bg-[#d4af37]/20 transition disabled:opacity-30 min-h-[44px]"
            >
              Search
            </button>
          </div>
        </div>
      )}

      {/* Booking Ref tab */}
      {tab === "ref" && (
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="AGT-XXXXXXXX"
            className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm font-mono placeholder-gray-600 focus:border-[#d4af37] focus:outline-none transition uppercase min-h-[44px]"
          />
          <button
            onClick={handleSearch}
            disabled={!query || isSearching}
            className="px-5 rounded-xl bg-[#d4af37] text-black font-bold text-sm hover:bg-[#c9a227] active:scale-95 transition disabled:opacity-40 min-h-[44px] flex items-center gap-2"
          >
            {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>
      )}

      {/* Email tab */}
      {tab === "email" && (
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="guest@email.com"
            type="email"
            className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:border-[#d4af37] focus:outline-none transition min-h-[44px]"
          />
          <button
            onClick={handleSearch}
            disabled={!query || isSearching}
            className="px-5 rounded-xl bg-[#d4af37] text-black font-bold text-sm hover:bg-[#c9a227] active:scale-95 transition disabled:opacity-40 min-h-[44px] flex items-center gap-2"
          >
            {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>
      )}

      {/* Success toast */}
      {successId && (
        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-300">
          <CheckCircle2 size={16} /> Guest successfully checked in.
        </div>
      )}

      {/* Error */}
      {searchError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
          {searchError}
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {results.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            onCheckIn={handleCheckIn}
            isPending={isPending && checkingInId === booking.id}
          />
        ))}
      </div>
    </div>
  );
}

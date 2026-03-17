"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  createBookingAction,
  fetchExperiencesAction,
  fetchTimeSlotsAction,
  type BookingResult,
} from "../actions/booking";
import { generateQrSvg } from "@/lib/qr-svg";

// ── Types ───────────────────────────────────────────────────────────────────

interface Tier {
  id: string;
  experience_id: string;
  tier_name: string;
  price: number;
  duration_minutes: number;
  perks: string[];
}

interface Experience {
  id: string;
  name: string;
  description: string;
  capacity_per_slot: number;
}

interface TimeSlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  booked_count: number;
  available: number;
  capacity: number;
}

// ── Constants ───────────────────────────────────────────────────────────────

const STEPS = ["Experience", "Date & Time", "Details", "Payment"] as const;
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── Safe QR Component ────────────────────────────────────────────────────────

function QrCode({ value, size = 130 }: { value: string; size?: number }) {
  const svg = generateQrSvg(value, size);
  // Parse to React-safe JSX via a blob data URL on an img element
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

// ── Component ───────────────────────────────────────────────────────────────

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Selections
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [timeFilter, setTimeFilter] = useState<"morning" | "afternoon" | "evening">("morning");
  const [calMonth, setCalMonth] = useState(new Date());

  // Details
  const [bookerName, setBookerName] = useState("");
  const [bookerEmail, setBookerEmail] = useState("");
  const [facePay, setFacePay] = useState(false);
  const [autoCapture, setAutoCapture] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  // Confirmation
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  // ── Load experiences on mount ─────────────────────────────────────────────

  useEffect(() => {
    setDataLoading(true);
    fetchExperiencesAction().then(({ experiences: exps, tiers: t }) => {
      setExperiences(exps);
      setTiers(t);
      if (exps.length > 0) {
        setSelectedExperience(exps[0]);
        const expTiers = t.filter((tier) => tier.experience_id === exps[0].id);
        if (expTiers.length > 0) setSelectedTier(expTiers[0]);
      }
      setDataLoading(false);
    });
  }, []);

  // ── Load time slots when date changes ─────────────────────────────────────

  const loadSlots = useCallback(async (expId: string, date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const slots = await fetchTimeSlotsAction(expId, dateStr);
    setTimeSlots(slots);
  }, []);

  useEffect(() => {
    if (selectedExperience && selectedDate) {
      loadSlots(selectedExperience.id, selectedDate);
    }
  }, [selectedExperience, selectedDate, loadSlots]);

  // ── When experience changes, reset tier to first available ────────────────

  useEffect(() => {
    if (!selectedExperience) return;
    const expTiers = tiers.filter((t) => t.experience_id === selectedExperience.id);
    if (expTiers.length > 0) setSelectedTier(expTiers[0]);
    else setSelectedTier(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setTimeSlots([]);
  }, [selectedExperience, tiers]);

  // ── Computed values ───────────────────────────────────────────────────────

  const experienceTiers = useMemo(
    () => tiers.filter((t) => t.experience_id === selectedExperience?.id),
    [tiers, selectedExperience]
  );

  const totalPrice = useMemo(
    () => selectedTier
      ? selectedTier.price * adultCount + selectedTier.price * 0.75 * childCount
      : 0,
    [selectedTier, adultCount, childCount]
  );

  const filteredSlots = useMemo(() => timeSlots.filter((s) => {
    const hour = parseInt(s.start_time.split(":")[0]);
    if (timeFilter === "morning") return hour >= 8 && hour < 12;
    if (timeFilter === "afternoon") return hour >= 12 && hour < 17;
    return hour >= 17;
  }), [timeSlots, timeFilter]);

  // ── Calendar ──────────────────────────────────────────────────────────────

  function renderCalendar() {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: React.ReactNode[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} />);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isPast = date < today;
      const isSelected = selectedDate?.getTime() === date.getTime();

      cells.push(
        <button
          key={d}
          disabled={isPast}
          onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
          className={`aspect-square flex items-center justify-center rounded text-sm transition-all ${
            isPast ? "text-gray-600 cursor-not-allowed opacity-30" :
            isSelected ? "bg-[#d4af37] text-black font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]" :
            "text-gray-300 hover:bg-[#d4af37]/20 hover:text-white hover:border-[#d4af37]/30 border border-transparent"
          }`}
        >
          {d}
        </button>
      );
    }
    return cells;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!selectedExperience || !selectedTier || !selectedSlot) return;

    setLoading(true);
    setError(null);

    const result = await createBookingAction({
      experienceId: selectedExperience.id,
      timeSlotId: selectedSlot.id,
      tierName: selectedTier.tier_name,
      bookerName,
      bookerEmail,
      adultCount,
      childCount,
      facePay,
      autoCapture,
      promoCode: promoCode || undefined,
    });

    setLoading(false);

    if (result.success && result.data) {
      setBookingResult(result.data);
      setStep(5);
    } else {
      setError(result.error ?? "Booking failed.");
    }
  }

  // ── Confirmation View ─────────────────────────────────────────────────────

  if (step === 5 && bookingResult) {
    return (
      <div className="max-w-md mx-auto px-4 pt-6 pb-8 animate-[fadeIn_0.5s_ease-in-out]">
        <div className="bg-[#0a0a0a]/95 border border-[#d4af37] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)] relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#806b45] via-[#d4af37] to-[#806b45]" />

          <div className="p-6 pb-4 text-center border-b border-white/10 bg-white/5">
            <div className="w-10 h-10 mx-auto bg-gradient-to-br from-[#d4af37] to-yellow-600 rounded-full flex items-center justify-center mb-3">
              <span className="font-bold text-xl text-black" style={{ fontFamily: "'Cinzel', serif" }}>A</span>
            </div>
            <h1 className="text-2xl text-[#d4af37] font-bold tracking-wider mb-1" style={{ fontFamily: "'Cinzel', serif" }}>BOOKING CONFIRMED</h1>
            <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em]">Agartha World Theme Park</p>
          </div>

          <div className="p-6 bg-black/40">
            <div className="text-center mb-6">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Booking Reference</p>
              <div className="font-mono text-xl font-bold tracking-[0.2em] text-white">{bookingResult.booking_ref}</div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-3 rounded-lg inline-block shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <QrCode value={bookingResult.booking_ref} size={130} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm text-gray-300">
              <div className="border-l-2 border-[#d4af37] pl-3">
                <span className="block text-[9px] uppercase text-gray-500 font-bold mb-1">Date</span>
                <span className="font-bold block text-white">{bookingResult.slot_date}</span>
              </div>
              <div className="text-right border-r-2 border-[#d4af37] pr-3">
                <span className="block text-[9px] uppercase text-gray-500 font-bold mb-1">Entry Time</span>
                <span className="font-bold block text-white">{bookingResult.start_time?.slice(0, 5)}</span>
              </div>
              <div className="border-l-2 border-white/20 pl-3">
                <span className="block text-[9px] uppercase text-gray-500 font-bold mb-1">Experience</span>
                <span className="font-bold text-[#d4af37] block uppercase">{bookingResult.tier_name}</span>
              </div>
              <div className="text-right border-r-2 border-white/20 pr-3">
                <span className="block text-[9px] uppercase text-gray-500 font-bold mb-1">Guests</span>
                <span className="font-bold block text-white">
                  {bookingResult.adult_count} Adult{bookingResult.adult_count > 1 ? "s" : ""}
                  {bookingResult.child_count > 0 && `, ${bookingResult.child_count} Child${bookingResult.child_count > 1 ? "ren" : ""}`}
                </span>
              </div>
            </div>

            {bookingResult.discount_applied > 0 && (
              <div className="mt-5 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
                <span className="text-emerald-400 text-xs font-bold">Discount applied: -${bookingResult.discount_applied.toFixed(2)}</span>
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-white/10 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Paid</p>
              <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>${bookingResult.total_price.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white/5 p-4 flex gap-3 border-t border-white/10">
            <button
              onClick={() => router.push("/guest/login")}
              className="flex-1 py-3 border border-white/20 rounded-lg text-gray-300 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition"
            >
              Manage Booking
            </button>
            <button
              onClick={() => { setStep(1); setBookingResult(null); setSelectedDate(null); setSelectedSlot(null); }}
              className="flex-1 py-3 bg-[#d4af37] text-black rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-yellow-400 transition"
            >
              Book Another
            </button>
          </div>
        </div>

        <p className="text-center mt-6 text-gray-500 text-xs">
          A confirmation email has been sent to <span className="text-[#d4af37]">{bookingResult.booker_email}</span>
        </p>
      </div>
    );
  }

  // ── Loading State ─────────────────────────────────────────────────────────

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin" />
        <p className="text-gray-500 text-xs uppercase tracking-widest">Loading experiences…</p>
      </div>
    );
  }

  // ── Main Flow ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 space-y-4 pb-4">

      {/* Progress Bar */}
      <div className="flex gap-2">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-[2px] flex-1 transition-all duration-500 ${i < step ? "bg-[#d4af37] shadow-[0_0_10px_#d4af37]" : "bg-gray-700"}`} />
        ))}
      </div>

      {/* ── Step 1: Experience & Tier ─────────────────────────────────── */}
      <div
        className={`rounded-xl border transition-all ${
          step === 1
            ? "border-[#d4af37]/30 bg-gradient-to-b from-[#d4af37]/[0.04] to-[#0a141e]/95 shadow-[0_0_40px_rgba(212,175,55,0.08)]"
            : "border-white/10 bg-white/[0.02] opacity-60 cursor-pointer"
        }`}
        onClick={() => step > 1 && setStep(1)}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border font-bold text-sm ${step >= 1 ? "border-[#d4af37] text-[#d4af37]" : "border-gray-600 text-gray-500"}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>1</div>
            <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>Select Experience</h2>
          </div>

          {step === 1 && (
            <div className="space-y-5 animate-[fadeIn_0.5s_ease-in-out]">
              {/* Experience selector (when multiple experiences exist) */}
              {experiences.length > 1 && (
                <div>
                  <label className="text-[10px] uppercase text-gray-400 tracking-widest mb-1 block">Experience</label>
                  <select
                    value={selectedExperience?.id ?? ""}
                    onChange={(e) => {
                      const exp = experiences.find((x) => x.id === e.target.value);
                      if (exp) setSelectedExperience(exp);
                    }}
                    className="w-full bg-black/40 border border-white/20 text-sm text-white rounded-lg px-3 py-3 focus:outline-none focus:border-[#d4af37]/50 transition-all"
                    style={{ colorScheme: "dark" }}
                  >
                    {experiences.map((exp) => (
                      <option key={exp.id} value={exp.id}>{exp.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tier Cards — horizontal scroll on mobile, grid on md+ */}
              {experienceTiers.length > 0 ? (
                <div>
                  <label className="text-[10px] uppercase text-gray-400 tracking-widest mb-3 block">Select Tier</label>
                  <div className="flex md:grid md:grid-cols-3 gap-3 overflow-x-auto snap-x snap-mandatory pb-2 md:overflow-visible md:pb-0 -mx-1 px-1">
                    {experienceTiers.map((tier) => (
                      <button
                        key={tier.id}
                        onClick={() => setSelectedTier(tier)}
                        className={`snap-start flex-shrink-0 w-[72vw] max-w-[220px] md:w-auto md:max-w-none p-4 rounded-lg text-left transition-all border ${
                          selectedTier?.id === tier.id
                            ? "border-[#d4af37] bg-gradient-to-br from-[#d4af37]/15 to-transparent shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                            : "border-white/15 bg-white/[0.03] hover:border-[#d4af37] hover:bg-[#d4af37]/5"
                        }`}
                      >
                        <h3 className={`text-sm uppercase tracking-widest mb-1 ${selectedTier?.id === tier.id ? "text-[#d4af37]" : "text-gray-200"}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>{tier.tier_name}</h3>
                        <p className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: "'Orbitron', sans-serif" }}>${tier.price.toFixed(0)}</p>
                        <p className="text-[9px] text-gray-400 uppercase mb-3">Child: ${(tier.price * 0.75).toFixed(0)}</p>
                        <ul className="text-xs text-gray-300 space-y-1.5">
                          {tier.perks?.slice(0, 3).map((perk, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selectedTier?.id === tier.id ? "bg-[#d4af37]" : "bg-gray-400"}`} />
                              <span className="leading-tight">{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-white/10 rounded-lg">
                  <p className="text-gray-500 text-sm">No tiers available for this experience.</p>
                </div>
              )}

              {/* Guest Count */}
              <div className="space-y-2">
                {[
                  { label: "Adults", hint: "Age 13+", count: adultCount, set: setAdultCount, min: 1 },
                  { label: "Children", hint: "Age 3–12", count: childCount, set: setChildCount, min: 0 },
                ].map(({ label, hint, count, set, min }) => (
                  <div key={label} className="flex items-center justify-between bg-white/5 px-4 py-3 border border-white/20 rounded-lg">
                    <div>
                      <span className="text-xs text-gray-200 uppercase tracking-widest">{label}</span>
                      <span className="block text-[10px] text-gray-500">{hint}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => set(Math.max(min, count - 1))}
                        className="w-9 h-9 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition rounded-full text-lg leading-none"
                        aria-label={`Decrease ${label}`}
                      >−</button>
                      <span className="text-xl text-white font-bold w-6 text-center" style={{ fontFamily: "'Orbitron', sans-serif" }}>{count}</span>
                      <button
                        onClick={() => set(Math.min(10, count + 1))}
                        className="w-9 h-9 bg-[#d4af37]/20 hover:bg-[#d4af37]/40 flex items-center justify-center text-[#d4af37] transition rounded-full text-lg leading-none"
                        aria-label={`Increase ${label}`}
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!selectedTier}
                className="w-full py-4 bg-[#d4af37]/10 border border-[#d4af37]/30 hover:bg-[#d4af37] hover:text-black text-[#d4af37] uppercase tracking-[0.1em] font-bold transition-all flex items-center justify-center gap-2 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </div>
          )}

          {step > 1 && (
            <div className="flex justify-between items-center pl-10 text-xs text-gray-400">
              <span><strong className="text-white uppercase">{selectedTier?.tier_name}</strong> × {adultCount} Adult{adultCount > 1 ? "s" : ""}{childCount > 0 ? `, ${childCount} Child${childCount > 1 ? "ren" : ""}` : ""}</span>
              <span className="text-[#d4af37] font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>${totalPrice.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Step 2: Date & Time ───────────────────────────────────────── */}
      {step >= 2 && (
        <div
          className={`rounded-xl border transition-all ${
            step === 2
              ? "border-[#d4af37]/30 bg-gradient-to-b from-[#d4af37]/[0.04] to-[#0a141e]/95 shadow-[0_0_40px_rgba(212,175,55,0.08)]"
              : "border-white/10 bg-white/[0.02] opacity-60 cursor-pointer"
          }`}
          onClick={() => step > 2 && setStep(2)}
        >
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border font-bold text-sm ${step >= 2 ? "border-[#d4af37] text-[#d4af37]" : "border-gray-600 text-gray-500"}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>2</div>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>Date & Time</h2>
            </div>

            {step === 2 && (
              <div className="space-y-5 animate-[fadeIn_0.5s_ease-in-out]">
                {/* Calendar */}
                <div className="bg-black/30 p-4 border border-white/20 rounded-lg">
                  <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                    <span className="font-bold text-white text-sm" style={{ fontFamily: "'Orbitron', sans-serif" }}>{MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))} className="p-2 hover:text-white text-gray-300 transition rounded">‹</button>
                      <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))} className="p-2 hover:text-white text-gray-300 transition rounded">›</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                    {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                      <span key={d} className="text-[9px] text-gray-400 uppercase">{d}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div>
                    <label className="text-[10px] uppercase text-gray-300 mb-2 tracking-widest block">Select Entry Time</label>
                    <div className="flex gap-1 mb-3 border-b border-white/10">
                      {(["morning", "afternoon", "evening"] as const).map((period) => (
                        <button
                          key={period}
                          onClick={() => setTimeFilter(period)}
                          className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest border-b-2 -mb-px transition font-bold ${
                            timeFilter === period ? "border-[#d4af37] text-[#d4af37]" : "border-transparent text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                      {filteredSlots.map((slot) => (
                        <button
                          key={slot.id}
                          disabled={slot.available <= 0}
                          onClick={() => setSelectedSlot(slot)}
                          className={`snap-start flex-shrink-0 px-4 py-3 border rounded-lg text-xs transition whitespace-nowrap ${
                            selectedSlot?.id === slot.id
                              ? "bg-[#d4af37] text-black border-[#d4af37] font-bold"
                              : slot.available <= 0
                              ? "border-white/10 text-gray-600 cursor-not-allowed opacity-30"
                              : "border-white/20 bg-white/10 text-gray-200 hover:border-[#d4af37]"
                          }`}
                        >
                          <span className="block font-bold">{slot.start_time.slice(0, 5)}</span>
                          <span className="block text-[9px] mt-0.5 opacity-70">{slot.available > 0 ? `${slot.available} left` : "Full"}</span>
                        </button>
                      ))}
                      {filteredSlots.length === 0 && (
                        <p className="text-gray-500 text-xs py-4 px-2">No slots available for this period.</p>
                      )}
                    </div>
                  </div>
                )}

                {!selectedDate && (
                  <p className="text-center text-gray-500 text-xs py-2">← Select a date to see available time slots</p>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="w-1/3 py-4 bg-white/5 border border-white/20 text-gray-200 uppercase tracking-widest text-[10px] font-bold hover:text-white hover:bg-white/10 transition rounded-lg">Back</button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedDate || !selectedSlot}
                    className="w-2/3 py-4 bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] uppercase tracking-[0.1em] font-bold transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#d4af37] hover:text-black rounded-lg text-sm"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step > 2 && selectedDate && selectedSlot && (
              <div className="flex justify-between items-center pl-10 text-xs text-gray-400">
                <span><strong className="text-white">{selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong> @ <strong className="text-white">{selectedSlot.start_time.slice(0, 5)}</strong></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3: Details ──────────────────────────────────────────── */}
      {step >= 3 && (
        <div
          className={`rounded-xl border transition-all ${
            step === 3
              ? "border-[#d4af37]/30 bg-gradient-to-b from-[#d4af37]/[0.04] to-[#0a141e]/95 shadow-[0_0_40px_rgba(212,175,55,0.08)]"
              : "border-white/10 bg-white/[0.02] opacity-60 cursor-pointer"
          }`}
          onClick={() => step > 3 && setStep(3)}
        >
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border font-bold text-sm ${step >= 3 ? "border-[#d4af37] text-[#d4af37]" : "border-gray-600 text-gray-500"}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>3</div>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>Details & Features</h2>
            </div>

            {step === 3 && (
              <div className="space-y-5 animate-[fadeIn_0.5s_ease-in-out]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase text-gray-300 tracking-widest mb-1 block">Group Leader Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={bookerName}
                      onChange={(e) => setBookerName(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 text-white text-sm rounded-lg px-3 py-3 focus:outline-none focus:border-[#d4af37]/60 transition-all placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-gray-300 tracking-widest mb-1 block">Email Address <span className="text-[#d4af37]">*</span></label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={bookerEmail}
                      onChange={(e) => setBookerEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 text-white text-sm rounded-lg px-3 py-3 focus:outline-none focus:border-[#d4af37]/60 transition-all placeholder-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Auto-Capture */}
                  <div className="p-4 border border-white/10 bg-white/5 rounded-lg flex items-center justify-between gap-4">
                    <div>
                      <span className="font-bold text-white text-sm block">Auto-Capture Moments</span>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">Automatically capture high-quality action shots on rides.</p>
                    </div>
                    <button
                      onClick={() => setAutoCapture(!autoCapture)}
                      className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors ${autoCapture ? "bg-purple-500" : "bg-gray-800 border border-gray-600"}`}
                      role="switch"
                      aria-checked={autoCapture}
                    >
                      <div className={`absolute top-[2px] w-4 h-4 bg-white rounded-full shadow transition-transform ${autoCapture ? "translate-x-5" : "translate-x-[2px]"}`} />
                    </button>
                  </div>

                  {/* Face Pay */}
                  <div className="p-4 border border-[#d4af37]/20 bg-[#d4af37]/5 rounded-lg flex items-center justify-between gap-4">
                    <div>
                      <span className="font-bold text-white text-sm block">Enable Face Pay</span>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">Link biometrics for hands-free purchases inside the park.</p>
                    </div>
                    <button
                      onClick={() => setFacePay(!facePay)}
                      className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors ${facePay ? "bg-[#d4af37]" : "bg-gray-800 border border-gray-600"}`}
                      role="switch"
                      aria-checked={facePay}
                    >
                      <div className={`absolute top-[2px] w-4 h-4 bg-white rounded-full shadow transition-transform ${facePay ? "translate-x-5" : "translate-x-[2px]"}`} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase text-gray-300 tracking-widest mb-1 block">Promo Code <span className="text-gray-500">(Optional)</span></label>
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="w-full bg-white/5 border border-white/20 text-white text-sm rounded-lg px-3 py-3 focus:outline-none focus:border-[#d4af37]/60 transition-all placeholder-gray-500 tracking-widest"
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 accent-[#d4af37] w-4 h-4 flex-shrink-0"
                  />
                  <label htmlFor="terms" className="text-[11px] text-gray-300 leading-relaxed">
                    I agree to the <span className="text-[#d4af37] underline cursor-pointer">Terms & Conditions</span> and Privacy Policy.
                  </label>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="w-1/3 py-4 bg-white/5 border border-white/20 text-gray-200 uppercase tracking-widest text-[10px] font-bold hover:text-white hover:bg-white/10 transition rounded-lg">Back</button>
                  <button
                    onClick={() => setStep(4)}
                    disabled={!bookerName || !bookerEmail || !termsAccepted}
                    className="w-2/3 py-4 bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] uppercase tracking-[0.1em] font-bold transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#d4af37] hover:text-black rounded-lg text-sm"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}

            {step > 3 && (
              <div className="flex justify-between items-center pl-10 text-xs text-gray-400">
                <span className="text-white font-bold">{bookerName}</span>
                <span className="text-purple-400">{autoCapture && facePay ? "Auto-Capture + Face Pay" : autoCapture ? "Auto-Capture" : facePay ? "Face Pay" : "Standard"}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4: Payment ──────────────────────────────────────────── */}
      {step >= 4 && (
        <div className="rounded-xl border border-[#d4af37]/30 bg-gradient-to-b from-[#d4af37]/[0.04] to-[#0a141e]/95 shadow-[0_0_40px_rgba(212,175,55,0.08)]">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border border-[#d4af37] text-[#d4af37] font-bold text-sm" style={{ fontFamily: "'Orbitron', sans-serif" }}>4</div>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>Payment</h2>
            </div>

            <div className="space-y-5 animate-[fadeIn_0.5s_ease-in-out]">
              {/* Order Summary */}
              <div className="bg-black/40 p-5 rounded-lg border border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 text-xs uppercase tracking-widest">Order Summary</span>
                  <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-300 border-t border-white/10 pt-4">
                  <div className="flex justify-between">
                    <span>{selectedTier?.tier_name} × {adultCount} Adult{adultCount > 1 ? "s" : ""}</span>
                    <span className="text-white">${(selectedTier ? selectedTier.price * adultCount : 0).toFixed(2)}</span>
                  </div>
                  {childCount > 0 && (
                    <div className="flex justify-between">
                      <span>{selectedTier?.tier_name} × {childCount} Child{childCount > 1 ? "ren" : ""}</span>
                      <span className="text-white">${(selectedTier ? selectedTier.price * 0.75 * childCount : 0).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedDate && selectedSlot && (
                    <div className="flex justify-between pt-2 border-t border-white/10 text-[11px] text-gray-500">
                      <span>{selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} @ {selectedSlot.start_time.slice(0, 5)}</span>
                      <span className="text-gray-400">{selectedExperience?.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {promoCode && (
                <div className="flex items-center gap-2 text-xs text-[#d4af37] border border-[#d4af37]/20 bg-[#d4af37]/5 px-4 py-3 rounded-lg">
                  <span>🏷️</span>
                  <span>Promo code <strong>{promoCode}</strong> will be applied at checkout.</span>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">{error}</div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="w-1/3 py-4 bg-white/5 border border-white/20 text-gray-200 uppercase tracking-widest text-[10px] font-bold hover:text-white hover:bg-white/10 transition rounded-lg">Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-2/3 py-4 bg-[#d4af37] text-black border border-[#d4af37] hover:bg-white hover:border-white uppercase tracking-[0.1em] font-bold transition shadow-lg shadow-yellow-900/20 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Processing…
                    </span>
                  ) : "Pay & Book"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Footer — sits above bottom nav on mobile */}
      <div className="fixed bottom-[56px] md:bottom-0 left-0 right-0 bg-[#050a14]/95 border-t border-white/10 z-40 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-5 py-3 flex justify-between items-center">
          <div>
            <span className="text-[9px] uppercase text-gray-500 tracking-[0.2em]">Total Amount</span>
            <span className="block text-xl font-bold text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>${totalPrice.toFixed(2)}</span>
          </div>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">Step <span className="text-white">{Math.min(step, 4)}</span> / 4</span>
        </div>
      </div>
    </div>
  );
}

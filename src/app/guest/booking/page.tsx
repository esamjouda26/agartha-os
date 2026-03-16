"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  createBookingAction,
  fetchExperiencesAction,
  fetchTimeSlotsAction,
  type BookingResult,
} from "../actions/booking";

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
    fetchExperiencesAction().then(({ experiences: exps, tiers: t }) => {
      setExperiences(exps);
      setTiers(t);
      if (exps.length > 0) {
        setSelectedExperience(exps[0]);
        const expTiers = t.filter((tier) => tier.experience_id === exps[0].id);
        if (expTiers.length > 0) setSelectedTier(expTiers[0]);
      }
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

  // ── Computed values ───────────────────────────────────────────────────────

  const experienceTiers = tiers.filter((t) => t.experience_id === selectedExperience?.id);
  const totalPrice = selectedTier
    ? selectedTier.price * adultCount + selectedTier.price * 0.75 * childCount
    : 0;

  const filteredSlots = timeSlots.filter((s) => {
    const hour = parseInt(s.start_time.split(":")[0]);
    if (timeFilter === "morning") return hour >= 8 && hour < 12;
    if (timeFilter === "afternoon") return hour >= 12 && hour < 17;
    return hour >= 17;
  });

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
      setStep(5); // confirmation
    } else {
      setError(result.error ?? "Booking failed.");
    }
  }

  // ── Confirmation View ─────────────────────────────────────────────────────

  if (step === 5 && bookingResult) {
    return (
      <div className="max-w-md mx-auto px-4 pt-10 animate-[fadeIn_0.5s_ease-in-out]">
        <div className="bg-[#0a0a0a]/95 border border-[#d4af37] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)] relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#806b45] via-[#d4af37] to-[#806b45]" />

          <div className="p-8 pb-4 text-center border-b border-white/10 bg-white/5">
            <div className="w-10 h-10 mx-auto bg-gradient-to-br from-[#d4af37] to-yellow-600 rounded-full flex items-center justify-center mb-3">
              <span className="font-bold text-xl text-black" style={{ fontFamily: "'Cinzel', serif" }}>A</span>
            </div>
            <h1 className="text-2xl text-[#d4af37] font-bold tracking-wider mb-1" style={{ fontFamily: "'Cinzel', serif" }}>BOOKING CONFIRMED</h1>
            <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em]">Agartha World Theme Park</p>
          </div>

          <div className="p-8 bg-black/40">
            <div className="text-center mb-8">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Booking Reference</p>
              <div className="font-mono text-xl font-bold tracking-[0.2em] text-white">{bookingResult.booking_ref}</div>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm text-gray-300">
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
              <div className="mt-6 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
                <span className="text-emerald-400 text-xs font-bold">Discount applied: -${bookingResult.discount_applied.toFixed(2)}</span>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>${bookingResult.total_price.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white/5 p-4 flex gap-4 border-t border-white/10">
            <Button variant="outline" className="flex-1 text-gray-300" onClick={() => router.push("/guest/login")}>
              Manage Booking
            </Button>
            <Button variant="gold" className="flex-1" onClick={() => { setStep(1); setBookingResult(null); }}>
              Book Another
            </Button>
          </div>
        </div>

        <p className="text-center mt-8 text-gray-500 text-xs">A confirmation email has been sent to <span className="text-[#d4af37]">{bookingResult.booker_email}</span></p>
      </div>
    );
  }

  // ── Step Content ──────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-4 space-y-6">
      {/* Progress Bar */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-[2px] flex-1 transition-all duration-500 ${i < step ? "bg-[#d4af37] shadow-[0_0_10px_#d4af37]" : "bg-gray-700"}`} />
        ))}
      </div>

      {/* ── Step 1: Experience & Tier ────────────────────────────────────── */}
      <Card className={step === 1 ? "border-[#d4af37]/30 bg-gradient-to-b from-[#d4af37]/[0.03] to-[#0a141e]/95 shadow-[0_0_40px_rgba(212,175,55,0.08)]" : "opacity-50 cursor-pointer"} onClick={() => step > 1 && setStep(1)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-8 h-8 flex items-center justify-center rounded-full border font-bold text-sm ${step >= 1 ? "border-[#d4af37] text-[#d4af37]" : "border-gray-600 text-gray-500"}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>1</div>
            <h2 className="text-xl font-bold uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>Select Experience</h2>
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-[fadeIn_0.5s_ease-in-out]">
              {/* Tier Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {experienceTiers.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier)}
                    className={`p-4 rounded-lg text-left transition-all border ${
                      selectedTier?.id === tier.id
                        ? "border-[#d4af37] bg-gradient-to-br from-[#d4af37]/15 to-transparent shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                        : "border-white/15 bg-white/[0.03] hover:border-[#d4af37] hover:bg-[#d4af37]/5 hover:-translate-y-0.5"
                    }`}
                  >
                    <h3 className={`text-sm uppercase tracking-widest mb-1 ${selectedTier?.id === tier.id ? "text-[#d4af37]" : "text-gray-200"}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>{tier.tier_name}</h3>
                    <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Orbitron', sans-serif" }}>${tier.price.toFixed(0)}</p>
                    <p className="text-[9px] text-gray-400 uppercase mb-4">Child: ${(tier.price * 0.75).toFixed(0)}</p>
                    <ul className="text-xs text-gray-300 space-y-2">
                      {tier.perks?.slice(0, 3).map((perk, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${selectedTier?.id === tier.id ? "bg-[#d4af37]" : "bg-gray-400"}`} />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              {/* Guest Count */}
              <div className="space-y-3">
                {[
                  { label: "Adults", count: adultCount, set: setAdultCount, min: 1 },
                  { label: "Children", count: childCount, set: setChildCount, min: 0 },
                ].map(({ label, count, set, min }) => (
                  <div key={label} className="flex items-center justify-between bg-white/5 p-4 border border-white/20 rounded-lg">
                    <span className="text-xs text-gray-200 uppercase tracking-widest">{label}</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => set(Math.max(min, count - 1))} className="w-8 h-8 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition rounded-full text-lg">−</button>
                      <span className="text-xl text-white font-bold w-6 text-center" style={{ fontFamily: "'Orbitron', sans-serif" }}>{count}</span>
                      <button onClick={() => set(Math.min(10, count + 1))} className="w-8 h-8 bg-[#d4af37]/20 hover:bg-[#d4af37]/40 flex items-center justify-center text-[#d4af37] transition rounded-full text-lg">+</button>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="gold" size="lg" className="w-full" onClick={() => setStep(2)}>
                Continue →
              </Button>
            </div>
          )}

          {step > 1 && (
            <div className="flex justify-between items-center pl-12 text-xs text-gray-400">
              <span><strong className="text-white uppercase">{selectedTier?.tier_name}</strong> × {adultCount} Adult{adultCount > 1 ? "s" : ""}{childCount > 0 ? `, ${childCount} Child${childCount > 1 ? "ren" : ""}` : ""}</span>
              <span className="text-[#d4af37] font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>${totalPrice.toFixed(2)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Step 2: Date & Time ─────────────────────────────────────────── */}
      {step >= 2 && (
        <Card className={step === 2 ? "border-[#d4af37]/30 bg-gradient-to-b from-[#d4af37]/[0.03] to-[#0a141e]/95 shadow-[0_0_40px_rgba(212,175,55,0.08)]" : "opacity-50 cursor-pointer"} onClick={() => step > 2 && setStep(2)}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full border font-bold text-sm ${step >= 2 ? "border-[#d4af37] text-[#d4af37]" : "border-gray-600 text-gray-500"}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>2</div>
              <h2 className="text-xl font-bold uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>Date & Time</h2>
            </div>

            {step === 2 && (
              <div className="space-y-6 animate-[fadeIn_0.5s_ease-in-out]">
                {/* Calendar */}
                <div className="bg-black/30 p-4 border border-white/20 rounded-lg">
                  <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                    <span className="font-bold text-white text-sm" style={{ fontFamily: "'Orbitron', sans-serif" }}>{MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))} className="p-1 hover:text-white text-gray-300 transition">‹</button>
                      <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))} className="p-1 hover:text-white text-gray-300 transition">›</button>
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
                    <div className="flex gap-2 mb-3">
                      {(["morning", "afternoon", "evening"] as const).map((period) => (
                        <button
                          key={period}
                          onClick={() => setTimeFilter(period)}
                          className={`flex-1 py-2 text-[10px] uppercase tracking-widest border-b-2 transition font-bold ${
                            timeFilter === period ? "border-[#d4af37] text-[#d4af37]" : "border-transparent text-gray-500 hover:text-gray-300"
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-4">
                      {filteredSlots.map((slot) => (
                        <button
                          key={slot.id}
                          disabled={slot.available <= 0}
                          onClick={() => setSelectedSlot(slot)}
                          className={`flex-shrink-0 px-5 py-2.5 border rounded-lg text-xs transition whitespace-nowrap ${
                            selectedSlot?.id === slot.id
                              ? "bg-[#d4af37] text-black border-[#d4af37] font-bold"
                              : slot.available <= 0
                              ? "border-white/10 text-gray-600 cursor-not-allowed opacity-30"
                              : "border-white/20 bg-white/10 text-gray-200 hover:border-[#d4af37]"
                          }`}
                        >
                          {slot.start_time.slice(0, 5)}
                        </button>
                      ))}
                      {filteredSlots.length === 0 && <p className="text-gray-500 text-xs py-4">No slots available for this period.</p>}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" size="lg" className="w-1/3 text-gray-200" onClick={() => setStep(1)}>Back</Button>
                  <Button variant="gold" size="lg" className="w-2/3" disabled={!selectedDate || !selectedSlot} onClick={() => setStep(3)}>Continue</Button>
                </div>
              </div>
            )}

            {step > 2 && selectedDate && selectedSlot && (
              <div className="flex justify-between items-center pl-12 text-xs text-gray-400">
                <span><strong className="text-white">{selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong> @ <strong className="text-white">{selectedSlot.start_time.slice(0, 5)}</strong></span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Details ──────────────────────────────────────────────── */}
      {step >= 3 && (
        <Card className={step === 3 ? "border-[#d4af37]/30 bg-gradient-to-b from-[#d4af37]/[0.03] to-[#0a141e]/95 shadow-[0_0_40px_rgba(212,175,55,0.08)]" : "opacity-50 cursor-pointer"} onClick={() => step > 3 && setStep(3)}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full border font-bold text-sm ${step >= 3 ? "border-[#d4af37] text-[#d4af37]" : "border-gray-600 text-gray-500"}`} style={{ fontFamily: "'Orbitron', sans-serif" }}>3</div>
              <h2 className="text-xl font-bold uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>Details & Features</h2>
            </div>

            {step === 3 && (
              <div className="space-y-6 animate-[fadeIn_0.5s_ease-in-out]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Group Leader Name</Label><Input placeholder="John Doe" value={bookerName} onChange={(e) => setBookerName(e.target.value)} /></div>
                  <div><Label>Email Address (Required)</Label><Input type="email" placeholder="john@example.com" value={bookerEmail} onChange={(e) => setBookerEmail(e.target.value)} /></div>
                </div>

                <div className="space-y-3">
                  {[
                    { id: "auto-capture", label: "Auto-Capture Moments", desc: "Automatically capture high-quality action shots on rides.", checked: autoCapture, set: setAutoCapture, color: "purple-500" },
                    { id: "face-pay", label: "Enable Face Pay", desc: "Link biometrics for hands-free purchases inside the park.", checked: facePay, set: setFacePay, color: "[#d4af37]" },
                  ].map((feat) => (
                    <div key={feat.id} className="p-4 border border-white/10 bg-white/5 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-sm">{feat.label}</span>
                        <p className="text-[10px] text-gray-400 mt-0.5 max-w-[250px]">{feat.desc}</p>
                      </div>
                      <button onClick={() => feat.set(!feat.checked)} className={`w-10 h-5 rounded-full transition-colors relative ${feat.checked ? `bg-${feat.color}` : "bg-gray-800 border border-gray-600"}`}>
                        <div className={`absolute top-[1px] w-4 h-4 bg-white rounded-full transition-transform ${feat.checked ? "translate-x-5" : "translate-x-[1px]"}`} />
                      </button>
                    </div>
                  ))}
                </div>

                <div><Label>Promo Code (Optional)</Label><Input placeholder="Enter promo code" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} /></div>

                <div className="flex items-start gap-2">
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 accent-[#d4af37]" />
                  <label className="text-[10px] text-gray-300">I agree to the <span className="text-[#d4af37] underline cursor-pointer">Terms & Conditions</span> and Privacy Policy.</label>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" size="lg" className="w-1/3 text-gray-200" onClick={() => setStep(2)}>Back</Button>
                  <Button variant="gold" size="lg" className="w-2/3" disabled={!bookerName || !bookerEmail || !termsAccepted} onClick={() => setStep(4)}>Proceed to Payment</Button>
                </div>
              </div>
            )}

            {step > 3 && (
              <div className="flex justify-between items-center pl-12 text-xs text-gray-400">
                <span className="text-white font-bold">{bookerName}</span>
                <span className="text-purple-400">{autoCapture && facePay ? "Auto-Capture + Face Pay" : autoCapture ? "Auto-Capture" : facePay ? "Face Pay" : "Standard"}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Step 4: Payment ──────────────────────────────────────────────── */}
      {step >= 4 && (
        <Card className="border-[#d4af37]/30 bg-gradient-to-b from-[#d4af37]/[0.03] to-[#0a141e]/95 shadow-[0_0_40px_rgba(212,175,55,0.08)]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 flex items-center justify-center rounded-full border border-[#d4af37] text-[#d4af37] font-bold text-sm" style={{ fontFamily: "'Orbitron', sans-serif" }}>4</div>
              <h2 className="text-xl font-bold uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>Payment</h2>
            </div>

            <div className="space-y-6 animate-[fadeIn_0.5s_ease-in-out]">
              <div className="bg-black/40 p-6 rounded-lg border border-white/20">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-300 text-xs uppercase tracking-widest">Order Summary</span>
                  <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between"><span>{selectedTier?.tier_name} × {adultCount} Adult{adultCount > 1 ? "s" : ""}</span><span className="text-white">${(selectedTier ? selectedTier.price * adultCount : 0).toFixed(2)}</span></div>
                  {childCount > 0 && <div className="flex justify-between"><span>{selectedTier?.tier_name} × {childCount} Child{childCount > 1 ? "ren" : ""}</span><span className="text-white">${(selectedTier ? selectedTier.price * 0.75 * childCount : 0).toFixed(2)}</span></div>}
                </div>
              </div>

              {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">{error}</div>}

              <div className="flex gap-3">
                <Button variant="outline" size="lg" className="w-1/3 text-gray-200" onClick={() => setStep(3)}>Back</Button>
                <Button variant="gold" size="lg" className="w-2/3" disabled={loading} onClick={handleSubmit}>
                  {loading ? "Processing..." : "Pay & Book"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#050a14]/95 border-t border-white/10 z-40 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <span className="text-[9px] uppercase text-gray-500 tracking-[0.2em]">Total Amount</span>
            <span className="block text-2xl font-bold text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>${totalPrice.toFixed(2)}</span>
          </div>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">Step <span className="text-white">{Math.min(step, 4)}</span> / 4</span>
        </div>
      </div>
    </div>
  );
}

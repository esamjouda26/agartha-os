"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { requestOtpAction } from "../actions/auth";

export default function GuestLoginPage() {
  const router = useRouter();
  const [bookingRef, setBookingRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const result = await requestOtpAction(bookingRef);
    setLoading(false);

    if (result.success && result.data) {
      // Store ref and masked email for the verify page
      sessionStorage.setItem("otp_booking_ref", result.data.booking_ref);
      sessionStorage.setItem("otp_masked_email", result.data.masked_email);

      // In dev mode, show OTP in toast
      if (result.data.otp_code) {
        setToast(`[Dev] OTP: ${result.data.otp_code}`);
        setTimeout(() => router.push("/guest/verify"), 2000);
      } else {
        router.push("/guest/verify");
      }
    } else {
      setError(result.error ?? "Request failed.");
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 mt-10">
      <Card className="border-[#d4af37]/20">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            </div>
            <h1 className="text-2xl text-white font-bold tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>SECURE ACCESS</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-1">Manage Your Booking</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Booking Reference</Label>
              <Input
                placeholder="AG-000-XX"
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
                className="font-mono tracking-widest uppercase"
              />
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <Button variant="gold" size="lg" className="w-full" disabled={loading || !bookingRef} onClick={handleSubmit}>
              {loading ? "Verifying..." : "Continue"}
            </Button>

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-white/10" />
              <span className="flex-shrink-0 mx-4 text-gray-500 text-[10px] uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t border-white/10" />
            </div>

            <Button variant="outline" size="lg" className="w-full text-[#d4af37] border-[#d4af37]/50 hover:bg-[#d4af37]/10" onClick={() => router.push("/guest/booking")}>
              Book a New Visit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dev Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-emerald-900/90 border border-emerald-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 backdrop-blur-md z-50 animate-[fadeIn_0.3s_ease-in-out]">
          <span className="text-sm font-bold tracking-wide">{toast}</span>
        </div>
      )}
    </div>
  );
}

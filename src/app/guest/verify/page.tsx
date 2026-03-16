"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { verifyOtpAction, requestOtpAction } from "../actions/auth";

export default function GuestVerifyPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState("e***m@example.com");
  const [bookingRef, setBookingRef] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const ref = sessionStorage.getItem("otp_booking_ref");
    const email = sessionStorage.getItem("otp_masked_email");
    if (!ref) {
      router.push("/guest/login");
      return;
    }
    setBookingRef(ref);
    if (email) setMaskedEmail(email);
    inputRefs.current[0]?.focus();
  }, [router]);

  function handleInput(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = otp.join("");
    if (code.length !== 6) return;

    setLoading(true);
    setError(null);

    const result = await verifyOtpAction(bookingRef, code);
    setLoading(false);

    if (result.success) {
      sessionStorage.removeItem("otp_booking_ref");
      sessionStorage.removeItem("otp_masked_email");
      router.push("/guest/manage");
    } else {
      setError(result.error ?? "Verification failed.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  }

  async function handleResend() {
    const result = await requestOtpAction(bookingRef);
    if (result.success && result.data?.otp_code) {
      setToast(`[Dev] New OTP: ${result.data.otp_code}`);
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 mt-10">
      <Card className="border-[#d4af37]/20">
        <CardContent className="p-8">
          <button onClick={() => router.push("/guest/login")} className="text-xs text-gray-400 mb-4 hover:text-white flex items-center gap-1 uppercase tracking-widest transition">
            ← Back
          </button>

          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            </div>
            <h1 className="text-2xl text-white font-bold tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>VERIFY IDENTITY</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-1">Authentication Required</p>
          </div>

          <p className="text-sm text-gray-300 text-center mb-6 leading-relaxed">
            A 6-digit verification code has been sent to<br />
            <strong className="text-[#d4af37] tracking-widest">{maskedEmail}</strong>
          </p>

          {/* OTP Inputs */}
          <div className="flex gap-2 justify-center mb-8">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 rounded bg-white/5 border border-white/20 text-white text-center text-xl font-bold focus:bg-black/80 focus:border-[#d4af37] focus:shadow-[0_0_15px_rgba(212,175,55,0.2)] outline-none transition"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              />
            ))}
          </div>

          {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

          <Button variant="gold" size="lg" className="w-full" disabled={loading || otp.join("").length !== 6} onClick={handleVerify}>
            {loading ? "Verifying..." : "Decrypt Dashboard"}
          </Button>

          <p className="text-center mt-4 text-[10px] text-gray-500">
            Didn&apos;t receive a code?{" "}
            <button className="text-[#d4af37] hover:underline" onClick={handleResend}>Resend</button>
          </p>
        </CardContent>
      </Card>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-900/90 border border-emerald-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 backdrop-blur-md z-50 animate-[fadeIn_0.3s_ease-in-out]">
          <span className="text-sm font-bold tracking-wide">{toast}</span>
        </div>
      )}
    </div>
  );
}

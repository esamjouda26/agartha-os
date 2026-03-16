"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { guestSignOutAction } from "../actions/auth";

interface Attendee {
  id: string;
  attendee_type: string;
  attendee_index: number;
  nickname: string;
  biometric_ref: string | null;
}

interface BookingData {
  id: string;
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

export function GuestDashboardClient({ booking }: { booking: Record<string, unknown> }) {
  const router = useRouter();
  const b = booking as unknown as BookingData;

  const formattedDate = new Date(b.slot_date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  async function handleSignOut() {
    await guestSignOutAction();
    router.push("/guest/login");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-white/10 pb-4 mb-2">
        <div>
          <h2 className="text-2xl text-white font-bold tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>BOOKING MANAGEMENT</h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">
            Welcome back, <span className="text-[#d4af37]">{b.booker_name}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Reference</p>
            <p className="font-mono text-lg text-white tracking-widest font-bold bg-white/5 px-3 py-1 rounded border border-white/10">{b.booking_ref}</p>
          </div>
          <button onClick={handleSignOut} className="text-xs text-gray-400 hover:text-[#d4af37] uppercase tracking-widest transition">Sign Out</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content (2 columns) */}
        <div className="md:col-span-2 space-y-6">
          {/* Itinerary */}
          <Card className="border-[#d4af37]/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                </div>
                <div>
                  <h3 className="text-lg text-white font-bold tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>Itinerary Details</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Current Booking Schedule</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-black/40 p-4 rounded-lg border border-white/5">
                <div>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Date</span>
                  <span className="block text-lg text-white font-bold">{formattedDate}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Entry Time</span>
                  <span className="block text-lg text-[#d4af37] font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>{b.start_time?.slice(0, 5)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Duration</span>
                  <span className="block text-sm text-white font-bold">{b.duration_minutes} minutes</span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Status</span>
                  <Badge variant={b.status === "confirmed" ? "success" : b.status === "completed" ? "gold" : "outline"}>
                    {b.status}
                  </Badge>
                </div>
              </div>

              {/* Perks */}
              {b.perks && b.perks.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {b.perks.map((perk, i) => (
                    <Badge key={i} variant="outline" className="text-gray-300 border-white/10">{perk}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guest Details & Biometrics */}
          <Card className="border-[#d4af37]/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg text-white font-bold tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>Guest Details</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Attendee Roster</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-white/10 pb-6 mb-6">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                  <div>
                    <span className="block text-sm font-bold text-white">Auto-Capture</span>
                    <span className="block text-[10px] text-gray-400">Ride action photos</span>
                  </div>
                  <Badge variant={b.auto_capture_opt ? "success" : "outline"}>{b.auto_capture_opt ? "Enabled" : "Disabled"}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                  <div>
                    <span className="block text-sm font-bold text-[#d4af37]">Face Pay</span>
                    <span className="block text-[10px] text-gray-400">Hands-free purchases</span>
                  </div>
                  <Badge variant={b.face_pay_enabled ? "gold" : "outline"}>{b.face_pay_enabled ? "Enabled" : "Disabled"}</Badge>
                </div>
              </div>

              {/* Biometric Vault Link */}
              <div
                onClick={() => router.push("/guest/manage/biometrics")}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-[#d4af37]/5 to-transparent border border-[#d4af37]/20 rounded-lg cursor-pointer hover:border-[#d4af37]/40 hover:bg-[#d4af37]/10 transition-all group mb-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-[#d4af37] group-hover:text-[#e5c040] transition">Biometric Vault</span>
                    <span className="block text-[10px] text-gray-400">Manage enrollment &amp; privacy settings</span>
                  </div>
                </div>
                <span className="text-gray-500 group-hover:text-[#d4af37] transition text-lg">→</span>
              </div>

              {/* Attendee List */}
              <div className="space-y-3">
                {b.attendees?.map((attendee) => (
                  <div
                    key={attendee.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition ${
                      attendee.biometric_ref
                        ? "bg-white/5 border-white/10"
                        : "bg-yellow-900/10 border-yellow-500/30"
                    }`}
                  >
                    <div>
                      <p className="text-white font-bold text-sm">{attendee.nickname}</p>
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
            </CardContent>
          </Card>

          {/* Memories Vault (placeholder) */}
          <Card className="border-[#d4af37]/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75" /></svg>
                </div>
                <div>
                  <h3 className="text-lg text-white font-bold tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>Memories Vault</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Auto-Captured Ride Photos</p>
                </div>
              </div>

              <div className="text-center py-10 border border-dashed border-white/10 rounded-lg bg-white/5">
                <svg className="w-8 h-8 text-gray-500 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
                <h4 className="text-sm font-bold text-gray-300">Awaiting Memories</h4>
                <p className="text-xs text-gray-500 mt-1 px-4 max-w-sm mx-auto">
                  Your action photos will automatically sync here during your visit on{" "}
                  <span className="text-[#d4af37] font-bold">{formattedDate}</span>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — Digital Pass */}
        <div>
          <Card className="border-[#d4af37]/20 h-full">
            <CardContent className="p-6 text-center flex flex-col items-center justify-between h-full">
              <div className="w-full">
                <h3 className="text-sm text-[#d4af37] font-bold tracking-widest mb-4 border-b border-white/10 pb-2 uppercase" style={{ fontFamily: "'Cinzel', serif" }}>Digital Pass</h3>

                {/* QR Code placeholder */}
                <div className="bg-white p-3 rounded-lg inline-block mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  <div className="w-[130px] h-[130px] bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-800 text-[8px] font-mono text-center break-all px-1">{b.qr_code_ref}</p>
                  </div>
                </div>

                <div className="space-y-3 text-left bg-black/30 p-4 rounded border border-white/5 w-full">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Tier</span>
                    <span className="text-xs text-[#d4af37] font-bold tracking-wider uppercase" style={{ fontFamily: "'Orbitron', sans-serif" }}>{b.tier_name}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Party Size</span>
                    <span className="text-xs text-white font-bold">
                      {b.adult_count} Adult{b.adult_count > 1 ? "s" : ""}
                      {b.child_count > 0 ? `, ${b.child_count} Child${b.child_count > 1 ? "ren" : ""}` : ""}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Total</span>
                    <span className="text-xs text-white font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>${Number(b.total_price).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" size="lg" className="w-full mt-6 text-gray-300" onClick={() => window.print()}>
                Save / Print Pass
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

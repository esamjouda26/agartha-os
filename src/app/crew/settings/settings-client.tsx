"use client";

import { useState, useTransition } from "react";
import {
  User, Phone, MapPin, Heart, CheckCircle2, Loader2,
  ChevronRight, Shield, BadgeCheck, LogOut
} from "lucide-react";
import { updateStaffProfile } from "./actions";
import type { StaffProfile } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type EditSection = "contact" | "emergency" | null;

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-white/5 last:border-0">
      <span className="text-xs text-gray-500 uppercase tracking-wider w-32 shrink-0">{label}</span>
      <span className="text-sm text-white text-right">{value || "—"}</span>
    </div>
  );
}

function EditField({
  label, value, onChange, placeholder, type = "text"
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:border-[#d4af37] focus:outline-none transition min-h-[44px]"
      />
    </div>
  );
}

export default function SettingsClient({
  profile,
  userEmail,
}: {
  profile: StaffProfile | null;
  userEmail: string;
}) {
  const router = useRouter();
  const [editSection, setEditSection] = useState<EditSection>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Contact form state
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");

  // Emergency contact form state
  const [kinName, setKinName] = useState(profile?.kin_name ?? "");
  const [kinPhone, setKinPhone] = useState(profile?.kin_phone ?? "");
  const [kinRelationship, setKinRelationship] = useState(profile?.kin_relationship ?? "");

  function handleSave() {
    setSuccessMsg(null);
    setErrorMsg(null);
    startTransition(async () => {
      const result = await updateStaffProfile({
        phone, address, kin_name: kinName, kin_phone: kinPhone, kin_relationship: kinRelationship,
      });
      if (result.success) {
        setSuccessMsg("Profile updated successfully.");
        setEditSection(null);
      } else {
        setErrorMsg(result.error ?? "Update failed.");
      }
    });
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const roleLabel = profile?.role?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Crew";

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24">
      {/* Profile card */}
      <div className="glass-panel-gold p-6 rounded-2xl border border-[#d4af37]/20">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-[#806b45]/10 border border-[#d4af37]/30 flex items-center justify-center shrink-0">
            <User className="text-[#d4af37]" size={28} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{profile?.legal_name ?? "—"}</h2>
            <span className="inline-flex items-center gap-1.5 mt-1 text-[10px] font-bold uppercase tracking-widest text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/20 px-2.5 py-1 rounded-full">
              <BadgeCheck size={10} /> {roleLabel}
            </span>
          </div>
        </div>

        {/* Read-only identity fields */}
        <div className="space-y-1 bg-black/20 rounded-xl px-4 py-2">
          <Field label="Employee ID" value={profile?.employee_id ?? null} />
          <Field label="Email" value={userEmail} />
        </div>
      </div>

      {/* Feedback */}
      {successMsg && (
        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-300">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Contact Info */}
      <div className="bg-black/30 border border-white/8 rounded-2xl overflow-hidden">
        <button
          onClick={() => setEditSection(editSection === "contact" ? null : "contact")}
          className="w-full flex items-center justify-between px-5 py-4 min-h-[52px] hover:bg-white/5 transition"
        >
          <div className="flex items-center gap-3">
            <Phone size={16} className="text-[#d4af37]" />
            <span className="text-sm font-semibold text-white">Contact Information</span>
          </div>
          <ChevronRight size={16} className={`text-gray-500 transition-transform ${editSection === "contact" ? "rotate-90" : ""}`} />
        </button>

        {editSection !== "contact" ? (
          <div className="px-5 pb-4 space-y-1">
            <Field label="Phone" value={profile?.phone ?? null} />
            <Field label="Address" value={profile?.address ?? null} />
          </div>
        ) : (
          <div className="px-5 pb-5 space-y-3 border-t border-white/5">
            <div className="pt-4 space-y-3">
              <EditField label="Phone Number" value={phone} onChange={setPhone} placeholder="+60 12-345 6789" type="tel" />
              <EditField label="Home Address" value={address} onChange={setAddress} placeholder="Street, City, State" />
            </div>
          </div>
        )}
      </div>

      {/* Emergency Contact */}
      <div className="bg-black/30 border border-white/8 rounded-2xl overflow-hidden">
        <button
          onClick={() => setEditSection(editSection === "emergency" ? null : "emergency")}
          className="w-full flex items-center justify-between px-5 py-4 min-h-[52px] hover:bg-white/5 transition"
        >
          <div className="flex items-center gap-3">
            <Heart size={16} className="text-red-400" />
            <span className="text-sm font-semibold text-white">Emergency Contact</span>
          </div>
          <ChevronRight size={16} className={`text-gray-500 transition-transform ${editSection === "emergency" ? "rotate-90" : ""}`} />
        </button>

        {editSection !== "emergency" ? (
          <div className="px-5 pb-4 space-y-1">
            <Field label="Name" value={profile?.kin_name ?? null} />
            <Field label="Relationship" value={profile?.kin_relationship ?? null} />
            <Field label="Phone" value={profile?.kin_phone ?? null} />
          </div>
        ) : (
          <div className="px-5 pb-5 space-y-3 border-t border-white/5">
            <div className="pt-4 space-y-3">
              <EditField label="Full Name" value={kinName} onChange={setKinName} placeholder="Next of kin name" />
              <EditField label="Relationship" value={kinRelationship} onChange={setKinRelationship} placeholder="e.g. Mother, Spouse" />
              <EditField label="Phone Number" value={kinPhone} onChange={setKinPhone} placeholder="+60 12-345 6789" type="tel" />
            </div>
          </div>
        )}
      </div>

      {/* Save button — only shown when editing */}
      {editSection && (
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full py-4 rounded-2xl bg-[#d4af37] text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#c9a227] active:scale-95 transition disabled:opacity-60 min-h-[44px]"
        >
          {isPending ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save Changes"}
        </button>
      )}

      {/* Security info */}
      <div className="flex items-center gap-3 px-4 py-3 bg-black/20 rounded-xl border border-white/5">
        <Shield size={14} className="text-gray-600 shrink-0" />
        <p className="text-[11px] text-gray-600">Sensitive fields (bank details, national ID, salary) can only be updated by HR.</p>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 active:scale-95 transition font-bold text-sm min-h-[44px]"
      >
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { biometricOptInAction, biometricRevokeAction } from "../../actions/biometrics";

interface BiometricsStatus {
  enrolled: boolean;
  created_at: string | null;
  error?: string;
}

export function BiometricsClient({
  bookingRef,
  initialStatus,
}: {
  bookingRef: string;
  initialStatus: BiometricsStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleOptIn() {
    setLoading(true);
    const result = await biometricOptInAction();
    if (result.success) {
      setStatus({ enrolled: true, created_at: new Date().toISOString() });
      showToast("Biometric enrollment successful", "success");
    } else if (result.error === "ALREADY_ENROLLED") {
      showToast("Already enrolled — your data is active", "success");
      setStatus({ enrolled: true, created_at: status.created_at });
    } else {
      showToast(result.error || "Enrollment failed", "error");
    }
    setLoading(false);
  }

  async function handleRevoke() {
    setLoading(true);
    const result = await biometricRevokeAction();
    if (result.success) {
      setStatus({ enrolled: false, created_at: null });
      setConfirmRevoke(false);
      showToast("All biometric data has been permanently purged", "success");
    } else {
      showToast(result.error || "Revocation failed", "error");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-white/10 pb-4">
        <div>
          <h2
            className="text-2xl text-white font-bold tracking-wider"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            BIOMETRIC VAULT
          </h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">
            Privacy-first biometric enrollment
          </p>
        </div>
        <button
          onClick={() => router.push("/guest/manage")}
          className="text-xs text-gray-400 hover:text-[#d4af37] uppercase tracking-widest transition"
        >
          ← Dashboard
        </button>
      </div>

      {/* Privacy Policy Card */}
      <div className="bg-gradient-to-br from-[#1a1a2e]/80 to-[#16213e]/80 border border-[#d4af37]/15 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex-shrink-0 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <h3
              className="text-sm text-[#d4af37] font-bold tracking-widest uppercase mb-3"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Privacy Commitment
            </h3>
            <div className="space-y-3 text-[13px] text-gray-300 leading-relaxed">
              <p>
                Your biometric data is used <strong className="text-white">exclusively</strong> for:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-[#d4af37] mt-0.5">▸</span>
                  <span><strong className="text-white">Automatic photo-capture</strong> on rides — your memories sync instantly to your Vault</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#d4af37] mt-0.5">▸</span>
                  <span><strong className="text-white">Frictionless turnstile entry</strong> — no phone or ticket needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#d4af37] mt-0.5">▸</span>
                  <span><strong className="text-white">Face Pay</strong> — hands-free in-park purchases</span>
                </li>
              </ul>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 mt-3">
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  🔒 Data is <strong className="text-green-400">cryptographically hashed</strong> and stored in an isolated vault.
                  It is <strong className="text-green-400">automatically purged 2 hours</strong> after your session ends.
                  You may revoke consent and erase all data at any time. Compliant with GDPR Article 17 &amp; PDPA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className={`border rounded-xl p-6 transition-all ${
        status.enrolled
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-white/5 border-white/10"
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${status.enrolled ? "bg-emerald-500 animate-pulse" : "bg-gray-600"}`} />
            <h4 className="text-sm font-bold text-white uppercase tracking-widest">
              Enrollment Status
            </h4>
          </div>
          <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
            status.enrolled
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : "text-gray-500 bg-white/5 border-white/10"
          }`}>
            {status.enrolled ? "ACTIVE" : "NOT ENROLLED"}
          </span>
        </div>

        {status.enrolled && status.created_at && (
          <p className="text-[11px] text-gray-400 mb-4">
            Enrolled on{" "}
            <span className="text-white font-mono">
              {new Date(status.created_at).toLocaleString()}
            </span>
          </p>
        )}

        <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-1">
          <span className="font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10 text-gray-300">
            {bookingRef}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      {!status.enrolled ? (
        <button
          onClick={handleOptIn}
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#d4af37] to-[#b8962f] text-black font-bold py-4 px-6 rounded-xl hover:opacity-90 transition-all text-sm uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#d4af37]/10"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> Enrolling…
            </span>
          ) : (
            "🛡 Opt-In to Biometric Services"
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
            <span className="text-emerald-400 text-lg">✓</span>
            <div>
              <p className="text-sm text-white font-bold">Biometric services are active</p>
              <p className="text-[11px] text-gray-400">
                Face Pay, auto-capture, and frictionless entry are enabled for your visit.
              </p>
            </div>
          </div>

          {!confirmRevoke ? (
            <button
              onClick={() => setConfirmRevoke(true)}
              className="w-full bg-red-500/10 border-2 border-red-500/30 text-red-400 font-bold py-4 px-6 rounded-xl hover:bg-red-500/20 hover:border-red-500/50 transition-all text-sm uppercase tracking-widest"
            >
              🗑 Revoke &amp; Purge My Data
            </button>
          ) : (
            <div className="bg-red-500/5 border-2 border-red-500/30 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-xl">⚠</span>
                <div>
                  <p className="text-sm text-red-400 font-bold uppercase tracking-widest">
                    Confirm Data Purge
                  </p>
                  <p className="text-[12px] text-gray-300 mt-2 leading-relaxed">
                    This will <strong className="text-red-400">permanently delete</strong> your biometric
                    vector from our vault. Face Pay, auto-capture, and frictionless entry will be{" "}
                    <strong className="text-red-400">immediately disabled</strong>. This action is{" "}
                    <strong className="text-white">irreversible</strong>.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRevoke}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-all text-xs uppercase tracking-widest disabled:opacity-40"
                >
                  {loading ? "Purging…" : "Yes — Permanently Delete"}
                </button>
                <button
                  onClick={() => setConfirmRevoke(false)}
                  className="px-6 py-3 bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 transition text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 backdrop-blur-md z-[60] border ${
            toast.type === "success"
              ? "bg-emerald-500/90 border-emerald-500 text-white"
              : "bg-red-500/90 border-red-500 text-white"
          }`}
        >
          <span className="text-sm font-bold tracking-wide">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

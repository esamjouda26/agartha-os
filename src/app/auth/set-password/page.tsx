"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Lock } from "lucide-react";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MIN_LENGTH = 12;

  const strength = (() => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= MIN_LENGTH) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Strong", "Very Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#22c55e", "#d4af37"][strength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (strength < 3) {
      setError("Password is too weak. Include uppercase, numbers, and symbols.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Update the password via Supabase Auth (user is already signed in via magic link)
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Mark password_set = true via API route (needs admin client to update app_metadata)
    await fetch("/api/auth/mark-password-set", { method: "POST" });

    // Redirect to login so new session picks up updated app_metadata
    router.push("/login?password_set=true");
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #020408 0%, #0a0e1a 50%, #020408 100%)",
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 440, padding: 40,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(212,175,55,0.2)",
        borderRadius: 16,
        boxShadow: "0 0 60px rgba(212,175,55,0.06), 0 20px 60px rgba(0,0,0,0.5)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Lock size={24} color="#d4af37" />
          </div>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            Set Your Password
          </h1>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>
            This is a one-time setup. Choose a strong password to activate your workspace account.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Password field */}
          <div>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password-input"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{
                  width: "100%", padding: "12px 44px 12px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, color: "#fff", fontSize: 14,
                  outline: "none", boxSizing: "border-box",
                }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0,
              }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Strength meter */}
            {password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= strength ? strengthColor : "rgba(255,255,255,0.08)",
                      transition: "background 0.3s",
                    }} />
                  ))}
                </div>
                <p style={{ color: strengthColor, fontSize: 11, margin: 0 }}>{strengthLabel}</p>
              </div>
            )}
          </div>

          {/* Confirm field */}
          <div>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Confirm Password
            </label>
            <input
              id="confirm-input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              style={{
                width: "100%", padding: "12px 14px",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${confirm && confirm !== password ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 8, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Requirements */}
          <ul style={{ color: "#64748b", fontSize: 11, paddingLeft: 16, margin: 0 }}>
            <li style={{ color: password.length >= MIN_LENGTH ? "#22c55e" : "#64748b" }}>At least {MIN_LENGTH} characters</li>
            <li style={{ color: /[A-Z]/.test(password) ? "#22c55e" : "#64748b" }}>One uppercase letter</li>
            <li style={{ color: /[0-9]/.test(password) ? "#22c55e" : "#64748b" }}>One number</li>
            <li style={{ color: /[^A-Za-z0-9]/.test(password) ? "#22c55e" : "#64748b" }}>One special character</li>
          </ul>

          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            id="set-password-submit"
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "13px 0",
              background: loading ? "rgba(212,175,55,0.3)" : "#d4af37",
              color: "#0a0e1a", fontWeight: 700, fontSize: 14,
              border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}
          >
            <ShieldCheck size={16} />
            {loading ? "Activating Account…" : "Activate Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

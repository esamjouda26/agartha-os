"use client";

import { createClient } from "@/lib/supabase/client";
import { ShieldOff } from "lucide-react";

export default function AccessRevokedPage() {
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #020408 0%, #0a0e1a 50%, #020408 100%)",
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 460, padding: 48,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: 16,
        boxShadow: "0 0 60px rgba(239,68,68,0.06), 0 20px 60px rgba(0,0,0,0.5)",
        textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <ShieldOff size={28} color="#f87171" />
        </div>

        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          Access Revoked
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, margin: "0 0 32px" }}>
          Your access to the AgarthaOS workspace has been suspended or terminated.
          If you believe this is an error, contact your HR or IT department.
        </p>

        <button
          id="sign-out-btn"
          onClick={handleSignOut}
          style={{
            padding: "11px 28px",
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, color: "#f87171",
            fontWeight: 600, fontSize: 13, cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

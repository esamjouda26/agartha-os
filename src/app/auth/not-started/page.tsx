"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Clock, CalendarDays } from "lucide-react";

export default function ContractNotStartedPage() {
  const [contractStart, setContractStart] = useState<string | null>(null);
  const [workEmail, setWorkEmail] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContractStart() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Work email is on auth.users.email
      setWorkEmail(user.email ?? null);

      // Fetch contract_start from staff_records via profiles.staff_record_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("staff_record_id")
        .eq("id", user.id)
        .single();

      if (profile?.staff_record_id) {
        const { data: sr } = await supabase
          .from("staff_records")
          .select("contract_start")
          .eq("id", profile.staff_record_id)
          .single();

        if (sr?.contract_start) {
          const d = new Date(sr.contract_start);
          setContractStart(d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
        }
      }
    }
    fetchContractStart();
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #020408 0%, #0a0e1a 50%, #020408 100%)",
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 480, padding: 48,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(59,130,246,0.2)",
        borderRadius: 16,
        boxShadow: "0 0 60px rgba(59,130,246,0.06), 0 20px 60px rgba(0,0,0,0.5)",
        textAlign: "center",
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(59,130,246,0.1)",
          border: "1px solid rgba(59,130,246,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <Clock size={28} color="#60a5fa" />
        </div>

        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          Your Account Is Ready
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, margin: "0 0 28px" }}>
          Your workspace account has been successfully set up. However, your contract has not started yet.
          You&apos;ll get full access on your first day.
        </p>

        {contractStart && (
          <div style={{
            padding: "16px 20px",
            background: "rgba(59,130,246,0.06)",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            marginBottom: 24,
          }}>
            <CalendarDays size={18} color="#60a5fa" />
            <div style={{ textAlign: "left" }}>
              <p style={{ color: "#60a5fa", fontWeight: 700, fontSize: 13, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Contract Start Date
              </p>
              <p style={{ color: "#e2e8f0", fontSize: 14, margin: "2px 0 0" }}>{contractStart}</p>
            </div>
          </div>
        )}

        {workEmail && (
          <p style={{ color: "#64748b", fontSize: 12 }}>
            Your work email: <span style={{ color: "#d4af37", fontWeight: 600 }}>{workEmail}</span>
          </p>
        )}

        <p style={{ color: "#475569", fontSize: 11, marginTop: 24 }}>
          If this is incorrect, contact IT support.
        </p>
      </div>
    </div>
  );
}

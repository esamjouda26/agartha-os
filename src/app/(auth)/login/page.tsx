"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    // Check if MFA is required (admin role)
    const staffRole = data.user?.app_metadata?.staff_role as string | undefined;

    if (staffRole === "it_admin" || staffRole === "business_admin") {
      // Check AAL level
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalData?.currentLevel !== "aal2" && aalData?.nextLevel === "aal2") {
        // MFA enrolled but not verified for this session
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactor = factors?.totp?.[0];

        if (totpFactor) {
          const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
            factorId: totpFactor.id,
          });

          if (challengeError) {
            setLoading(false);
            setError("Failed to initiate MFA challenge.");
            return;
          }

          setFactorId(totpFactor.id);
          setChallengeId(challenge.id);
          setMfaRequired(true);
          setLoading(false);
          return;
        }
      }
    }

    setLoading(false);
    redirectByRole(staffRole);
  }

  async function handleMfaVerify() {
    if (!factorId || !challengeId) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: mfaCode,
    });

    setLoading(false);

    if (verifyError) {
      setError("Invalid MFA code. Please try again.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    redirectByRole(user?.app_metadata?.staff_role as string | undefined);
  }

  function redirectByRole(role?: string) {
    // Each manager role lands on the first tab of their sidebar
    const ROLE_HOME: Record<string, string> = {
      it_admin:                 "/admin/access-control",
      business_admin:           "/admin/executive",
      fnb_manager:              "/management/fnb/menu",
      merch_manager:            "/management/merch/catalog",
      maintenance_manager:      "/management/maintenance/telemetry",
      inventory_manager:        "/management/inventory",
      marketing_manager:        "/management/marketing/campaigns",
      human_resources_manager:  "/management/hr-roster",
      compliance_manager:       "/management/hr-roster",
      operations_manager:       "/management/operations/telemetry",
    };
    router.push(ROLE_HOME[role ?? ""] ?? "/crew/zone-check-in");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="font-bold text-xl text-white">A</span>
            </div>
            <h1 className="text-2xl font-bold text-gradient">AgarthaOS</h1>
            <p className="text-muted-foreground text-sm mt-1">Staff Authentication Portal</p>
          </div>

          {!mfaRequired ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="crew@agartha.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>

              {error && <p className="text-destructive text-sm text-center">{error}</p>}

              <Button variant="default" size="lg" className="w-full" disabled={loading || !email || !password} onClick={handleLogin}>
                {loading ? "Authenticating..." : "Sign In"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                </div>
                <h2 className="text-lg font-bold text-foreground">MFA Verification</h2>
                <p className="text-muted-foreground text-xs mt-1">Enter the code from your authenticator app</p>
              </div>

              <div>
                <Label htmlFor="mfa-code">6-Digit Code</Label>
                <Input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleMfaVerify()}
                  className="text-center text-xl tracking-[0.5em] font-mono"
                />
              </div>

              {error && <p className="text-destructive text-sm text-center">{error}</p>}

              <Button variant="default" size="lg" className="w-full" disabled={loading || mfaCode.length !== 6} onClick={handleMfaVerify}>
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>

              <button onClick={() => { setMfaRequired(false); setMfaCode(""); setError(null); }} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition">
                ← Back to login
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

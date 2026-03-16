import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/iot/turnstile
 *
 * IoT Turnstile Entry Webhook — secured via PSK (pre-shared key).
 * Physical turnstile devices POST here with { qr_code_ref, device_serial }.
 * We invoke rpc_scan_ticket via service_role, then return lock/unlock JSON.
 *
 * Security: IoT devices cannot hold user JWTs. Authentication is via
 * the IOT_WEBHOOK_SECRET environment variable in the Authorization header.
 */
export async function POST(req: NextRequest) {
  // ── PSK Authentication ──────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.IOT_WEBHOOK_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { gate: "LOCK", color: "RED", error: "Server misconfiguration: IOT_WEBHOOK_SECRET not set" },
      { status: 500 }
    );
  }

  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { gate: "LOCK", color: "RED", error: "Unauthorized — invalid or missing PSK" },
      { status: 401 }
    );
  }

  // ── Parse Payload ───────────────────────────────────────────────────────
  let body: { qr_code_ref?: string; device_serial?: string; timestamp?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { gate: "LOCK", color: "RED", error: "Malformed JSON payload" },
      { status: 400 }
    );
  }

  // L-1: Replay protection — reject requests with >300s clock drift
  if (!body.timestamp) {
    return NextResponse.json(
      { gate: "LOCK", color: "RED", error: "Missing required timestamp field" },
      { status: 400 }
    );
  }
  const drift = Math.abs(Date.now() - new Date(body.timestamp).getTime());
  if (Number.isNaN(drift) || drift > 300_000) {
    return NextResponse.json(
      { gate: "LOCK", color: "RED", error: "Request timestamp exceeds 300s drift tolerance" },
      { status: 403 }
    );
  }

  const { qr_code_ref, device_serial } = body;

  if (!qr_code_ref || typeof qr_code_ref !== "string") {
    return NextResponse.json(
      { gate: "LOCK", color: "RED", error: "Missing or invalid qr_code_ref" },
      { status: 400 }
    );
  }

  if (!device_serial || typeof device_serial !== "string") {
    return NextResponse.json(
      { gate: "LOCK", color: "RED", error: "Missing or invalid device_serial" },
      { status: 400 }
    );
  }

  // ── Invoke rpc_scan_ticket via service_role ──────────────────────────────
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("rpc_scan_ticket", {
    p_qr_code_ref: qr_code_ref,
  });

  if (error) {
    // Map RPC exceptions to gate instructions
    const msg = error.message || "";
    let statusCode = 403;
    let reason = "SCAN_REJECTED";

    if (msg.includes("TICKET_NOT_FOUND")) {
      reason = "TICKET_NOT_FOUND";
      statusCode = 404;
    } else if (msg.includes("BOOKING_CANCELLED")) {
      reason = "BOOKING_CANCELLED";
    } else if (msg.includes("TICKET_ALREADY_USED")) {
      reason = "TICKET_ALREADY_USED";
    }

    return NextResponse.json(
      {
        gate: "LOCK",
        color: "RED",
        reason,
        device_serial,
        timestamp: new Date().toISOString(),
        error: msg,
      },
      { status: statusCode }
    );
  }

  // ── Success: Unlock turnstile ───────────────────────────────────────────
  return NextResponse.json(
    {
      gate: "UNLOCK",
      color: "GREEN",
      device_serial,
      timestamp: new Date().toISOString(),
      booking: data,
    },
    { status: 200 }
  );
}

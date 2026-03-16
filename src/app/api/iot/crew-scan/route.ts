import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/iot/crew-scan
 *
 * IoT Crew Badge Scanner Webhook — secured via PSK.
 * Physical badge scanners POST here with { employee_id, device_serial }.
 * Invokes rpc_scan_crew_badge via service_role to update the crew member's
 * current_zone_id based on the scanning device's zone.
 */
export async function POST(req: NextRequest) {
  // ── PSK Authentication ──────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.IOT_WEBHOOK_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { status: "ERROR", error: "Server misconfiguration: IOT_WEBHOOK_SECRET not set" },
      { status: 500 }
    );
  }

  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { status: "REJECTED", error: "Unauthorized — invalid or missing PSK" },
      { status: 401 }
    );
  }

  // ── Parse Payload ───────────────────────────────────────────────────────
  let body: { employee_id?: string; device_serial?: string; timestamp?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { status: "ERROR", error: "Malformed JSON payload" },
      { status: 400 }
    );
  }

  // L-1: Replay protection — reject requests with >300s clock drift
  if (!body.timestamp) {
    return NextResponse.json(
      { status: "ERROR", error: "Missing required timestamp field" },
      { status: 400 }
    );
  }
  const drift = Math.abs(Date.now() - new Date(body.timestamp).getTime());
  if (Number.isNaN(drift) || drift > 300_000) {
    return NextResponse.json(
      { status: "REJECTED", error: "Request timestamp exceeds 300s drift tolerance" },
      { status: 403 }
    );
  }

  const { employee_id, device_serial } = body;

  if (!employee_id || typeof employee_id !== "string") {
    return NextResponse.json(
      { status: "ERROR", error: "Missing or invalid employee_id" },
      { status: 400 }
    );
  }

  if (!device_serial || typeof device_serial !== "string") {
    return NextResponse.json(
      { status: "ERROR", error: "Missing or invalid device_serial" },
      { status: 400 }
    );
  }

  // ── Invoke rpc_scan_crew_badge via service_role ──────────────────────────
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("rpc_scan_crew_badge", {
    p_employee_id: employee_id,
    p_device_serial: device_serial,
  });

  if (error) {
    const msg = error.message || "";
    let statusCode = 400;
    let reason = "SCAN_FAILED";

    if (msg.includes("DEVICE_NOT_FOUND")) { reason = "DEVICE_NOT_FOUND"; statusCode = 404; }
    else if (msg.includes("DEVICE_NO_ZONE")) { reason = "DEVICE_NO_ZONE"; statusCode = 422; }
    else if (msg.includes("EMPLOYEE_NOT_FOUND")) { reason = "EMPLOYEE_NOT_FOUND"; statusCode = 404; }
    else if (msg.includes("NO_ACTIVE_SHIFT")) { reason = "NO_ACTIVE_SHIFT"; statusCode = 404; }

    return NextResponse.json(
      {
        status: "REJECTED",
        reason,
        employee_id,
        device_serial,
        timestamp: new Date().toISOString(),
        error: msg,
      },
      { status: statusCode }
    );
  }

  return NextResponse.json(
    {
      status: "OK",
      employee_id,
      device_serial,
      timestamp: new Date().toISOString(),
      scan: data,
    },
    { status: 200 }
  );
}

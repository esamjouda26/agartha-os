import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ROLE_PORTAL_ACCESS, type PortalDomain, type StaffRole } from "@/types";

// ---------------------------------------------------------------------------
//  ROUTE PATTERNS
// ---------------------------------------------------------------------------

const STAFF_PORTALS: { prefix: string; domain: PortalDomain }[] = [
  { prefix: "/admin", domain: "admin" },
  { prefix: "/management", domain: "management" },
  { prefix: "/crew", domain: "crew" },
];

const GUEST_PROTECTED_PREFIX = "/guest/manage";
const GUEST_LOGIN_PATH = "/guest/login";
const STAFF_LOGIN_PATH = "/login";
const GUEST_SESSION_COOKIE = "agartha_guest_session";

// Paths that should never be intercepted
const PUBLIC_PATHS = [
  "/login",
  "/guest",
  "/guest/login",
  "/guest/verify",
  "/guest/booking",
  "/_next",
  "/favicon.ico",
  // IoT webhooks use their own PSK authentication — exempt explicitly.
  // Do NOT add a blanket "/api" exemption; future routes must be protected.
  "/api/iot/turnstile",
  "/api/iot/crew-scan",
];

// ---------------------------------------------------------------------------
//  MIDDLEWARE
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public/static paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return await refreshSupabaseSession(request);
  }

  // ── RULE 2: Guest Protected Routes ────────────────────────────────────
  if (pathname.startsWith(GUEST_PROTECTED_PREFIX)) {
    const guestCookie = request.cookies.get(GUEST_SESSION_COOKIE)?.value;

    if (!guestCookie) {
      return NextResponse.redirect(new URL(GUEST_LOGIN_PATH, request.url));
    }

    // Verify the encrypted guest session JWT
    try {
      const secret = new TextEncoder().encode(
        process.env.GUEST_SESSION_SECRET!
      );
      await jwtVerify(guestCookie, secret);
    } catch {
      // Invalid or expired cookie
      const response = NextResponse.redirect(
        new URL(GUEST_LOGIN_PATH, request.url)
      );
      response.cookies.delete(GUEST_SESSION_COOKIE);
      return response;
    }

    // Guests are stateless — no Supabase auth.users record exists.
    // Do NOT call refreshSupabaseSession() here; it would trigger a
    // useless GoTrue query and throw internal errors.
    return NextResponse.next({ request });
  }

  // ── RULE 1: Staff Portal Routes ───────────────────────────────────────
  const matchedPortal = STAFF_PORTALS.find((p) =>
    pathname.startsWith(p.prefix)
  );

  if (matchedPortal) {
    // Create a Supabase client that can read session cookies
    const supabase = createMiddlewareClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL(STAFF_LOGIN_PATH, request.url));
    }

    // Extract role from app_metadata (set by admin_set_user_role RPC)
    const staffRole =
      (user.app_metadata?.staff_role as StaffRole) ?? null;

    if (!staffRole) {
      return NextResponse.redirect(new URL(STAFF_LOGIN_PATH, request.url));
    }

    // Check if this role can access the requested portal domain
    const allowedPortals = ROLE_PORTAL_ACCESS[staffRole] ?? [];
    if (!allowedPortals.includes(matchedPortal.domain)) {
      return NextResponse.redirect(new URL(STAFF_LOGIN_PATH, request.url));
    }

    // Admin portal MFA gate:
    // Only enforce AAL2 when the user has a TOTP factor enrolled AND
    // the current session hasn't been elevated yet.
    // If no factor is enrolled (e.g., fresh seed accounts), allow AAL1
    // so the admin can log in and enroll their authenticator.
    if (matchedPortal.domain === "admin") {
      const { data: mfaData } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      // nextLevel === "aal2" means a factor IS enrolled but session is still aal1
      if (
        mfaData?.nextLevel === "aal2" &&
        mfaData?.currentLevel !== "aal2"
      ) {
        // Factor enrolled but session not elevated — force MFA verification
        const url = new URL(STAFF_LOGIN_PATH, request.url);
        url.searchParams.set("mfa_required", "true");
        return NextResponse.redirect(url);
      }
      // If nextLevel !== "aal2": no factor enrolled yet → allow AAL1 through
    }

    return await refreshSupabaseSession(request);
  }

  // All other routes — just refresh session
  return await refreshSupabaseSession(request);
}

// ---------------------------------------------------------------------------
//  HELPERS
// ---------------------------------------------------------------------------

/**
 * Create a lightweight Supabase client for middleware that reads/writes
 * session cookies on the request/response pair.
 */
function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return supabase;
}

/**
 * Refresh the Supabase auth session on every request to keep JWT fresh.
 */
async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}

// ---------------------------------------------------------------------------
//  MATCHER — only run middleware on app routes, not static files
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

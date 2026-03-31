import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { type PortalDomain, type StaffRole, ROLE_PORTAL_ACCESS } from "@/types";

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

// NOTE: "/guest" is intentionally NOT listed here — it is too broad and would
// shadow the /guest/manage protected route check below.
const PUBLIC_PATHS = [
  "/login",
  "/auth/set-password",
  "/auth/not-started",
  "/auth/access-revoked",
  "/guest/login",
  "/guest/verify",
  "/guest/booking",
  "/_next",
  "/favicon.ico",
  "/api/iot/turnstile",
  "/api/iot/crew-scan",
];

// ---------------------------------------------------------------------------
//  MIDDLEWARE
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── RULE 0: Guest protected routes ────────────────────────────────────────
  // Must be evaluated BEFORE the public path bypass — /guest/manage/* is
  // protected, but a naive "/guest" public prefix would shadow it.
  if (pathname.startsWith(GUEST_PROTECTED_PREFIX)) {
    const guestCookie = request.cookies.get(GUEST_SESSION_COOKIE)?.value;

    if (!guestCookie) {
      return NextResponse.redirect(new URL(GUEST_LOGIN_PATH, request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.GUEST_SESSION_SECRET!);
      await jwtVerify(guestCookie, secret);
    } catch {
      const response = NextResponse.redirect(new URL(GUEST_LOGIN_PATH, request.url));
      response.cookies.delete(GUEST_SESSION_COOKIE);
      return response;
    }

    return NextResponse.next({ request });
  }

  // ── RULE 1: Skip public / static paths ────────────────────────────────────
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return await refreshSupabaseSession(request);
  }

  // ── RULE 2: Staff portal routes ───────────────────────────────────────────
  const matchedPortal = STAFF_PORTALS.find((p) => pathname.startsWith(p.prefix));

  if (matchedPortal) {
    const supabase = createMiddlewareClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL(STAFF_LOGIN_PATH, request.url));
    }

    // Gate 1: Password not yet set (first login via magic link)
    // app_metadata.password_set is set to false by approveIamRequestAction.
    // Treat undefined (legacy accounts) as true to avoid breaking existing users.
    const passwordSet = user.app_metadata?.password_set !== false;
    if (!passwordSet) {
      return NextResponse.redirect(new URL("/auth/set-password", request.url));
    }

    // Gate 2: Employment status check (read from app_metadata — no DB call needed)
    const employmentStatus = user.app_metadata?.employment_status as string | undefined;
    if (employmentStatus === "pending") {
      return NextResponse.redirect(new URL("/auth/not-started", request.url));
    }
    if (employmentStatus === "suspended" || employmentStatus === "terminated") {
      return NextResponse.redirect(new URL("/auth/access-revoked", request.url));
    }

    // Gate 3: Role check
    const staffRole = (user.app_metadata?.staff_role as StaffRole) ?? null;
    if (!staffRole) {
      return NextResponse.redirect(new URL(STAFF_LOGIN_PATH, request.url));
    }

    // Gate 4: Portal access by role
    const allowedPortals = ROLE_PORTAL_ACCESS[staffRole] ?? [];
    if (!allowedPortals.includes(matchedPortal.domain)) {
      return NextResponse.redirect(new URL(STAFF_LOGIN_PATH, request.url));
    }

    // Gate 5: Admin portal enforces MFA aal2
    if (matchedPortal.domain === "admin") {
      const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (mfaData?.nextLevel === "aal2" && mfaData?.currentLevel !== "aal2") {
        const url = new URL(STAFF_LOGIN_PATH, request.url);
        url.searchParams.set("mfa_required", "true");
        return NextResponse.redirect(url);
      }
    }

    return await refreshSupabaseSession(request);
  }

  return await refreshSupabaseSession(request);
}

// ---------------------------------------------------------------------------
//  HELPERS
// ---------------------------------------------------------------------------

function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  return supabase;
}

async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

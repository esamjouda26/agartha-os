import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { type PortalDomain, type StaffRole } from "@/types";

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

const PUBLIC_PATHS = [
  "/login",
  "/guest",
  "/guest/login",
  "/guest/verify",
  "/guest/booking",
  "/_next",
  "/favicon.ico",
  "/api/iot/turnstile",
  "/api/iot/crew-scan",
];

// ---------------------------------------------------------------------------
//  EDGE DICTIONARY FETCHER
// ---------------------------------------------------------------------------

/**
 * Fetches the active ACL map directly from Supabase via REST API.
 * Uses Next.js Edge Caching to prevent database hits on every page load.
 */
async function getEdgeRoleMatrix(roleId: string, domain: string): Promise<boolean> {
  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/role_route_access`);
    url.searchParams.append("select", "id");
    url.searchParams.append("role_id", `eq.${roleId}`);
    url.searchParams.append("portal_domain", `eq.${domain}`);

    const res = await fetch(url.toString(), {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
      next: { revalidate: 3600, tags: ["rbac_matrix"] },
    });

    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  } catch (err) {
    console.error("Edge Matrix Fetch Error:", err);
    return false;
  }
}

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

  // ── RULE 1: Staff Portal Routes ───────────────────────────────────────
  const matchedPortal = STAFF_PORTALS.find((p) => pathname.startsWith(p.prefix));

  if (matchedPortal) {
    const supabase = createMiddlewareClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL(STAFF_LOGIN_PATH, request.url));
    }

    const staffRole = (user.app_metadata?.staff_role as StaffRole) ?? null;
    if (!staffRole) {
      return NextResponse.redirect(new URL(STAFF_LOGIN_PATH, request.url));
    }

    // Ping the Edge Cached Dictionary
    const isAuthorized = await getEdgeRoleMatrix(staffRole, matchedPortal.domain);
    if (!isAuthorized) {
      return NextResponse.redirect(new URL(STAFF_LOGIN_PATH, request.url));
    }

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

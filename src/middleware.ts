import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// #region agent log
const DEBUG_ENDPOINT = 'http://127.0.0.1:7243/ingest/f4ab0884-c40f-42d9-8400-21a6b7719960';
function debugLog(location: string, message: string, data: Record<string, unknown>) {
  fetch(DEBUG_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location, message, data, timestamp: Date.now() }) }).catch(() => {});
}
// #endregion

/**
 * Middleware: refreshes auth session and protects routes.
 * Uses getClaims() for server-side JWT validation (do not use getSession/getUser).
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // #region agent log
  const allRequestCookies = request.cookies.getAll();
  const authCookieNames = allRequestCookies.map(c => c.name).filter(n => n.includes('auth') || n.includes('sb-'));
  debugLog('middleware.ts:entry', 'Middleware invoked', { pathname: request.nextUrl.pathname, authCookieNames, totalCookies: allRequestCookies.length, hypothesisId: 'H1-H4' });
  // #endregion

  let setAllCalled = false;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // #region agent log
          setAllCalled = true;
          debugLog('middleware.ts:setAll', 'setAll called by Supabase SSR', { cookieNames: cookiesToSet.map(c => c.name), cookieOptionsKeys: cookiesToSet.map(c => Object.keys(c.options || {})), hypothesisId: 'H2-H5' });
          // #endregion
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session - getClaims() validates JWT server-side
  const { data, error: claimsError } = await supabase.auth.getClaims();
  const isAuthenticated = !!data?.claims?.sub;

  // #region agent log
  debugLog('middleware.ts:afterGetClaims', 'getClaims() result', { isAuthenticated, hasClaims: !!data?.claims, claimsSub: data?.claims?.sub ?? null, claimsError: claimsError?.message ?? null, setAllCalled, hypothesisId: 'H1-H3' });
  // #endregion

  const pathname = request.nextUrl.pathname;
  // Leaderboard is public; admin, blind-test, my-results require auth
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/blind-test") ||
    pathname.startsWith("/my-results");

  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL("/auth/sign-in", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) =>
      redirectResponse.cookies.set(cookie.name, cookie.value)
    );
    return redirectResponse;
  }

  // Auth routes: redirect signed-in users away from sign-in/sign-up pages
  const isAuthRoute =
    pathname.startsWith("/auth") &&
    !pathname.startsWith("/auth/callback") &&
    !pathname.startsWith("/auth/sign-out");

  if (isAuthRoute && isAuthenticated) {
    const redirectUrl = new URL("/blind-test", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) =>
      redirectResponse.cookies.set(cookie.name, cookie.value)
    );
    return redirectResponse;
  }

  // Home: redirect authenticated users to blind-test
  if (pathname === "/" && isAuthenticated) {
    const redirectUrl = new URL("/blind-test", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) =>
      redirectResponse.cookies.set(cookie.name, cookie.value)
    );
    return redirectResponse;
  }

  // Admin routes: only query profiles when path is /admin/* to avoid DB calls on other routes
  if (pathname.startsWith("/admin") && isAuthenticated) {
    const userId = data?.claims?.sub as string | undefined;
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profile?.role !== "admin") {
        const redirectUrl = new URL("/blind-test", request.url);
        const redirectResponse = NextResponse.redirect(redirectUrl);
        supabaseResponse.cookies.getAll().forEach((cookie) =>
          redirectResponse.cookies.set(cookie.name, cookie.value)
        );
        return redirectResponse;
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets (e.g. images)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

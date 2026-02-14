import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware: refreshes auth session and protects routes.
 * Uses getUser() which contacts the Supabase Auth server to validate the session
 * and triggers token refresh when needed (via setAll cookie callback).
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
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

  // FIX: Use getUser() instead of getClaims().
  // getClaims() only does local JWT validation and does NOT refresh expired sessions.
  // getUser() contacts the Supabase Auth server, validates the token, and triggers
  // session refresh (via setAll) when the access token is expired.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  const pathname = request.nextUrl.pathname;
  // #region agent log
  console.log('[DEBUG MW:ENTRY]', JSON.stringify({pathname,isAuthenticated,userId:user?.id||null,userEmail:user?.email||null,cookieCount:request.cookies.getAll().length}));
  // #endregion
  // Leaderboard is public; admin, blind-test, my-results require auth
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/blind-test") ||
    pathname.startsWith("/my-results");

  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL("/auth/sign-in", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    // FIX: Copy cookies WITH their options (path, httpOnly, secure, sameSite, maxAge)
    // so refreshed session cookies are properly set on the redirect response.
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
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
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  // Home: redirect authenticated users to blind-test
  if (pathname === "/" && isAuthenticated) {
    const redirectUrl = new URL("/blind-test", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  // Admin role check is handled by the page itself (using the service-role client
  // to bypass RLS). Middleware only enforces authentication for /admin routes (above).

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

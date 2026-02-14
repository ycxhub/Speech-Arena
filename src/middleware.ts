import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
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

  // Admin routes: only query profiles when path is /admin/* to avoid DB calls on other routes.
  // Use the service-role (admin) client to bypass RLS, matching the NavBarWithSession pattern.
  // The user's identity is already verified via getUser() above, so this is safe.
  if (pathname.startsWith("/admin") && isAuthenticated) {
    // #region agent log
    console.log('[DEBUG MW:ADMIN_ENTRY]', JSON.stringify({userId:user.id,pathname,hasSecretKey:!!process.env.SUPABASE_SECRET_KEY,secretKeyLen:process.env.SUPABASE_SECRET_KEY?.length||0}));
    // #endregion
    if (user.id) {
      const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!,
        { auth: { persistSession: false } }
      );
      const { data: profile, error: profileError } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // #region agent log
      console.log('[DEBUG MW:ADMIN_PROFILE]', JSON.stringify({userId:user.id,profile,profileError:profileError?.message||null,willRedirect:profile?.role!=='admin'}));
      // #endregion

      if (profile?.role !== "admin") {
        // #region agent log - URL-visible diagnostics for production debugging
        const redirectUrl = new URL("/blind-test", request.url);
        redirectUrl.searchParams.set("_dbg_src", "middleware");
        redirectUrl.searchParams.set("_dbg_role", profile?.role || "null");
        redirectUrl.searchParams.set("_dbg_err", profileError?.message || "none");
        redirectUrl.searchParams.set("_dbg_hasKey", String(!!process.env.SUPABASE_SECRET_KEY));
        // #endregion
        const redirectResponse = NextResponse.redirect(redirectUrl);
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie);
        });
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

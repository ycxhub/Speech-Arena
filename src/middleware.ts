import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware: refreshes auth session and protects routes.
 * Uses getClaims() for server-side JWT validation (do not use getSession/getUser).
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

  // Refresh session - getClaims() validates JWT server-side
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = !!data?.claims?.sub;

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/blind-test") ||
    pathname.startsWith("/my-results") ||
    pathname.startsWith("/leaderboard");

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

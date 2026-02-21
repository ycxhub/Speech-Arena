import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Salespeak LLM Analytics - Organization ID (replace with your actual ID from Salespeak dashboard)
const SALESPEAK_ORGANIZATION_ID = "XXX96776-2ccf-4198-bd8a-3aa7c5a6986c";

// UA regexes for AI visitor detection
const CHATGPT_UA_RE = /ChatGPT-User\/1\.0/i;
const GPTBOT_UA_RE = /GPTBot\/1\.0/i;
const GOOGLE_EXTENDED_RE = /Google-Extended/i;
const BING_PREVIEW_RE = /bingpreview/i;
const PERPLEXITY_UA_RE = /PerplexityBot/i;
const CLAUDE_USER_RE = /Claude-User/i;
const CLAUDE_WEB_RE = /Claude-Web/i;
const CLAUDE_BOT_RE = /ClaudeBot/i;

function isAIVisitor(ua: string, qsAgent?: string | null) {
  const isChatGPT = CHATGPT_UA_RE.test(ua) || qsAgent === "chatgpt";
  return (
    isChatGPT ||
    GPTBOT_UA_RE.test(ua) ||
    GOOGLE_EXTENDED_RE.test(ua) ||
    BING_PREVIEW_RE.test(ua) ||
    PERPLEXITY_UA_RE.test(ua) ||
    CLAUDE_USER_RE.test(ua) ||
    CLAUDE_WEB_RE.test(ua) ||
    CLAUDE_BOT_RE.test(ua)
  );
}

/**
 * Middleware: Salespeak LLM Analytics + Supabase auth.
 * 1. AI visitors (ChatGPT, Claude, etc.) → rewrite to ai-proxy for analytics + optimized content
 * 2. Normal users → Supabase auth session refresh and route protection
 */
export async function middleware(request: NextRequest) {
  const ua = request.headers.get("user-agent") || "";
  const qsAgent = request.nextUrl.searchParams.get("user-agent")?.toLowerCase() ?? null;

  // Bypass Salespeak if requested (prevents loops from ai-proxy)
  if (
    request.headers.get("x-bypass-middleware") === "true" ||
    request.nextUrl.searchParams.get("_sp_bypass") === "1"
  ) {
    if (request.nextUrl.searchParams.has("_sp_bypass")) {
      const clean = request.nextUrl.clone();
      clean.searchParams.delete("_sp_bypass");
      return NextResponse.rewrite(clean);
    }
    // Fall through to auth
  } else if (
    !request.nextUrl.pathname.startsWith("/api/ai-proxy") &&
    !request.nextUrl.pathname.startsWith("/_next/") &&
    !request.nextUrl.pathname.startsWith("/favicon.ico") &&
    !request.nextUrl.pathname.startsWith("/robots.txt") &&
    !request.nextUrl.pathname.startsWith("/sitemap.xml") &&
    !request.nextUrl.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
  ) {
    if (isAIVisitor(ua, qsAgent)) {
      const url = request.nextUrl.clone();
      const target = new URL(`/api/ai-proxy`, request.url);
      target.searchParams.set("path", url.pathname + url.search);
      target.searchParams.set("org", SALESPEAK_ORGANIZATION_ID);
      target.searchParams.set("ua", ua);
      if (qsAgent) {
        target.searchParams.set("user-agent", qsAgent);
      }
      return NextResponse.rewrite(target, {
        headers: {
          Vary: "User-Agent",
        },
      });
    }
  }

  // --- Supabase auth (existing logic) ---
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
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/blind-test") ||
    pathname.startsWith("/my-results") ||
    pathname.startsWith("/listen-and-log");

  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL("/auth/sign-in", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
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
     * - _next/ (static files, image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - api/ai-proxy (Salespeak proxy - prevent loops)
     * - static assets (js, css, images, fonts)
     */
    "/((?!_next/|favicon.ico|robots.txt|sitemap.xml|api/ai-proxy|.*\\.(?:js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$).*)",
  ],
};

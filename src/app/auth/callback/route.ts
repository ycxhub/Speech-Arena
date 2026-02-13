import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth callback route for Supabase Auth.
 * Handles email confirmation, password reset, and OAuth redirects.
 * Exchanges the authorization code for a session and redirects.
 *
 * Uses createServerClient directly (instead of the shared helper) so that
 * session cookies are written onto the *redirect* response.  The cookies()
 * API from next/headers does NOT reliably propagate onto an explicit
 * NextResponse.redirect(), which caused authenticated users to land back
 * on the sign-in page after Google OAuth.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/blind-test";

  // Prevent open redirect: only allow relative paths starting with /
  if (!next.startsWith("/")) {
    next = "/blind-test";
  }

  if (code) {
    const redirectUrl = new URL(next, request.url);
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(new URL("/auth/sign-in", request.url));
}

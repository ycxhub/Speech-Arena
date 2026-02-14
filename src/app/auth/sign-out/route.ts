import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Sign out route. Clears the auth session and redirects to sign-in.
 * NavBar links to this route via GET.
 *
 * Uses createServerClient directly (instead of the shared helper) so that
 * cleared session cookies are written onto the *redirect* response.
 * The cookies() API from next/headers does NOT reliably propagate onto an
 * explicit NextResponse.redirect().
 */
export async function GET(request: NextRequest) {
  const redirectUrl = new URL("/auth/sign-in", request.url);
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

  await supabase.auth.signOut();
  return response;
}

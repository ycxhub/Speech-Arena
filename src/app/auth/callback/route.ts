import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Auth callback route for Supabase Auth.
 * Handles email confirmation, password reset, and OAuth redirects.
 * Exchanges the authorization code for a session and redirects.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/blind-test";

  // Prevent open redirect: only allow relative paths starting with /
  if (!next.startsWith("/")) {
    next = "/blind-test";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/auth/sign-in", request.url));
}

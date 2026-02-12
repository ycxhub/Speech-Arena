import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Sign out route. Clears the auth session and redirects to sign-in.
 * NavBar links to this route via GET.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/auth/sign-in", url.origin));
}

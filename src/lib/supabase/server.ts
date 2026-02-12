import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use on the server (Server Components, Server Actions, Route Handlers).
 * Uses Next.js cookies() for get/set/remove so auth session is correctly read and refreshed.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required"
    );
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll can be called from a Server Component where cookies are read-only.
          // Middleware is responsible for refreshing and setting cookies in that case.
        }
      },
    },
  });
}

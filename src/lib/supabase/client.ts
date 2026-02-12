import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in the browser (Client Components, client-side code).
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from environment.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}

/**
 * Supabase Admin (Service Role) Client
 * Use for operations that bypass RLS (e.g., audio_files INSERT, decrypt_api_key).
 * NEVER expose this client to the browser — use only in Server Actions and API routes.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let _adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getAdminClient() {
  if (!_adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !secretKey) {
      throw new Error(
        "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required for admin operations"
      );
    }
    _adminClient = createClient<Database>(url, secretKey, {
      auth: { persistSession: false },
    });
  }
  return _adminClient;
}

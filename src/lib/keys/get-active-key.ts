import { createClient } from "@/lib/supabase/server";
import { decryptApiKey } from "@/lib/crypto/keys";

/**
 * Returns the decrypted API key for the given provider.
 * Queries the first active key (by created_at DESC).
 * Server-side only — never expose to client.
 * @throws Error if no active key or decryption fails
 */
export async function getActiveApiKey(providerId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("encrypted_key")
    .eq("provider_id", providerId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data?.encrypted_key) {
    throw new Error(
      `No active API key found for provider ${providerId}: ${error?.message ?? "No key"}`
    );
  }

  return decryptApiKey(data.encrypted_key);
}

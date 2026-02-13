import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";
import { getAdminClient } from "@/lib/supabase/admin";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "API_KEY_ENCRYPTION_SECRET environment variable must be set and at least 16 characters"
    );
  }
  return createHash("sha256").update(secret).digest();
}

/**
 * Encrypts an API key string for storage.
 * Uses AES-256-GCM. Output format: iv:authTag:ciphertext (all base64).
 * @throws Error if API_KEY_ENCRYPTION_SECRET is not set
 */
export function encryptApiKey(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}

/**
 * Decrypts an API key from storage.
 * @throws Error if decryption fails or API_KEY_ENCRYPTION_SECRET is not set
 */
export function decryptApiKey(encryptedBlob: string): string {
  const key = getEncryptionKey();
  const parts = encryptedBlob.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted key format");
  }
  const [ivB64, authTagB64, cipherB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(cipherB64, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/**
 * Get the active API key for a provider (decrypted).
 * Used by TTS audio generation pipeline. Server-side only.
 */
export async function getActiveApiKey(providerId: string): Promise<string> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("encrypted_key")
    .eq("provider_id", providerId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`No active API key found for provider ${providerId}`);
  }
  return decryptApiKey(data.encrypted_key);
}

/**
 * Returns a masked preview of an API key (e.g. sk-****7f3a).
 * Uses the last 4 chars of the original if available, otherwise uses placeholder.
 */
export function maskApiKey(plaintext: string): string {
  if (!plaintext || plaintext.length < 4) return "****";
  const last4 = plaintext.slice(-4);
  const prefix = plaintext.slice(0, 3);
  return `${prefix}****${last4}`;
}

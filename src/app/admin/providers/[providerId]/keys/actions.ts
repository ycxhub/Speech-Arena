"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { encryptApiKey, maskApiKey } from "@/lib/crypto/keys";

async function ensureAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      error: "Not authenticated",
      supabase: null as unknown as Awaited<ReturnType<typeof createClient>>,
    };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      error: "Forbidden: admin access required",
      supabase: null as unknown as Awaited<ReturnType<typeof createClient>>,
    };
  }
  return { error: null, supabase };
}

async function logAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  adminId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    details: details ? JSON.parse(JSON.stringify(details)) : null,
  });
}

export async function addApiKey(
  providerId: string,
  keyName: string,
  keyValue: string
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await ensureAdmin();
  if (authError || !supabase) return { error: authError ?? "Not authenticated" };

  const trimmedName = keyName?.trim();
  const trimmedValue = keyValue?.trim();

  if (!trimmedName) return { error: "Key name is required" };
  if (!trimmedValue) return { error: "API key value is required" };

  let encryptedKey: string;
  let maskedPreview: string;
  try {
    encryptedKey = encryptApiKey(trimmedValue);
    maskedPreview = maskApiKey(trimmedValue);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Encryption failed";
    return { error: msg };
  }

  const { data: inserted, error } = await supabase
    .from("api_keys")
    .insert({
      provider_id: providerId,
      key_name: trimmedName,
      encrypted_key: encryptedKey,
      masked_preview: maskedPreview,
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await logAudit(supabase, user.id, "add_api_key", "api_keys", inserted?.id, {
      provider_id: providerId,
      key_name: trimmedName,
      // never log key value
    });

  revalidatePath(`/admin/providers/${providerId}/keys`);
  revalidatePath("/admin/providers");
  return {};
}

export async function updateKeyStatus(
  keyId: string,
  providerId: string,
  status: "active" | "deprecated" | "revoked"
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await ensureAdmin();
  if (authError || !supabase) return { error: authError ?? "Not authenticated" };

  const { error } = await supabase
    .from("api_keys")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("provider_id", providerId);

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await logAudit(supabase, user.id, "update_key_status", "api_keys", keyId, {
      status,
    });

  revalidatePath(`/admin/providers/${providerId}/keys`);
  revalidatePath("/admin/providers");
  return {};
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { encryptApiKey, maskApiKey } from "@/lib/crypto/keys";

type AdminClient = ReturnType<typeof getAdminClient>;

async function ensureAdmin(): Promise<
  { error: string; admin: null; userId: null } | { error: null; admin: AdminClient; userId: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      error: "Not authenticated",
      admin: null,
      userId: null,
    };

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      error: "Forbidden: admin access required",
      admin: null,
      userId: null,
    };
  }
  return { error: null, admin, userId: user.id };
}

async function logAudit(
  admin: AdminClient,
  adminId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  await admin.from("admin_audit_log").insert({
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
  const { error: authError, admin, userId } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };

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

  const { data: inserted, error } = await admin
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

  await logAudit(admin, userId, "add_api_key", "api_keys", inserted?.id, {
    provider_id: providerId,
    key_name: trimmedName,
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
  const { error: authError, admin, userId } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };

  const { error } = await admin
    .from("api_keys")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("provider_id", providerId);

  if (error) return { error: error.message };

  await logAudit(admin, userId, "update_key_status", "api_keys", keyId, {
    status,
  });

  revalidatePath(`/admin/providers/${providerId}/keys`);
  revalidatePath("/admin/providers");
  return {};
}

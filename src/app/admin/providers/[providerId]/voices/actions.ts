"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type AdminClient = ReturnType<typeof getAdminClient>;

const GENDERS = ["male", "female", "neutral"] as const;

async function ensureAdmin(): Promise<
  { error: string; admin: null; userId: null } | { error: null; admin: AdminClient; userId: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { error: "Not authenticated", admin: null, userId: null };

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Forbidden: admin access required", admin: null, userId: null };
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

export async function createVoice(
  providerId: string,
  voiceId: string,
  gender: string,
  languageId: string,
  displayName?: string
): Promise<{ error?: string }> {
  const { error: authError, admin, userId } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };

  const trimmedVoiceId = voiceId?.trim();
  const trimmedGender = gender?.trim().toLowerCase();

  if (!trimmedVoiceId) return { error: "Voice ID is required" };
  if (!languageId) return { error: "Language is required" };
  if (!trimmedGender || !GENDERS.includes(trimmedGender as (typeof GENDERS)[number])) {
    return { error: "Gender must be male, female, or neutral" };
  }

  const { data: inserted, error } = await admin
    .from("provider_voices")
    .insert({
      provider_id: providerId,
      voice_id: trimmedVoiceId,
      gender: trimmedGender,
      language_id: languageId,
      display_name: displayName?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit(admin, userId, "create_voice", "provider_voices", inserted?.id, {
    provider_id: providerId,
    voice_id: trimmedVoiceId,
    gender: trimmedGender,
  });

  revalidatePath(`/admin/providers/${providerId}/voices`);
  revalidatePath(`/admin/providers/${providerId}/models`);
  revalidatePath("/admin/providers");
  return {};
}

export async function updateVoice(
  voiceUuid: string,
  providerId: string,
  voiceId: string,
  gender: string,
  languageId: string,
  displayName?: string
): Promise<{ error?: string }> {
  const { error: authError, admin, userId } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };

  const trimmedVoiceId = voiceId?.trim();
  const trimmedGender = gender?.trim().toLowerCase();

  if (!trimmedVoiceId) return { error: "Voice ID is required" };
  if (!languageId) return { error: "Language is required" };
  if (!trimmedGender || !GENDERS.includes(trimmedGender as (typeof GENDERS)[number])) {
    return { error: "Gender must be male, female, or neutral" };
  }

  const { error } = await admin
    .from("provider_voices")
    .update({
      voice_id: trimmedVoiceId,
      gender: trimmedGender,
      language_id: languageId,
      display_name: displayName?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", voiceUuid)
    .eq("provider_id", providerId);

  if (error) return { error: error.message };

  await logAudit(admin, userId, "update_voice", "provider_voices", voiceUuid, {
    voice_id: trimmedVoiceId,
    gender: trimmedGender,
  });

  revalidatePath(`/admin/providers/${providerId}/voices`);
  revalidatePath(`/admin/providers/${providerId}/models`);
  revalidatePath("/admin/providers");
  return {};
}

export async function deleteVoice(
  voiceUuid: string,
  providerId: string
): Promise<{ error?: string }> {
  const { error: authError, admin, userId } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };

  const { error } = await admin
    .from("provider_voices")
    .delete()
    .eq("id", voiceUuid)
    .eq("provider_id", providerId);

  if (error) return { error: error.message };

  await logAudit(admin, userId, "delete_voice", "provider_voices", voiceUuid, {});

  revalidatePath(`/admin/providers/${providerId}/voices`);
  revalidatePath(`/admin/providers/${providerId}/models`);
  revalidatePath("/admin/providers");
  return {};
}

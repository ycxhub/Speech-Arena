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
  modelId: string,
  displayName?: string
): Promise<{ error?: string }> {
  const { error: authError, admin, userId } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };

  const trimmedVoiceId = voiceId?.trim();
  const trimmedGender = gender?.trim().toLowerCase();
  const trimmedModelId = modelId?.trim();

  if (!trimmedVoiceId) return { error: "Voice ID is required" };
  if (!languageId) return { error: "Language is required" };
  if (!trimmedModelId) return { error: "Model is required" };
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
      model_id: trimmedModelId,
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
  modelId: string,
  displayName?: string
): Promise<{ error?: string }> {
  const { error: authError, admin, userId } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };

  const trimmedVoiceId = voiceId?.trim();
  const trimmedGender = gender?.trim().toLowerCase();
  const trimmedModelId = modelId?.trim();

  if (!trimmedVoiceId) return { error: "Voice ID is required" };
  if (!languageId) return { error: "Language is required" };
  if (!trimmedModelId) return { error: "Model is required" };
  if (!trimmedGender || !GENDERS.includes(trimmedGender as (typeof GENDERS)[number])) {
    return { error: "Gender must be male, female, or neutral" };
  }

  const { error } = await admin
    .from("provider_voices")
    .update({
      voice_id: trimmedVoiceId,
      gender: trimmedGender,
      language_id: languageId,
      model_id: trimmedModelId,
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

export type CsvVoiceRow = {
  voice_name: string;
  voice_id: string;
  model_id: string;
  language_code: string;
  gender: string;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function bulkCreateVoicesFromCsv(
  providerId: string,
  rows: CsvVoiceRow[]
): Promise<{ error?: string; created?: number; skipped?: number; details?: string }> {
  const { error: authError, admin, userId } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };
  if (!rows?.length) return { error: "No rows to import" };

  const { data: modelDefs } = await admin
    .from("provider_model_definitions")
    .select("model_id")
    .eq("provider_id", providerId);
  const validModelIds = new Set((modelDefs ?? []).map((d) => d.model_id.toLowerCase()));

  if (validModelIds.size === 0) {
    return {
      error: "Add model definitions first. Go to the Models tab and add model definitions (e.g. model_id: sonic-3, sonic-turbo) for this provider.",
    };
  }

  const { data: languages } = await admin
    .from("languages")
    .select("id, code")
    .eq("is_active", true);
  const codeToId = new Map(
    (languages ?? []).map((l) => [l.code.toLowerCase().trim(), l.id])
  );
  const validLangIds = new Set((languages ?? []).map((l) => l.id));

  let created = 0;
  let skipped = 0;
  const unknownModelIds = new Set<string>();
  const unknownLanguages = new Set<string>();
  let insertError: string | null = null;
  let skippedMissingFields = 0;

  for (const row of rows) {
    const voiceId = row.voice_id?.trim();
    const modelId = row.model_id?.trim();
    const langInput = row.language_code?.trim();
    const gender = row.gender?.trim().toLowerCase();

    if (!voiceId || !modelId || !langInput || !gender) {
      skipped++;
      skippedMissingFields++;
      continue;
    }
    if (!GENDERS.includes(gender as (typeof GENDERS)[number])) {
      skipped++;
      continue;
    }

    let languageId: string | null = null;
    if (UUID_REGEX.test(langInput)) {
      languageId = validLangIds.has(langInput) ? langInput : null;
    } else {
      languageId = codeToId.get(langInput.toLowerCase()) ?? null;
    }

    if (!languageId) {
      skipped++;
      unknownLanguages.add(langInput);
      continue;
    }
    if (!validModelIds.has(modelId.toLowerCase())) {
      skipped++;
      unknownModelIds.add(modelId);
      continue;
    }

    const { error } = await admin.from("provider_voices").insert({
      provider_id: providerId,
      voice_id: voiceId,
      model_id: modelId,
      language_id: languageId,
      gender,
      display_name: row.voice_name?.trim() || null,
    });
    if (!error) {
      created++;
    } else {
      skipped++;
      if (!insertError) insertError = error.message;
    }
  }

  if (created > 0) {
    await logAudit(admin, userId, "bulk_create_voices_csv", "provider_voices", undefined, {
      provider_id: providerId,
      created,
      total_rows: rows.length,
    });
  }

  revalidatePath(`/admin/providers/${providerId}/voices`);
  revalidatePath(`/admin/providers/${providerId}/models`);
  revalidatePath("/admin/providers");

  const detailsParts: string[] = [];
  if (unknownModelIds.size > 0) {
    detailsParts.push(`Unknown model_id: ${[...unknownModelIds].join(", ")}. Add these in the Models tab (Model Definitions) first.`);
  }
  if (unknownLanguages.size > 0) {
    detailsParts.push(`Unknown language_code: ${[...unknownLanguages].join(", ")}. Add these in Admin > Languages first.`);
  }
  if (insertError) {
    detailsParts.push(`Database error: ${insertError}`);
  }
  if (skippedMissingFields === rows.length && rows.length > 0) {
    detailsParts.push("All rows had missing or empty fields. Check CSV headers match: voice_name, voice_id, model_id, language_code, gender.");
  }
  const details = created === 0 && detailsParts.length > 0 ? detailsParts.join(" ") : undefined;

  return { created, skipped, details };
}

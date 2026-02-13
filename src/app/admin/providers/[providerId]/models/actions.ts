"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

const GENDERS = ["male", "female", "neutral"] as const;

export async function createModel(
  providerId: string,
  name: string,
  modelId: string,
  voiceId: string | null,
  gender: string,
  languageIds: string[],
  tagsStr: string
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await ensureAdmin();
  if (authError || !supabase) return { error: authError ?? "Not authenticated" };

  const trimmedName = name?.trim();
  const trimmedModelId = modelId?.trim();
  const trimmedGender = gender?.trim().toLowerCase();

  if (!trimmedName) return { error: "Name is required" };
  if (!trimmedModelId) return { error: "Model ID is required" };
  if (!trimmedGender || !GENDERS.includes(trimmedGender as (typeof GENDERS)[number])) {
    return { error: "Gender must be male, female, or neutral" };
  }
  if (!languageIds?.length) return { error: "At least one language is required" };

  const tags = tagsStr
    ?.trim()
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean) ?? [];

  const { data: existing } = await supabase
    .from("models")
    .select("id")
    .eq("provider_id", providerId)
    .eq("model_id", trimmedModelId)
    .single();
  if (existing) return { error: "Model ID already exists for this provider" };

  const { data: inserted, error } = await supabase
    .from("models")
    .insert({
      provider_id: providerId,
      name: trimmedName,
      model_id: trimmedModelId,
      voice_id: voiceId?.trim() || null,
      gender: trimmedGender,
      tags: tags.length > 0 ? tags : null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const modelUuid = inserted?.id;
  if (modelUuid) {
    const { error: eloError } = await supabase.from("elo_ratings_global").insert({
      model_id: modelUuid,
      rating: 1500,
      matches_played: 0,
      wins: 0,
      losses: 0,
    });
    if (eloError) return { error: eloError.message };
  }
  if (modelUuid && languageIds.length > 0) {
    await supabase.from("model_languages").insert(
      languageIds.map((lid) => ({ model_id: modelUuid, language_id: lid }))
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await logAudit(supabase, user.id, "create_model", "models", modelUuid, {
      provider_id: providerId,
      name: trimmedName,
      model_id: trimmedModelId,
      gender: trimmedGender,
      language_ids: languageIds,
      tags,
    });

  revalidatePath(`/admin/providers/${providerId}/models`);
  revalidatePath("/admin/providers");
  return {};
}

export async function updateModel(
  modelUuid: string,
  providerId: string,
  name: string,
  modelId: string,
  voiceId: string | null,
  gender: string,
  languageIds: string[],
  tagsStr: string
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await ensureAdmin();
  if (authError || !supabase) return { error: authError ?? "Not authenticated" };

  const trimmedName = name?.trim();
  const trimmedModelId = modelId?.trim();
  const trimmedGender = gender?.trim().toLowerCase();

  if (!trimmedName) return { error: "Name is required" };
  if (!trimmedModelId) return { error: "Model ID is required" };
  if (!trimmedGender || !GENDERS.includes(trimmedGender as (typeof GENDERS)[number])) {
    return { error: "Gender must be male, female, or neutral" };
  }
  if (!languageIds?.length) return { error: "At least one language is required" };

  const tags = tagsStr
    ?.trim()
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean) ?? [];

  const { data: existing } = await supabase
    .from("models")
    .select("id")
    .eq("provider_id", providerId)
    .eq("model_id", trimmedModelId)
    .neq("id", modelUuid)
    .single();
  if (existing) return { error: "Model ID already exists for this provider" };

  const { error } = await supabase
    .from("models")
    .update({
      name: trimmedName,
      model_id: trimmedModelId,
      voice_id: voiceId?.trim() || null,
      gender: trimmedGender,
      tags: tags.length > 0 ? tags : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", modelUuid);

  if (error) return { error: error.message };

  // Sync model_languages: delete old, insert new
  await supabase.from("model_languages").delete().eq("model_id", modelUuid);
  if (languageIds.length > 0) {
    await supabase.from("model_languages").insert(
      languageIds.map((lid) => ({ model_id: modelUuid, language_id: lid }))
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await logAudit(supabase, user.id, "update_model", "models", modelUuid, {
      name: trimmedName,
      model_id: trimmedModelId,
      gender: trimmedGender,
      language_ids: languageIds,
      tags,
    });

  revalidatePath(`/admin/providers/${providerId}/models`);
  revalidatePath("/admin/providers");
  return {};
}

export async function toggleModelActive(
  modelUuid: string,
  providerId: string
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await ensureAdmin();
  if (authError || !supabase) return { error: authError ?? "Not authenticated" };

  const { data: model } = await supabase
    .from("models")
    .select("is_active")
    .eq("id", modelUuid)
    .single();
  if (!model) return { error: "Model not found" };

  const newActive = !model.is_active;
  const { error } = await supabase
    .from("models")
    .update({ is_active: newActive, updated_at: new Date().toISOString() })
    .eq("id", modelUuid);

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await logAudit(supabase, user.id, "toggle_model_active", "models", modelUuid, {
      is_active: newActive,
    });

  revalidatePath(`/admin/providers/${providerId}/models`);
  revalidatePath("/admin/providers");
  return {};
}

export async function bulkUpdateModelStatus(
  modelIds: string[],
  providerId: string,
  active: boolean
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await ensureAdmin();
  if (authError || !supabase) return { error: authError ?? "Not authenticated" };
  if (!modelIds?.length) return { error: "No models selected" };

  const { error } = await supabase
    .from("models")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("provider_id", providerId)
    .in("id", modelIds);

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await logAudit(supabase, user.id, "bulk_update_model_status", "models", undefined, {
      model_ids: modelIds,
      is_active: active,
    });

  revalidatePath(`/admin/providers/${providerId}/models`);
  revalidatePath("/admin/providers");
  return {};
}

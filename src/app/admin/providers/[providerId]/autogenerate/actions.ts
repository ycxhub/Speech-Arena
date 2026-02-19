"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function ensureAdmin(): Promise<
  { error: string; admin: null } | { error: null; admin: ReturnType<typeof getAdminClient> }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", admin: null };

  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden: admin access required", admin: null };
  return { error: null, admin };
}

export type AutogeneratePreviewRow = {
  model_id: string;
  voice_id: string;
  language_id: string;
  language_code: string;
  gender: string;
  display_name: string | null;
  will_create: boolean;
};

export async function getAutogeneratePreview(
  providerId: string
): Promise<{ error?: string; preview?: AutogeneratePreviewRow[] }> {
  const { error: authError, admin } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };

  const { data: voices } = await admin
    .from("provider_voices")
    .select("voice_id, model_id, language_id, gender, display_name")
    .eq("provider_id", providerId);

  const { data: modelDefs } = await admin
    .from("provider_model_definitions")
    .select("model_id")
    .eq("provider_id", providerId);

  const { data: existingModels } = await admin
    .from("models")
    .select("model_id, voice_id")
    .eq("provider_id", providerId);

  const { data: languages } = await admin.from("languages").select("id, code");
  const langById = new Map((languages ?? []).map((l) => [l.id, l.code]));

  const validModelIds = new Set((modelDefs ?? []).map((d) => d.model_id));
  const existingSet = new Set(
    (existingModels ?? []).map((m) => `${m.model_id}:${m.voice_id ?? ""}`)
  );

  const preview: AutogeneratePreviewRow[] = (voices ?? [])
    .filter((v): v is typeof v & { model_id: string } => !!v.model_id && validModelIds.has(v.model_id))
    .map((v) => {
      const key = `${v.model_id}:${v.voice_id ?? ""}`;
      const will_create = !existingSet.has(key);
      return {
        model_id: v.model_id,
        voice_id: v.voice_id,
        language_id: v.language_id ?? "",
        language_code: langById.get(v.language_id ?? "") ?? "?",
        gender: v.gender,
        display_name: v.display_name ?? null,
        will_create,
      };
    });

  return { preview };
}

export async function runAutogenerate(
  providerId: string
): Promise<{ error?: string; created?: number }> {
  const { error: authError, admin } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };

  const { data: voices } = await admin
    .from("provider_voices")
    .select("voice_id, model_id, language_id, gender, display_name")
    .eq("provider_id", providerId);

  const { data: modelDefs } = await admin
    .from("provider_model_definitions")
    .select("id, model_id, name")
    .eq("provider_id", providerId);

  const defByModelId = new Map((modelDefs ?? []).map((d) => [d.model_id, d]));
  const validModelIds = new Set((modelDefs ?? []).map((d) => d.model_id));

  let created = 0;

  for (const voice of voices ?? []) {
    if (!voice.model_id || !validModelIds.has(voice.model_id)) continue;
    if (!voice.language_id) continue;

    const def = defByModelId.get(voice.model_id);
    if (!def) continue;

    const { data: existing } = await admin
      .from("models")
      .select("id")
      .eq("provider_id", providerId)
      .eq("model_id", voice.model_id)
      .eq("voice_id", voice.voice_id)
      .maybeSingle();

    if (existing) continue;

    const { data: inserted, error: insertErr } = await admin
      .from("models")
      .insert({
        provider_id: providerId,
        definition_id: def.id,
        name: def.name,
        model_id: voice.model_id,
        voice_id: voice.voice_id,
        gender: voice.gender,
      })
      .select("id")
      .single();

    if (insertErr) continue;

    await admin.from("model_languages").insert({
      model_id: inserted.id,
      language_id: voice.language_id,
    });

    await admin.from("elo_ratings_global_model").upsert(
      {
        provider_id: providerId,
        definition_name: def.name,
        rating: 1500,
        matches_played: 0,
        wins: 0,
        losses: 0,
      },
      { onConflict: "provider_id,definition_name", ignoreDuplicates: true }
    );

    await admin.from("elo_ratings_by_language_model").upsert(
      {
        provider_id: providerId,
        definition_name: def.name,
        language_id: voice.language_id,
        rating: 1500,
        matches_played: 0,
        wins: 0,
        losses: 0,
      },
      { onConflict: "provider_id,definition_name,language_id", ignoreDuplicates: true }
    );

    created++;
  }

  revalidatePath(`/admin/providers/${providerId}/models`);
  revalidatePath(`/admin/providers/${providerId}/autogenerate`);
  revalidatePath("/admin/providers");
  return { created };
}

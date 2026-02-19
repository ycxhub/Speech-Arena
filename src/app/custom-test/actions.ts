"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { generateAndStoreAudioPair } from "@/lib/tts";

const MIN_MODEL_VOICE_PAIRS = 5;

export type LanguageOption = { id: string; name: string; code: string };

export async function getActiveLanguages(): Promise<LanguageOption[]> {
  const admin = getAdminClient();
  const { data, error } = await admin.rpc("get_active_languages_with_min_model_voices", {
    p_min_count: MIN_MODEL_VOICE_PAIRS,
  });

  if (error) return [];
  return (data ?? []).map((r: { id: string; name: string; code: string }) => ({
    id: r.id,
    name: r.name,
    code: r.code,
  }));
}

export type ModelOption = {
  id: string;
  label: string; // "Provider Name - Model ID"
  gender: string;
};

export async function getModelsForLanguage(
  languageId: string
): Promise<ModelOption[]> {
  const admin = getAdminClient();

  const { data: modelLanguages } = await admin
    .from("model_languages")
    .select("model_id")
    .eq("language_id", languageId);

  const modelIds = (modelLanguages ?? []).map((r) => r.model_id);
  if (modelIds.length === 0) return [];

  const { data: models, error: modelsError } = await admin
    .from("models")
    .select("id, provider_id, model_id, gender")
    .in("id", modelIds)
    .eq("is_active", true);

  if (modelsError || !models) return [];

  const providerIds = [...new Set(models.map((m) => m.provider_id))];
  const [providersRes, defsRes] = await Promise.all([
    admin.from("providers").select("id, name").eq("is_active", true).in("id", providerIds),
    admin.from("provider_model_definitions").select("provider_id, model_id, name").in("provider_id", providerIds),
  ]);
  const { data: providers } = providersRes;
  const { data: defs } = defsRes;

  const defMap = new Map<string, string>();
  for (const d of defs ?? []) {
    defMap.set(`${d.provider_id}:${d.model_id}`, d.name);
  }

  const { data: keys } = await admin
    .from("api_keys")
    .select("provider_id")
    .eq("status", "active")
    .in("provider_id", providerIds);

  const providersWithKeys = new Set((keys ?? []).map((k) => k.provider_id));
  const providerMap = new Map((providers ?? []).map((p) => [p.id, p.name]));

  // Deduplicate by (provider_id, definition_name) - keep first models.id per unique definition
  const seen = new Set<string>();
  const result: ModelOption[] = [];

  for (const m of models) {
    if (!providersWithKeys.has(m.provider_id)) continue;
    const defName = defMap.get(`${m.provider_id}:${m.model_id}`) ?? m.model_id;
    const key = `${m.provider_id}:${defName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const providerName = providerMap.get(m.provider_id) ?? "Unknown";
    result.push({
      id: m.id,
      label: `${providerName} - ${defName}`,
      gender: m.gender ?? "unknown",
    });
  }

  result.sort((a, b) => a.label.localeCompare(b.label));

  return result;
}

export type PrepareCustomRoundResult = {
  testEventId: string;
  sentence: { id: string; text: string };
  audioA: { url: string };
  audioB: { url: string };
};

export async function prepareCustomRound(
  languageId: string,
  modelAId: string,
  modelBId: string
): Promise<{ data?: PrepareCustomRoundResult; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  if (modelAId === modelBId) {
    return { error: "Model A and Model B must be different" };
  }

  const admin = getAdminClient();

  // Validate both models have the same gender
  const { data: modelA } = await admin
    .from("models")
    .select("gender")
    .eq("id", modelAId)
    .single();
  const { data: modelB } = await admin
    .from("models")
    .select("gender")
    .eq("id", modelBId)
    .single();
  if (modelA?.gender && modelB?.gender && modelA.gender !== modelB.gender) {
    return { error: "Model A and Model B must have the same gender" };
  }

  // Validate both models support the language
  const { data: mlA } = await admin
    .from("model_languages")
    .select("model_id")
    .eq("model_id", modelAId)
    .eq("language_id", languageId)
    .maybeSingle();
  const { data: mlB } = await admin
    .from("model_languages")
    .select("model_id")
    .eq("model_id", modelBId)
    .eq("language_id", languageId)
    .maybeSingle();

  if (!mlA || !mlB) {
    return { error: "One or both models do not support the selected language" };
  }

  // Get random sentence
  const { data: sentenceRows } = await admin.rpc("get_random_sentence", {
    p_language_id: languageId,
    p_user_id: user.id,
    p_exclude_window: 10,
  });

  const sentence = (sentenceRows ?? [])[0] as { id: string; text: string } | undefined;
  if (!sentence) {
    return { error: "No sentences available for this language" };
  }

  try {
    const { audioA, audioB } = await generateAndStoreAudioPair(
      modelAId,
      modelBId,
      sentence.id
    );

    const { data: inserted, error: insertError } = await admin
      .from("test_events")
      .insert({
        user_id: user.id,
        sentence_id: sentence.id,
        language_id: languageId,
        model_a_id: modelAId,
        model_b_id: modelBId,
        audio_a_id: audioA.audioFileId,
        audio_b_id: audioB.audioFileId,
        status: "pending",
        test_type: "custom",
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return { error: insertError?.message ?? "Failed to create test event" };
    }

    return {
      data: {
        testEventId: inserted.id,
        sentence: { id: sentence.id, text: sentence.text },
        audioA: { url: audioA.signedUrl },
        audioB: { url: audioB.signedUrl },
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate audio";
    return { error: msg };
  }
}

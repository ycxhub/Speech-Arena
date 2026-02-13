/**
 * Background pre-generation of TTS audio.
 * PRD 07: Pre-generate for (sentence, model) pairs that don't have audio_files yet.
 * Run during off-peak hours via cron or manual trigger.
 */

import { generateAndStoreAudio } from "./generate";
import { getAdminClient } from "@/lib/supabase/admin";

export interface PreGenerateResult {
  generated: number;
  skipped: number;
  errors: string[];
}

/**
 * Pre-generate audio for active (sentence, model) combinations that lack audio_files.
 * Processes in batches to avoid timeouts. Returns summary.
 */
export async function preGenerateAudio(options?: {
  maxPairs?: number;
  languageId?: string;
}): Promise<PreGenerateResult> {
  const supabase = getAdminClient();
  const maxPairs = options?.maxPairs ?? 500;

  // Get active sentences (optionally filtered by language)
  let sentenceQuery = supabase
    .from("sentences")
    .select("id, language_id")
    .eq("is_active", true);
  if (options?.languageId) {
    sentenceQuery = sentenceQuery.eq("language_id", options.languageId);
  }
  const { data: sentences } = await sentenceQuery;
  if (!sentences?.length) return { generated: 0, skipped: 0, errors: [] };

  // Get active models
  const { data: models } = await supabase
    .from("models")
    .select("id, model_id, provider_id")
    .eq("is_active", true);
  if (!models?.length) return { generated: 0, skipped: 0, errors: [] };

  // Get model_languages
  const { data: modelLangs } = await supabase
    .from("model_languages")
    .select("model_id, language_id");
  const modelLangSet = new Set(
    (modelLangs ?? []).map((ml) => `${ml.model_id}:${ml.language_id}`)
  );

  // Get existing audio_files
  const { data: existing } = await supabase
    .from("audio_files")
    .select("model_id, sentence_id");
  const existingSet = new Set(
    (existing ?? []).map((e) => `${e.model_id}:${e.sentence_id}`)
  );

  // Build pairs: (sentence, model) where model supports sentence's language and no audio exists
  const pairs: { sentenceId: string; modelId: string }[] = [];
  for (const s of sentences) {
    for (const m of models) {
      if (!modelLangSet.has(`${m.id}:${s.language_id}`)) continue;
      if (existingSet.has(`${m.id}:${s.id}`)) continue;
      pairs.push({ sentenceId: s.id, modelId: m.id });
      if (pairs.length >= maxPairs) break;
    }
    if (pairs.length >= maxPairs) break;
  }

  let generated = 0;
  const errors: string[] = [];

  for (const { sentenceId, modelId } of pairs) {
    try {
      await generateAndStoreAudio(modelId, sentenceId);
      generated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`model=${modelId} sentence=${sentenceId}: ${msg}`);
      if (errors.length >= 50) break; // Cap error list
    }
  }

  return {
    generated,
    skipped: Math.max(0, pairs.length - generated - errors.length),
    errors,
  };
}

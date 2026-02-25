/**
 * LnL On-the-Fly TTS Generation
 * Generates audio for lnl_task_items using raw text (no sentences table).
 */

import { createHash } from "crypto";
import "@/lib/tts/providers";
import { getProvider } from "@/lib/tts/registry";
import { getActiveApiKey } from "@/lib/crypto/keys";
import { getAdminClient } from "@/lib/supabase/admin";
import { uploadAudio, getSignedUrl } from "@/lib/r2/storage";
import { withRetry } from "@/lib/tts/retry";
import { recordFailure, recordSuccess } from "@/lib/tts/circuit-breaker";
import { TTSError } from "@/lib/tts/errors";

const SIGNED_URL_EXPIRY_SEC = 3600;
const MAX_TEXT_LENGTH = 5000;

interface TtsGenerationConfig {
  model_id: string;
  language_id: string;
  voice_id?: string;
}

/**
 * Validate that the model supports the given language.
 */
export async function validateModelSupportsLanguage(
  modelId: string,
  languageId: string
): Promise<boolean> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("model_languages")
    .select("language_id")
    .eq("model_id", modelId)
    .eq("language_id", languageId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/**
 * Generate TTS audio for an LnL task item and store in R2.
 * Returns signed URL. Idempotent: if audio_url already set, returns existing signed URL.
 */
export async function generateLnLAudioForItem(
  taskId: string,
  itemId: string,
  options?: { signedUrlExpirySec?: number }
): Promise<{ signedUrl: string }> {
  const supabase = getAdminClient();
  const expirySec = options?.signedUrlExpirySec ?? SIGNED_URL_EXPIRY_SEC;

  // 1. Load item
  const { data: item, error: itemErr } = await supabase
    .from("lnl_task_items")
    .select("id, text, item_index, audio_url")
    .eq("id", itemId)
    .eq("task_id", taskId)
    .single();

  if (itemErr || !item) {
    throw new Error(`Task item not found: ${itemId}. ${itemErr?.message ?? ""}`);
  }

  // Already generated
  if (item.audio_url) {
    const signedUrl = await getSignedUrl(item.audio_url, expirySec);
    return { signedUrl };
  }

  if (!item.text || item.text.length > MAX_TEXT_LENGTH) {
    throw new Error(
      `Invalid text: empty or exceeds ${MAX_TEXT_LENGTH} characters.`
    );
  }

  // 2. Load task and TTS config
  const { data: task, error: taskErr } = await supabase
    .from("lnl_tasks")
    .select("task_options")
    .eq("id", taskId)
    .single();

  if (taskErr || !task) {
    throw new Error(`Task not found: ${taskId}. ${taskErr?.message ?? ""}`);
  }

  const taskOptions = (task.task_options ?? {}) as {
    tts_generation?: TtsGenerationConfig;
  };
  const ttsConfig = taskOptions.tts_generation;

  if (!ttsConfig?.model_id || !ttsConfig?.language_id) {
    throw new Error("Task is not configured for TTS generation.");
  }

  const modelId = ttsConfig.model_id;
  const languageId = ttsConfig.language_id;

  // 3. Validate model supports language
  const supports = await validateModelSupportsLanguage(modelId, languageId);
  if (!supports) {
    throw new Error(
      `Model does not support the selected language. Check model_languages.`
    );
  }

  // 4. Load model
  const { data: model, error: modelErr } = await supabase
    .from("models")
    .select("id, provider_id, model_id, voice_id, gender")
    .eq("id", modelId)
    .single();

  if (modelErr || !model) {
    throw new Error(`Model not found: ${modelId}. ${modelErr?.message ?? ""}`);
  }

  // 5. Load language code
  const { data: language, error: langErr } = await supabase
    .from("languages")
    .select("code")
    .eq("id", languageId)
    .single();

  if (langErr || !language) {
    throw new Error(`Language not found: ${languageId}. ${langErr?.message ?? ""}`);
  }

  // 6. Load provider
  const { data: provider, error: providerErr } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("id", model.provider_id)
    .single();

  if (providerErr || !provider) {
    throw new Error(`Provider not found. ${providerErr?.message ?? ""}`);
  }

  // 7. Get API key and generate
  const apiKey = await getActiveApiKey(provider.id);
  const adapter = getProvider(provider.slug);

  const startTime = Date.now();
  let result;
  try {
    const effectiveVoiceId =
      ttsConfig.voice_id ?? (model as { voice_id?: string | null }).voice_id ?? undefined;

    result = await withRetry((signal) =>
      adapter.generateAudio({
        text: item.text,
        modelId: model.model_id,
        voiceId: effectiveVoiceId,
        language: language.code,
        gender: model.gender,
        apiKey,
        signal,
      })
    );
    recordSuccess(provider.slug);
  } catch (err) {
    recordFailure(provider.slug);
    const latencyMs = Date.now() - startTime;
    const ttsErr =
      err instanceof TTSError
        ? err
        : new TTSError(
            err instanceof Error ? err.message : String(err),
            provider.slug,
            model.model_id,
            itemId,
            err instanceof TTSError ? err.httpStatus : undefined,
            latencyMs
          );
    console.error("[LnL TTS Generation Failed]", ttsErr.toLogObject());
    throw err;
  }

  // 8. Compute R2 key and upload
  const contentHash = createHash("sha256")
    .update(result.audioBuffer)
    .digest("hex")
    .slice(0, 8);
  const r2Key = `lnl/${taskId}/${item.item_index}/generated/${contentHash}.mp3`;

  await uploadAudio(result.audioBuffer, r2Key);

  // 9. Update item (only if still null - idempotent)
  const { error: updateErr } = await supabase
    .from("lnl_task_items")
    .update({ audio_url: r2Key })
    .eq("id", itemId)
    .eq("task_id", taskId)
    .is("audio_url", null);

  if (updateErr) {
    // Another process may have updated; fetch current and return signed URL
    const { data: updated } = await supabase
      .from("lnl_task_items")
      .select("audio_url")
      .eq("id", itemId)
      .single();
    if (updated?.audio_url) {
      const signedUrl = await getSignedUrl(updated.audio_url, expirySec);
      return { signedUrl };
    }
    throw new Error(`Failed to update task item: ${updateErr.message}`);
  }

  // 10. Record cost
  await supabase.from("lnl_tts_generations").insert({
    task_id: taskId,
    item_id: itemId,
    model_id: modelId,
    provider_id: provider.id,
    characters_generated: item.text.length,
    estimated_cost_usd: null,
  });

  const signedUrl = await getSignedUrl(r2Key, expirySec);
  return { signedUrl };
}

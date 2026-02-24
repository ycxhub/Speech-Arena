/**
 * TTS Audio Generation Pipeline — Main generation flow
 * PRD 07: generateAndStoreAudio(modelId, sentenceId) → { audioFileId, signedUrl }
 */

import { createHash } from "crypto";
import "./providers"; // Register all providers
import { getProvider } from "./registry";
import { getActiveApiKey } from "@/lib/crypto/keys";
import { getAdminClient } from "@/lib/supabase/admin";
import { uploadAudio, getSignedUrl } from "@/lib/r2/storage";
import { withRetry } from "./retry";
import { recordFailure, recordSuccess } from "./circuit-breaker";
import { TTSError } from "./errors";
import type { Database } from "@/types/database";

type AudioFileInsert = Database["public"]["Tables"]["audio_files"]["Insert"];

const SIGNED_URL_EXPIRY_SEC = 3600; // 1 hour

export interface GenerateAndStoreResult {
  audioFileId: string;
  signedUrl: string;
}

/**
 * Generate TTS audio for a (model, sentence) pair and store in R2.
 * Returns cached result if already generated.
 */
export async function generateAndStoreAudio(
  modelId: string,
  sentenceId: string,
  options?: { signedUrlExpirySec?: number }
): Promise<GenerateAndStoreResult> {
  const supabase = getAdminClient();
  const expirySec = options?.signedUrlExpirySec ?? SIGNED_URL_EXPIRY_SEC;

  // 1. Look up model (provider_id, model_id, voice_id, gender)
  const { data: model, error: modelErr } = await supabase
    .from("models")
    .select("id, provider_id, model_id, voice_id, gender")
    .eq("id", modelId)
    .single();

  if (modelErr || !model) {
    throw new Error(`Model not found: ${modelId}. ${modelErr?.message ?? ""}`);
  }

  // 2. Look up sentence (text, language_id)
  const { data: sentence, error: sentenceErr } = await supabase
    .from("sentences")
    .select("id, text, language_id")
    .eq("id", sentenceId)
    .single();

  if (sentenceErr || !sentence) {
    throw new Error(`Sentence not found: ${sentenceId}. ${sentenceErr?.message ?? ""}`);
  }

  // 3. Look up language code for TTS — use voice's language when available
  // (provider_voices.language_id = locale the voice supports, e.g. en-IN for Anisha;
  //  sentence may be generic "en" which maps to en-US and causes Murf locale mismatch)
  const voiceId = (model as { voice_id?: string | null }).voice_id;
  let languageIdForTts = sentence.language_id;

  if (voiceId) {
    const { data: voiceLang } = await supabase
      .from("provider_voices")
      .select("language_id")
      .eq("provider_id", model.provider_id)
      .eq("voice_id", voiceId)
      .maybeSingle();

    if (voiceLang?.language_id) {
      languageIdForTts = voiceLang.language_id;
    }
  }

  const { data: language, error: langErr } = await supabase
    .from("languages")
    .select("code")
    .eq("id", languageIdForTts)
    .single();

  if (langErr || !language) {
    throw new Error(`Language not found for sentence. ${langErr?.message ?? ""}`);
  }

  // 4. Look up provider (slug)
  const { data: provider, error: providerErr } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("id", model.provider_id)
    .single();

  if (providerErr || !provider) {
    throw new Error(`Provider not found. ${providerErr?.message ?? ""}`);
  }

  // 5. Cache check
  const { data: existing, error: cacheErr } = await supabase
    .from("audio_files")
    .select("id, r2_key")
    .eq("model_id", modelId)
    .eq("sentence_id", sentenceId)
    .maybeSingle();

  if (cacheErr) throw cacheErr;
  if (existing) {
    const signedUrl = await getSignedUrl(existing.r2_key, expirySec);
    return { audioFileId: existing.id, signedUrl };
  }

  // 6. Get active API key
  const apiKey = await getActiveApiKey(provider.id);

  // 7. Get adapter and generate
  const adapter = getProvider(provider.slug);

  const startTime = Date.now();
  let result;

  try {
    result = await withRetry((signal) =>
      adapter.generateAudio({
        text: sentence.text,
        modelId: model.model_id,
        voiceId: (model as { voice_id?: string | null }).voice_id ?? undefined,
        language: language.code,
        gender: model.gender,
        apiKey,
        signal,
      })
    );
    recordSuccess(provider.slug);
  } catch (err) {
    recordFailure(provider.slug);
    const latency = Date.now() - startTime;
    const ttsErr =
      err instanceof TTSError
        ? err
        : new TTSError(
            err instanceof Error ? err.message : String(err),
            provider.slug,
            model.model_id,
            sentenceId,
            err instanceof TTSError ? err.httpStatus : undefined,
            latency
          );
    console.error("[TTS Generation Failed]", ttsErr.toLogObject());
    throw err;
  }

  const generationLatencyMs = Date.now() - startTime;

  // 8. Compute R2 key
  const contentHash = createHash("sha256")
    .update(result.audioBuffer)
    .digest("hex")
    .slice(0, 8);
  const r2Key = `${provider.slug}/${model.model_id}/${language.code}/${sentenceId}/${contentHash}.mp3`;

  // 9. Upload to R2
  await uploadAudio(result.audioBuffer, r2Key);

  // 10. Insert audio_files
  const insertRow: AudioFileInsert = {
    model_id: modelId,
    sentence_id: sentenceId,
    r2_key: r2Key,
    file_size_bytes: result.audioBuffer.length,
    duration_ms: result.durationMs ?? null,
    generation_latency_ms: generationLatencyMs,
    provider_request_id: result.providerRequestId ?? null,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from("audio_files")
    .insert(insertRow)
    .select("id")
    .single();

  if (insertErr) throw insertErr;
  if (!inserted) throw new Error("Failed to insert audio_files row");

  // 11. Generate signed URL
  const signedUrl = await getSignedUrl(r2Key, expirySec);

  return { audioFileId: inserted.id, signedUrl };
}

/**
 * Generate audio for both models in parallel. Returns both results or throws if either fails.
 * Used by matchmaking to prepare a round; caller creates test_event with audio IDs.
 */
export async function generateAndStoreAudioPair(
  modelAId: string,
  modelBId: string,
  sentenceId: string,
  options?: { signedUrlExpirySec?: number }
): Promise<{ audioA: GenerateAndStoreResult; audioB: GenerateAndStoreResult }> {
  const [audioA, audioB] = await Promise.all([
    generateAndStoreAudio(modelAId, sentenceId, options),
    generateAndStoreAudio(modelBId, sentenceId, options),
  ]);
  return { audioA, audioB };
}

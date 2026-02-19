/**
 * Hume AI TTS Provider Adapter
 * API: https://api.hume.ai/v0/tts/file
 * Docs: https://dev.hume.ai/docs/text-to-speech-tts/overview
 * Auth: X-Hume-Api-Key header (https://dev.hume.ai/docs/introduction/api-key)
 *
 * Model IDs: octave-1, octave-2 (version in request body)
 * Voices: UUID or name from Voice Library (HUME_AI), or custom:UUID for CUSTOM_VOICE
 * Languages: Octave 1 = en, es; Octave 2 = en, ja, ko, es, fr, pt, it, de, ru, hi, ar
 */

import type { TTSGenerationResult, TTSProviderAdapter } from "../types";
import { TTSError } from "../errors";

const BASE_URL = "https://api.hume.ai";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseVoice(voiceId: string): { id?: string; name?: string; provider: "HUME_AI" | "CUSTOM_VOICE" } {
  const trimmed = voiceId.trim();
  if (trimmed.startsWith("custom:")) {
    const id = trimmed.slice(7).trim();
    return { id, provider: "CUSTOM_VOICE" };
  }
  if (UUID_REGEX.test(trimmed)) {
    return { id: trimmed, provider: "HUME_AI" };
  }
  return { name: trimmed, provider: "HUME_AI" };
}

export const humeAdapter: TTSProviderAdapter = {
  slug: "hume",
  name: "Hume AI",

  async generateAudio({
    text,
    modelId,
    voiceId,
    apiKey,
    signal,
  }): Promise<TTSGenerationResult> {
    // Hume infers language from text; no explicit language param in API
    if (!voiceId?.trim()) {
      throw new TTSError(
        "Hume Octave requires a voice. Add a voice (ID or name) from the Voice Library, or custom:UUID for custom voices.",
        "hume",
        modelId
      );
    }

    // modelId = octave-1 | octave-2; default octave-2 for broader language support
    const version = (modelId?.trim().toLowerCase() === "octave-1" ? "1" : "2") as "1" | "2";

    const parsed = parseVoice(voiceId);
    const voice = parsed.id
      ? { id: parsed.id, provider: parsed.provider }
      : { name: parsed.name!, provider: parsed.provider };

    const res = await fetch(`${BASE_URL}/v0/tts/file`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/octet-stream",
        "X-Hume-Api-Key": apiKey,
      },
      body: JSON.stringify({
        version,
        utterances: [{ text, voice }],
        format: { type: "mp3" },
        num_generations: 1,
      }),
      signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new TTSError(
        `Hume TTS failed: ${res.status} ${res.statusText}. ${errBody}`,
        "hume",
        modelId,
        undefined,
        res.status
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    if (audioBuffer.length === 0) {
      throw new TTSError(
        "Hume returned empty audio. Verify voice_id and model_id.",
        "hume",
        modelId
      );
    }

    return {
      audioBuffer,
      contentType: "audio/mpeg",
    };
  },
};

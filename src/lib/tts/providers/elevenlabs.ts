/**
 * ElevenLabs TTS Provider Adapter
 * API: https://api.elevenlabs.io/v1/text-to-speech/:voice_id
 * Model = TTS engine (e.g. eleven_multilingual_v2). Voice = character (voice_id in path).
 * language_code: ISO 639-1 (en, hi) - not BCP 47 (en-US, en-IN, hi-IN).
 * @see https://elevenlabs.io/docs/api-reference/text-to-speech/convert
 */

import type { TTSGenerationResult, TTSProviderAdapter } from "../types";
import { TTSError } from "../errors";

const BASE_URL = "https://api.elevenlabs.io";

/** ElevenLabs expects ISO 639-1 codes. Map BCP 47 locale (en-US, hi-IN) to base language. */
function toElevenLabsLanguageCode(locale: string | undefined): string | undefined {
  if (!locale?.trim()) return undefined;
  const code = locale.trim().toLowerCase();
  const base = code.split("-")[0];
  return base.length === 2 ? base : undefined;
}

export const elevenlabsAdapter: TTSProviderAdapter = {
  slug: "elevenlabs",
  name: "ElevenLabs",

  async generateAudio({
    text,
    modelId,
    voiceId,
    language,
    apiKey,
    signal,
  }): Promise<TTSGenerationResult> {
    // ElevenLabs: voice_id in path (character), model_id in body (TTS engine)
    const voice = voiceId ?? modelId; // Fallback: legacy config may store voice as model_id
    const model = modelId || "eleven_multilingual_v2";
    const languageCode = toElevenLabsLanguageCode(language);
    const url = `${BASE_URL}/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: model,
        ...(languageCode && { language_code: languageCode }),
      }),
      signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new TTSError(
        `ElevenLabs TTS failed: ${res.status} ${res.statusText}. ${errBody}`,
        "elevenlabs",
        modelId,
        undefined,
        res.status
      );
    }

    const requestId = res.headers.get("x-request-id") ?? undefined;
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    return {
      audioBuffer,
      contentType: "audio/mpeg",
      providerRequestId: requestId,
    };
  },
};

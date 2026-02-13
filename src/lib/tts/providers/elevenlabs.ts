/**
 * ElevenLabs TTS Provider Adapter
 * API: https://api.elevenlabs.io/v1/text-to-speech/:voice_id
 * Model = TTS engine (e.g. eleven_multilingual_v2). Voice = character (voice_id in path).
 */

import type { TTSGenerationResult, TTSProviderAdapter } from "../types";
import { TTSError } from "../errors";

const BASE_URL = "https://api.elevenlabs.io";

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
        language_code: language,
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

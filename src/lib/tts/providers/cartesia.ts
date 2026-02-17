/**
 * Cartesia TTS Provider Adapter
 * API: https://api.cartesia.ai/tts/bytes
 * Docs: https://docs.cartesia.ai/build-with-cartesia/tts-models/latest
 */

import type { TTSGenerationResult, TTSProviderAdapter } from "../types";
import { TTSError } from "../errors";

const BASE_URL = "https://api.cartesia.ai";
const CARTESIA_VERSION = "2025-04-16";

export const cartesiaAdapter: TTSProviderAdapter = {
  slug: "cartesia",
  name: "Cartesia",

  async generateAudio({
    text,
    modelId,
    voiceId,
    language,
    apiKey,
    signal,
  }): Promise<TTSGenerationResult> {
    if (!voiceId?.trim()) {
      throw new TTSError(
        "Cartesia requires a voice ID. Add a voice to the model and ensure it is linked.",
        "cartesia",
        modelId
      );
    }

    const model = modelId?.trim() || "sonic-3";

    const res = await fetch(`${BASE_URL}/tts/bytes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Cartesia-Version": CARTESIA_VERSION,
      },
      body: JSON.stringify({
        model_id: model,
        transcript: text,
        voice: { mode: "id", id: voiceId.trim() },
        language: language || undefined,
        output_format: {
          container: "mp3",
          sample_rate: 44100,
          bit_rate: 128000,
        },
      }),
      signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new TTSError(
        `Cartesia TTS failed: ${res.status} ${res.statusText}. ${errBody}`,
        "cartesia",
        modelId,
        undefined,
        res.status
      );
    }

    // 204 = No Content (unusual for TTS; treat as error)
    if (res.status === 204) {
      throw new TTSError(
        "Cartesia returned 204 No Content. Check model_id, voice_id, and API key.",
        "cartesia",
        modelId,
        undefined,
        204
      );
    }

    const requestId = res.headers.get("Cartesia-Request-ID") ?? undefined;
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    if (audioBuffer.length === 0) {
      throw new TTSError(
        "Cartesia returned empty audio. Verify model_id and voice_id.",
        "cartesia",
        modelId
      );
    }

    return {
      audioBuffer,
      contentType: "audio/mpeg",
      providerRequestId: requestId,
    };
  },
};

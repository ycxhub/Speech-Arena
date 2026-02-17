/**
 * Deepgram TTS Provider Adapter
 * API: https://api.deepgram.com/v1/speak
 * Docs: https://developers.deepgram.com/reference/text-to-speech/speak-request
 */

import type { TTSGenerationResult, TTSProviderAdapter } from "../types";
import { TTSError } from "../errors";

const BASE_URL = "https://api.deepgram.com";

export const deepgramAdapter: TTSProviderAdapter = {
  slug: "deepgram",
  name: "Deepgram",

  async generateAudio({
    text,
    modelId,
    voiceId: _voiceId,
    apiKey,
    signal,
  }): Promise<TTSGenerationResult> {
    const model = modelId?.trim() || "aura-2-thalia-en";
    const url = new URL(`${BASE_URL}/v1/speak`);
    url.searchParams.set("model", model);
    url.searchParams.set("encoding", "mp3");

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify({ text }),
      signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new TTSError(
        `Deepgram TTS failed: ${res.status} ${res.statusText}. ${errBody}`,
        "deepgram",
        modelId,
        undefined,
        res.status
      );
    }

    const requestId = res.headers.get("dg-request-id") ?? undefined;
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    if (audioBuffer.length === 0) {
      throw new TTSError("Deepgram returned empty audio.", "deepgram", modelId);
    }

    return {
      audioBuffer,
      contentType: "audio/mpeg",
      providerRequestId: requestId,
    };
  },
};

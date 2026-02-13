/**
 * OpenAI TTS Provider Adapter
 * API: https://api.openai.com/v1/audio/speech
 * Model = TTS engine (tts-1, tts-1-hd). Voice = character (alloy, nova, etc.).
 */

import type { TTSGenerationResult, TTSProviderAdapter } from "../types";
import { TTSError } from "../errors";

const BASE_URL = "https://api.openai.com";

const GENDER_TO_VOICE: Record<string, string> = {
  male: "onyx",
  female: "nova",
  neutral: "alloy",
};

export const openaiTtsAdapter: TTSProviderAdapter = {
  slug: "openai-tts",
  name: "OpenAI TTS",

  async generateAudio({
    text,
    modelId,
    voiceId,
    gender,
    apiKey,
    signal,
  }): Promise<TTSGenerationResult> {
    const model = modelId || "tts-1-hd";
    const voice = voiceId ?? (GENDER_TO_VOICE[gender] ?? "alloy");

    const res = await fetch(`${BASE_URL}/v1/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: text,
        voice,
        response_format: "mp3",
      }),
      signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new TTSError(
        `OpenAI TTS failed: ${res.status} ${res.statusText}. ${errBody}`,
        "openai-tts",
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

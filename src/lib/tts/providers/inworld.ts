/**
 * Inworld AI TTS Provider Adapter
 * API: https://api.inworld.ai/tts/v1/voice
 * Docs: https://docs.inworld.ai/docs/tts/synthesize-speech
 */

import type { TTSGenerationResult, TTSProviderAdapter } from "../types";
import { TTSError } from "../errors";

const BASE_URL = "https://api.inworld.ai";

export const inworldAdapter: TTSProviderAdapter = {
  slug: "inworld",
  name: "Inworld",

  async generateAudio({
    text,
    modelId,
    voiceId,
    apiKey,
    signal,
  }): Promise<TTSGenerationResult> {
    if (!voiceId?.trim()) {
      throw new TTSError(
        "Inworld requires a voice ID. Add a voice to the model.",
        "inworld",
        modelId
      );
    }

    const model = modelId?.trim() || "inworld-tts-1.5-max";

    const res = await fetch(`${BASE_URL}/tts/v1/voice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          apiKey.startsWith("Basic ") || apiKey.startsWith("Bearer ")
            ? apiKey
            : `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text,
        voiceId: voiceId.trim(),
        modelId: model,
        audioConfig: {
          audioEncoding: "MP3",
          sampleRateHertz: 44100,
          bitRate: 128000,
        },
      }),
      signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new TTSError(
        `Inworld TTS failed: ${res.status} ${res.statusText}. ${errBody}`,
        "inworld",
        modelId,
        undefined,
        res.status
      );
    }

    const json = (await res.json()) as { audioContent?: string };
    if (!json.audioContent) {
      throw new TTSError("Inworld returned no audio content.", "inworld", modelId);
    }

    const audioBuffer = Buffer.from(json.audioContent, "base64");
    if (audioBuffer.length === 0) {
      throw new TTSError("Inworld returned empty audio.", "inworld", modelId);
    }

    return {
      audioBuffer,
      contentType: "audio/mpeg",
    };
  },
};

/**
 * MiniMax TTS Provider Adapter
 * API: https://api.minimax.io/v1/t2a_v2
 * Docs: https://platform.minimax.io/docs/api-reference/speech-t2a-http
 */

import type { TTSGenerationResult, TTSProviderAdapter } from "../types";
import { TTSError } from "../errors";

const BASE_URL = "https://api.minimax.io";

export const minimaxAdapter: TTSProviderAdapter = {
  slug: "minimax",
  name: "Minimax",

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
        "Minimax requires a voice ID. Add a voice to the model.",
        "minimax",
        modelId
      );
    }

    const model = modelId?.trim() || "speech-2.8-hd";

    const res = await fetch(`${BASE_URL}/v1/t2a_v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        text,
        stream: false,
        output_format: "hex",
        voice_setting: {
          voice_id: voiceId.trim(),
          speed: 1,
          vol: 1,
          pitch: 0,
        },
        audio_setting: {
          sample_rate: 44100,
          bitrate: 128000,
          format: "mp3",
          channel: 1,
        },
        language_boost: language ? mapLanguageToMinimax(language) : "auto",
      }),
      signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new TTSError(
        `Minimax TTS failed: ${res.status} ${res.statusText}. ${errBody}`,
        "minimax",
        modelId,
        undefined,
        res.status
      );
    }

    const json = (await res.json()) as {
      data?: { audio?: string };
      base_resp?: { status_code?: number; status_msg?: string };
    };

    // base_resp is at top level per MiniMax API (not inside data)
    const baseResp = json.base_resp;
    if (baseResp?.status_code !== 0 && baseResp?.status_code !== undefined) {
      throw new TTSError(
        `Minimax TTS error: ${baseResp.status_msg ?? baseResp.status_code}`,
        "minimax",
        modelId
      );
    }

    const hexAudio = json.data?.audio;
    if (!hexAudio) {
      throw new TTSError("Minimax returned no audio.", "minimax", modelId);
    }

    const audioBuffer = Buffer.from(hexAudio, "hex");
    if (audioBuffer.length === 0) {
      throw new TTSError("Minimax returned empty audio.", "minimax", modelId);
    }

    return {
      audioBuffer,
      contentType: "audio/mpeg",
    };
  },
};

function mapLanguageToMinimax(lang: string): string {
  const map: Record<string, string> = {
    en: "English",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    es: "Spanish",
    fr: "French",
    de: "German",
    pt: "Portuguese",
    hi: "Hindi",
    ar: "Arabic",
    ru: "Russian",
    it: "Italian",
    nl: "Dutch",
    pl: "Polish",
    tr: "Turkish",
    vi: "Vietnamese",
    id: "Indonesian",
    th: "Thai",
  };
  return map[lang.toLowerCase()] ?? "auto";
}

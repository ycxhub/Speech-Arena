/**
 * Sarvam AI TTS Provider Adapter
 * API: https://api.sarvam.ai/text-to-speech
 * Docs: https://docs.sarvam.ai/api-reference-docs/text-to-speech/convert
 * Model: bulbul:v2 or bulbul:v3. Speaker = voice (e.g. shubh, shreya).
 * Uses BCP 47 language codes (en-IN, hi-IN).
 */

import type { TTSGenerationResult, TTSProviderAdapter } from "../types";
import { TTSError } from "../errors";

const BASE_URL = "https://api.sarvam.ai";

const SARVAM_LANGUAGES = new Set([
  "bn-IN", "en-IN", "gu-IN", "hi-IN", "kn-IN", "ml-IN", "mr-IN",
  "od-IN", "pa-IN", "ta-IN", "te-IN",
]);

function toSarvamLanguage(locale: string | undefined): string {
  if (!locale?.trim()) return "en-IN";
  const code = locale.trim();
  if (SARVAM_LANGUAGES.has(code)) return code;
  const base = code.split("-")[0]?.toLowerCase();
  const mapped: Record<string, string> = {
    en: "en-IN", hi: "hi-IN", bn: "bn-IN", gu: "gu-IN", kn: "kn-IN",
    ml: "ml-IN", mr: "mr-IN", or: "od-IN", pa: "pa-IN", ta: "ta-IN", te: "te-IN",
  };
  return mapped[base ?? ""] ?? "en-IN";
}

export const sarvamAdapter: TTSProviderAdapter = {
  slug: "sarvam",
  name: "Sarvam",

  async generateAudio({
    text,
    modelId,
    voiceId,
    language,
    apiKey,
    signal,
  }): Promise<TTSGenerationResult> {
    const model = modelId?.trim() || "bulbul:v3";
    const speaker = voiceId?.trim() || "shubh";

    const res = await fetch(`${BASE_URL}/text-to-speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model,
        speaker,
        target_language_code: toSarvamLanguage(language),
        output_audio_codec: "mp3",
        speech_sample_rate: "44100",
        pace: 1,
      }),
      signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new TTSError(
        `Sarvam TTS failed: ${res.status} ${res.statusText}. ${errBody}`,
        "sarvam",
        modelId,
        undefined,
        res.status
      );
    }

    const json = (await res.json()) as {
      audios?: string[];
      request_id?: string | null;
    };

    const base64Audio = json.audios?.[0];
    if (!base64Audio) {
      throw new TTSError("Sarvam returned no audio.", "sarvam", modelId);
    }

    const audioBuffer = Buffer.from(base64Audio, "base64");
    if (audioBuffer.length === 0) {
      throw new TTSError("Sarvam returned empty audio.", "sarvam", modelId);
    }

    return {
      audioBuffer,
      contentType: "audio/mpeg",
      providerRequestId: json.request_id ?? undefined,
    };
  },
};

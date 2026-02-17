/**
 * Murf AI TTS Provider Adapter
 * Supports both non-streaming (generate) and streaming endpoints.
 * - Generate: GEN2 only. https://api.murf.ai/v1/speech/generate
 * - Stream: FALCON & GEN2. https://global.api.murf.ai/v1/speech/stream
 * Docs: https://murf.ai/api/docs/api-reference/text-to-speech/
 */

import type { TTSGenerationResult, TTSProviderAdapter } from "../types";
import { TTSError } from "../errors";

const GENERATE_URL = "https://api.murf.ai/v1/speech/generate";
const STREAM_URL = "https://global.api.murf.ai/v1/speech/stream";

/** Map short language codes to Murf multiNativeLocale (e.g. en -> en-US) */
function toMultiNativeLocale(language: string): string {
  const code = language?.trim().toLowerCase();
  if (!code) return "en-US";
  if (code.includes("-")) return code; // Already locale (en-US, es-ES, etc.)
  const map: Record<string, string> = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    it: "it-IT",
    pt: "pt-BR",
    hi: "hi-IN",
    ja: "ja-JP",
    ko: "ko-KR",
    zh: "zh-CN",
    nl: "nl-NL",
    pl: "pl-PL",
    ru: "ru-RU",
    tr: "tr-TR",
    id: "id-ID",
    th: "th-TH",
    vi: "vi-VN",
    ar: "ar-SA",
  };
  return map[code] ?? "en-US";
}

export const murfAdapter: TTSProviderAdapter = {
  slug: "murf",
  name: "Murf AI",

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
        "Murf AI requires a voice ID. Add a voice to the model.",
        "murf",
        modelId
      );
    }

    const model = modelId?.trim().toUpperCase();
    const useStream = model === "FALCON" || model === "GEN2"; // Stream supports both; lower latency

    if (useStream) {
      return generateViaStream({
        text,
        modelId: model || "FALCON",
        voiceId: voiceId.trim(),
        language,
        apiKey,
        signal,
      });
    }

    return generateViaNonStream({
      text,
      modelId: model || "GEN2",
      voiceId: voiceId.trim(),
      apiKey,
      signal,
    });
  },
};

async function generateViaStream({
  text,
  modelId,
  voiceId,
  language,
  apiKey,
  signal,
}: {
  text: string;
  modelId: string;
  voiceId: string;
  language: string;
  apiKey: string;
  signal?: AbortSignal;
}): Promise<TTSGenerationResult> {
  const multiNativeLocale = toMultiNativeLocale(language);
  const sampleRate = modelId === "FALCON" ? 24000 : 44100;

  const res = await fetch(STREAM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      text,
      voiceId,
      model: modelId,
      format: "MP3",
      sampleRate,
      multiNativeLocale,
    }),
    signal,
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new TTSError(
      `Murf AI stream failed: ${res.status} ${res.statusText}. ${errBody}`,
      "murf",
      modelId,
      undefined,
      res.status
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);

  if (audioBuffer.length === 0) {
    throw new TTSError("Murf AI stream returned empty audio.", "murf", modelId);
  }

  return {
    audioBuffer,
    contentType: "audio/mpeg",
  };
}

async function generateViaNonStream({
  text,
  modelId,
  voiceId,
  apiKey,
  signal,
}: {
  text: string;
  modelId: string;
  voiceId: string;
  apiKey: string;
  signal?: AbortSignal;
}): Promise<TTSGenerationResult> {
  // Generate endpoint only supports GEN2

  const res = await fetch(GENERATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      text,
      voiceId,
      format: "MP3",
      sampleRate: 44100,
      encodeAsBase64: true,
      modelVersion: "GEN2",
    }),
    signal,
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new TTSError(
      `Murf AI TTS failed: ${res.status} ${res.statusText}. ${errBody}`,
      "murf",
      modelId,
      undefined,
      res.status
    );
  }

  const json = (await res.json()) as { encodedAudio?: string; audioFile?: string };
  let audioBuffer: Buffer;

  if (json.encodedAudio) {
    audioBuffer = Buffer.from(json.encodedAudio, "base64");
  } else if (json.audioFile) {
    const audioRes = await fetch(json.audioFile, { signal });
    if (!audioRes.ok) {
      throw new TTSError(
        `Murf AI: Failed to fetch audio from URL: ${audioRes.status}`,
        "murf",
        modelId
      );
    }
    const arrayBuffer = await audioRes.arrayBuffer();
    audioBuffer = Buffer.from(arrayBuffer);
  } else {
    throw new TTSError(
      "Murf AI: No audio in response (use encodeAsBase64 or audioFile)",
      "murf",
      modelId
    );
  }

  if (audioBuffer.length === 0) {
    throw new TTSError("Murf AI returned empty audio.", "murf", modelId);
  }

  return {
    audioBuffer,
    contentType: "audio/mpeg",
  };
}

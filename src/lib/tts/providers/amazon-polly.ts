/**
 * Amazon Polly TTS Provider Adapter
 * Supports Neural, Standard, Long-form, and Generative engines.
 * Docs: https://docs.aws.amazon.com/polly/latest/dg/API_SynthesizeSpeech.html
 */

import {
  PollyClient,
  SynthesizeSpeechCommand,
  type Engine,
  type VoiceId,
  type LanguageCode,
} from "@aws-sdk/client-polly";
import type { TTSGenerationResult, TTSProviderAdapter } from "../types";
import { TTSError } from "../errors";

/** Parse JSON-encoded AWS credentials from the api_keys table. */
function parseCredentials(apiKey: string): {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
} {
  try {
    const parsed = JSON.parse(apiKey);
    if (!parsed.accessKeyId || !parsed.secretAccessKey) {
      throw new Error("Missing accessKeyId or secretAccessKey");
    }
    return {
      accessKeyId: parsed.accessKeyId,
      secretAccessKey: parsed.secretAccessKey,
      region: parsed.region ?? "us-east-1",
    };
  } catch {
    throw new TTSError(
      "Amazon Polly API key must be JSON: {accessKeyId, secretAccessKey, region?}",
      "amazon-polly"
    );
  }
}

/** Map modelId to Polly Engine. */
function toEngine(modelId: string): Engine {
  const id = modelId?.trim().toLowerCase();
  switch (id) {
    case "neural":
      return "neural";
    case "standard":
      return "standard";
    case "long-form":
      return "long-form";
    case "generative":
      return "generative";
    default:
      return "neural";
  }
}

/** Map short language codes to Polly LanguageCode (e.g. en -> en-US). */
function toPollyLanguageCode(language: string): string {
  const code = language?.trim().toLowerCase();
  if (!code) return "en-US";
  if (code.includes("-")) return code;
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
    zh: "cmn-CN",
    nl: "nl-NL",
    pl: "pl-PL",
    ru: "ru-RU",
    tr: "tr-TR",
    ar: "arb",
    da: "da-DK",
    nb: "nb-NO",
    sv: "sv-SE",
    ro: "ro-RO",
    ca: "ca-ES",
    cy: "cy-GB",
    is: "is-IS",
  };
  return map[code] ?? "en-US";
}

/** Collect a ReadableStream / Readable / Blob into a Buffer. */
async function streamToBuffer(
  stream: unknown
): Promise<Buffer> {
  if (stream instanceof Blob) {
    const ab = await stream.arrayBuffer();
    return Buffer.from(ab);
  }

  if (
    typeof stream === "object" &&
    stream !== null &&
    "transformToByteArray" in stream &&
    typeof (stream as { transformToByteArray: unknown }).transformToByteArray ===
      "function"
  ) {
    const bytes = await (
      stream as { transformToByteArray: () => Promise<Uint8Array> }
    ).transformToByteArray();
    return Buffer.from(bytes);
  }

  if (
    typeof stream === "object" &&
    stream !== null &&
    Symbol.asyncIterator in (stream as Record<symbol, unknown>)
  ) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  throw new TTSError(
    "Amazon Polly: Unexpected AudioStream type",
    "amazon-polly"
  );
}

export const amazonPollyAdapter: TTSProviderAdapter = {
  slug: "amazon-polly",
  name: "Amazon Polly",

  async generateAudio({
    text,
    modelId,
    voiceId,
    language,
    apiKey,
  }): Promise<TTSGenerationResult> {
    if (!voiceId?.trim()) {
      throw new TTSError(
        "Amazon Polly requires a VoiceId (e.g. Joanna, Matthew).",
        "amazon-polly",
        modelId
      );
    }

    const creds = parseCredentials(apiKey);
    const engine = toEngine(modelId);
    const languageCode = toPollyLanguageCode(language);

    const client = new PollyClient({
      region: creds.region,
      credentials: {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
      },
    });

    const command = new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: "mp3",
      VoiceId: voiceId.trim() as VoiceId,
      Engine: engine,
      LanguageCode: languageCode as LanguageCode,
      SampleRate: "24000",
    });

    let response;
    try {
      response = await client.send(command);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new TTSError(
        `Amazon Polly synthesis failed: ${msg}`,
        "amazon-polly",
        modelId,
        undefined,
        undefined
      );
    }

    if (!response.AudioStream) {
      throw new TTSError(
        "Amazon Polly returned no AudioStream",
        "amazon-polly",
        modelId
      );
    }

    const audioBuffer = await streamToBuffer(response.AudioStream);

    if (audioBuffer.length === 0) {
      throw new TTSError(
        "Amazon Polly returned empty audio.",
        "amazon-polly",
        modelId
      );
    }

    return {
      audioBuffer,
      contentType: "audio/mpeg",
    };
  },
};

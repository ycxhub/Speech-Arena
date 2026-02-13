/**
 * Google Cloud TTS Provider Adapter (stub)
 * To be implemented when Google Cloud TTS is added.
 */

import type { TTSGenerationResult, TTSProviderAdapter } from "../types";

export const googleCloudTtsAdapter: TTSProviderAdapter = {
  slug: "google-cloud-tts",
  name: "Google Cloud TTS",

  async generateAudio(_params): Promise<TTSGenerationResult> {
    throw new Error("Google Cloud TTS adapter is not yet implemented");
  },
};

/**
 * Azure TTS Provider Adapter (stub)
 * To be implemented when Azure TTS is added.
 */

import type { TTSGenerationResult, TTSProviderAdapter } from "../types";

export const azureTtsAdapter: TTSProviderAdapter = {
  slug: "azure-tts",
  name: "Azure TTS",

  async generateAudio(_params): Promise<TTSGenerationResult> {
    throw new Error("Azure TTS adapter is not yet implemented");
  },
};

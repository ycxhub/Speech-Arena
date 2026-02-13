/**
 * Amazon Polly TTS Provider Adapter (stub)
 * To be implemented when Amazon Polly is added.
 */

import type { TTSGenerationResult, TTSProviderAdapter } from "../types";

export const amazonPollyAdapter: TTSProviderAdapter = {
  slug: "amazon-polly",
  name: "Amazon Polly",

  async generateAudio(_params): Promise<TTSGenerationResult> {
    throw new Error("Amazon Polly adapter is not yet implemented");
  },
};

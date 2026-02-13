/**
 * TTS Audio Generation Pipeline
 * PRD 07: Main exports for audio generation.
 */

export { generateAndStoreAudio, generateAndStoreAudioPair } from "./generate";
export type { GenerateAndStoreResult } from "./generate";
export { getProvider, registerProvider, hasProvider, listProviders } from "./registry";
export type { TTSGenerationResult, TTSProviderAdapter } from "./types";

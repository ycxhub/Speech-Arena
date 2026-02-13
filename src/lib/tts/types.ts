/**
 * TTS Audio Generation Pipeline — Types
 * PRD 07: Provider adapter interface and generation result.
 */

export interface TTSGenerationResult {
  audioBuffer: Buffer;
  contentType: string; // e.g., "audio/mpeg"
  durationMs?: number; // audio duration if returned by the API
  providerRequestId?: string; // provider's request ID for debugging
}

export interface TTSProviderAdapter {
  readonly slug: string;
  readonly name: string;

  generateAudio(params: {
    text: string;
    modelId: string;   // Provider's TTS model (e.g. eleven_multilingual_v2, tts-1-hd)
    voiceId?: string;  // Provider's voice/character ID (e.g. ElevenLabs voice ID). Optional.
    language: string;
    gender: string;
    apiKey: string;
    signal?: AbortSignal; // For timeout/abort support
  }): Promise<TTSGenerationResult>;

  /** Optional: check if the provider is reachable */
  healthCheck?(apiKey: string): Promise<boolean>;
}

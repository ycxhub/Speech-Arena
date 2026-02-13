/**
 * Structured TTS errors for logging and handling.
 */

export class TTSError extends Error {
  constructor(
    message: string,
    public readonly providerSlug: string,
    public readonly modelId?: string,
    public readonly sentenceId?: string,
    public readonly httpStatus?: number,
    public readonly latencyMs?: number
  ) {
    super(message);
    this.name = "TTSError";
  }

  toLogObject(): Record<string, unknown> {
    return {
      provider: this.providerSlug,
      modelId: this.modelId,
      sentenceId: this.sentenceId,
      httpStatus: this.httpStatus,
      latencyMs: this.latencyMs,
      message: this.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Retry wrapper for TTS provider API calls.
 * PRD 07: Up to 2 retries with exponential backoff (1s, 3s), 30s timeout.
 * Uses AbortController to properly abort fetch on timeout.
 */

const TIMEOUT_MS = 30_000;
const RETRY_DELAYS_MS = [1000, 3000]; // 1s, 3s

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("timeout") || msg.includes("abort") || msg.includes("econnreset") || msg.includes("network")) {
      return true;
    }
    if (msg.includes("500") || msg.includes("502") || msg.includes("503") || msg.includes("504")) {
      return true;
    }
  }
  return false;
}

export interface RetryOptions {
  timeoutMs?: number;
}

/**
 * Execute an async function with timeout (AbortController) and retries.
 * The function receives an AbortSignal; it should pass it to fetch() for proper abort.
 */
export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? TIMEOUT_MS;
  let lastError: unknown;

  const runWithTimeout = (): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    return fn(controller.signal).finally(() => clearTimeout(timeoutId));
  };

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await runWithTimeout();
    } catch (err) {
      lastError = err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`TTS request timed out after ${timeoutMs}ms`);
      }
      if (attempt < RETRY_DELAYS_MS.length && isRetryableError(err)) {
        await sleep(RETRY_DELAYS_MS[attempt]!);
      } else {
        throw err;
      }
    }
  }

  throw lastError;
}

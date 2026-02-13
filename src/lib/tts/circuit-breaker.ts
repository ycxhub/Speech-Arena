/**
 * Simple circuit breaker for TTS provider failures.
 * PRD 07: Log warning after 5 consecutive failures. No auto-deactivation.
 */

const CONSECUTIVE_FAILURE_THRESHOLD = 5;

const failureCounts = new Map<string, number>();

export function recordFailure(providerSlug: string): void {
  const count = (failureCounts.get(providerSlug) ?? 0) + 1;
  failureCounts.set(providerSlug, count);

  if (count >= CONSECUTIVE_FAILURE_THRESHOLD) {
    console.warn(
      `[TTS Circuit Breaker] Provider "${providerSlug}" has failed ${count} consecutive times. Consider checking provider status.`
    );
  }
}

export function recordSuccess(providerSlug: string): void {
  failureCounts.set(providerSlug, 0);
}

export function getConsecutiveFailureCount(providerSlug: string): number {
  return failureCounts.get(providerSlug) ?? 0;
}

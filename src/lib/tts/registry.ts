/**
 * TTS Provider Registry
 * Maps provider slugs to adapter instances.
 */

import type { TTSProviderAdapter } from "./types";

const registry = new Map<string, TTSProviderAdapter>();

export function registerProvider(adapter: TTSProviderAdapter): void {
  registry.set(adapter.slug, adapter);
}

export function getProvider(slug: string): TTSProviderAdapter {
  const adapter = registry.get(slug);
  if (!adapter) {
    throw new Error(`TTS provider not found: ${slug}. No adapter registered for this slug.`);
  }
  return adapter;
}

export function hasProvider(slug: string): boolean {
  return registry.has(slug);
}

export function listProviders(): TTSProviderAdapter[] {
  return Array.from(registry.values());
}

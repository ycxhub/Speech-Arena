"use server";

import { getAdminClient } from "@/lib/supabase/admin";

/**
 * Playground tables are added via migration but may not yet be in the
 * auto-generated Supabase types. We cast to `any` for these two tables.
 * Regenerate types after running the 20260316 migration to remove casts.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any;

export interface PlaygroundConfig {
  id: string;
  slug: string;
  title: string;
  headline: string;
  modelALabel: string;
  modelBLabel: string;
  modelAProviderSlug: string;
  modelAModelId: string;
  modelBProviderSlug: string;
  modelBModelId: string;
}

export interface LanguageOption {
  id: string;
  code: string;
  name: string;
}

export interface VoiceOption {
  voiceId: string;
  displayName: string;
  gender: string;
}

export interface SampleSentence {
  id: string;
  text: string;
  sortOrder: number;
}

export async function getPlaygroundConfig(
  slug: string
): Promise<PlaygroundConfig | null> {
  const supabase = getAdminClient();
  const { data, error } = await (supabase.from("playground_pages" as AnyTable) as AnyTable)
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as {
    id: string;
    slug: string;
    title: string;
    headline: string;
    model_a_label: string;
    model_b_label: string;
    model_a_provider_slug: string;
    model_a_model_id: string;
    model_b_provider_slug: string;
    model_b_model_id: string;
  };

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    headline: row.headline,
    modelALabel: row.model_a_label,
    modelBLabel: row.model_b_label,
    modelAProviderSlug: row.model_a_provider_slug,
    modelAModelId: row.model_a_model_id,
    modelBProviderSlug: row.model_b_provider_slug,
    modelBModelId: row.model_b_model_id,
  };
}

/**
 * Get languages that have voices for BOTH providers in this playground page.
 */
export async function getLanguagesForPlayground(
  providerSlugA: string,
  providerSlugB: string
): Promise<LanguageOption[]> {
  const supabase = getAdminClient();

  const { data: providerA } = await supabase
    .from("providers")
    .select("id")
    .eq("slug", providerSlugA)
    .maybeSingle();

  const { data: providerB } = await supabase
    .from("providers")
    .select("id")
    .eq("slug", providerSlugB)
    .maybeSingle();

  if (!providerA || !providerB) return [];

  const { data: voicesA } = await supabase
    .from("provider_voices")
    .select("language_id")
    .eq("provider_id", providerA.id);

  const { data: voicesB } = await supabase
    .from("provider_voices")
    .select("language_id")
    .eq("provider_id", providerB.id);

  if (!voicesA || !voicesB) return [];

  const langIdsA = new Set(voicesA.map((v) => v.language_id));
  const langIdsB = new Set(voicesB.map((v) => v.language_id));
  const commonLangIds = [...langIdsA].filter((id) => langIdsB.has(id));

  if (commonLangIds.length === 0) return [];

  const { data: languages } = await supabase
    .from("languages")
    .select("id, code, name")
    .in("id", commonLangIds)
    .eq("is_active", true)
    .order("name");

  return (languages ?? []).map((l) => ({
    id: l.id,
    code: l.code,
    name: l.name,
  }));
}

/**
 * Get voices for a specific provider + language.
 */
export async function getVoicesForProvider(
  providerSlug: string,
  languageId: string
): Promise<VoiceOption[]> {
  const supabase = getAdminClient();

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("slug", providerSlug)
    .maybeSingle();

  if (!provider) return [];

  const { data: voices } = await supabase
    .from("provider_voices")
    .select("voice_id, display_name, gender")
    .eq("provider_id", provider.id)
    .eq("language_id", languageId)
    .order("display_name");

  return (voices ?? []).map((v) => ({
    voiceId: v.voice_id,
    displayName: v.display_name?.trim() || v.voice_id,
    gender: v.gender,
  }));
}

/**
 * Get sample sentences for a playground page and language.
 */
export async function getSampleSentences(
  playgroundPageId: string,
  languageId: string
): Promise<SampleSentence[]> {
  const supabase = getAdminClient();

  const { data } = await (supabase.from("playground_sample_sentences" as AnyTable) as AnyTable)
    .select("id, text, sort_order")
    .eq("playground_page_id", playgroundPageId)
    .eq("language_id", languageId)
    .order("sort_order");

  if (!data) return [];

  return (data as Array<{ id: string; text: string; sort_order: number }>).map((s) => ({
    id: s.id,
    text: s.text,
    sortOrder: s.sort_order,
  }));
}

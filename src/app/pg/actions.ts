"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import type { LanguageOption } from "./[slug]/actions";

const MURF_PROVIDER_SLUG = "murf";
const FALCON_MODEL_ID = "FALCON";

/**
 * Get all languages where Murf Falcon has at least one voice.
 * Unlike getLanguagesForPlayground() which intersects two providers,
 * this returns every language with Falcon voices.
 */
export async function getMurfFalconLanguages(): Promise<LanguageOption[]> {
  const supabase = getAdminClient();

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("slug", MURF_PROVIDER_SLUG)
    .maybeSingle();

  if (!provider) return [];

  const { data: voices } = await supabase
    .from("provider_voices")
    .select("language_id")
    .eq("provider_id", provider.id)
    .eq("model_id", FALCON_MODEL_ID);

  if (!voices || voices.length === 0) return [];

  const uniqueLangIds = [...new Set(voices.map((v) => v.language_id))];

  const { data: languages } = await supabase
    .from("languages")
    .select("id, code, name")
    .in("id", uniqueLangIds)
    .eq("is_active", true)
    .order("name");

  return (languages ?? []).map((l) => ({
    id: l.id,
    code: l.code,
    name: l.name,
  }));
}

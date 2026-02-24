import { getAdminClient } from "@/lib/supabase/admin";

export type ModelPageData = {
  id: string;
  provider_id: string;
  definition_name: string;
  slug: string;
  logo_url: string | null;
  one_liner: string;
  overview_md: string | null;
  rank_override: number | null;
  use_elo_rank: boolean;
  latency_ms: number | null;
  price_input_per_million_chars: number | null;
  price_output_per_million_chars: number | null;
  data_residency: string | null;
  on_prem: boolean | null;
  launched_at: string | null;
  launched_at_text: string | null;
  multilingual: boolean | null;
  multilingual_count: number | null;
  endpoint_streaming: boolean;
  endpoint_websocket: boolean;
  endpoint_non_streaming: boolean;
  feature_voice_cloning: boolean | null;
  feature_voice_design: boolean | null;
  feature_open_source: boolean | null;
  use_case_conversational: boolean | null;
  use_case_voice_agents: boolean | null;
  use_case_expressive: boolean | null;
  use_case_flat_content: boolean | null;
  use_case_multilingual: boolean | null;
  strengths: string[];
  weaknesses: string[];
  pricing_description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
  provider_name?: string;
  provider_slug?: string;
  provider_logo_url?: string | null;
};

export async function getModelPageBySlug(slug: string): Promise<ModelPageData | null> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("model_pages")
    .select("*, providers(name, slug, logo_url)")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  const p = data.providers as { name: string; slug: string; logo_url: string | null } | null;
  return {
    ...data,
    provider_name: p?.name,
    provider_slug: p?.slug,
    provider_logo_url: p?.logo_url,
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
  } as ModelPageData;
}

export async function listAllModelPages(): Promise<ModelPageData[]> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("model_pages")
    .select("*, providers(name, slug, logo_url)")
    .order("slug");

  if (error) return [];
  return (data ?? []).map((row: Record<string, unknown>) => {
    const p = row.providers as { name: string; slug: string; logo_url: string | null } | null;
    return {
      ...row,
      provider_name: p?.name,
      provider_slug: p?.slug,
      provider_logo_url: p?.logo_url,
      strengths: Array.isArray(row.strengths) ? row.strengths : [],
      weaknesses: Array.isArray(row.weaknesses) ? row.weaknesses : [],
    } as ModelPageData;
  });
}

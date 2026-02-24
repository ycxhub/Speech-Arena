"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function logAudit(
  admin: ReturnType<typeof getAdminClient>,
  userId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details?: Record<string, unknown>
) {
  await admin.from("admin_audit_log").insert({
    admin_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: (details ?? null) as import("@/types/database").Json | null,
  });
}

function slugValid(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim().toLowerCase());
}

export type ModelPageRow = {
  id: string;
  provider_id: string;
  definition_name: string;
  slug: string;
  one_liner: string;
  rank_override: number | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  provider_name?: string;
  provider_slug?: string;
};

export async function listModelPages(): Promise<ModelPageRow[]> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("model_pages")
    .select(
      `
      id,
      provider_id,
      definition_name,
      slug,
      one_liner,
      rank_override,
      is_featured,
      created_at,
      updated_at,
      providers (name, slug)
    `
    )
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((row: Record<string, unknown>) => {
    const p = row.providers as { name: string; slug: string } | null;
    return {
      id: row.id as string,
      provider_id: row.provider_id as string,
      definition_name: row.definition_name as string,
      slug: row.slug as string,
      one_liner: row.one_liner as string,
      rank_override: row.rank_override as number | null,
      is_featured: row.is_featured as boolean,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      provider_name: p?.name,
      provider_slug: p?.slug,
    };
  });
}

export async function getModelPage(id: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("model_pages")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

export async function getModelPageBySlug(slug: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("model_pages")
    .select("*, providers(name, slug, logo_url)")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

export async function getProvidersWithDefinitions(): Promise<
  { id: string; name: string; slug: string; definitions: { id: string; name: string; model_id: string }[] }[]
> {
  const admin = getAdminClient();
  const { data: providers } = await admin.from("providers").select("id, name, slug").order("name");
  const { data: defs } = await admin
    .from("provider_model_definitions")
    .select("id, provider_id, name, model_id")
    .order("name");

  const defsByProvider = new Map<string, { id: string; name: string; model_id: string }[]>();
  for (const d of defs ?? []) {
    const list = defsByProvider.get(d.provider_id) ?? [];
    list.push({ id: d.id, name: d.name, model_id: d.model_id });
    defsByProvider.set(d.provider_id, list);
  }

  return (providers ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    definitions: defsByProvider.get(p.id) ?? [],
  }));
}

export async function createModelPage(
  providerId: string,
  definitionName: string,
  slug: string,
  oneLiner: string
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const s = slug.trim().toLowerCase();
  if (!slugValid(s)) return { error: "Slug must be URL-safe (lowercase alphanumeric and hyphens)" };
  if (!oneLiner.trim()) return { error: "One-liner is required" };

  const { data: bySlug } = await admin.from("model_pages").select("id").eq("slug", s).maybeSingle();
  if (bySlug) return { error: "A model page with this slug already exists" };

  const { data: byDef } = await admin
    .from("model_pages")
    .select("id")
    .eq("provider_id", providerId)
    .eq("definition_name", definitionName)
    .maybeSingle();
  if (byDef) return { error: "A model page for this definition already exists" };

  const { data: def } = await admin
    .from("provider_model_definitions")
    .select("id")
    .eq("provider_id", providerId)
    .eq("name", definitionName)
    .maybeSingle();
  if (!def) return { error: "Definition not found" };

  const { data: inserted, error } = await admin
    .from("model_pages")
    .insert({
      provider_id: providerId,
      definition_name: definitionName,
      slug: s,
      one_liner: oneLiner.trim(),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  await logAudit(admin, user.id, "create_model_page", "model_pages", inserted?.id ?? null, {
    slug: s,
    provider_id: providerId,
    definition_name: definitionName,
  });
  revalidatePath("/admin/model-pages");
  revalidatePath("/models");
  return { id: inserted?.id };
}

export async function updateModelPage(
  id: string,
  updates: Partial<{
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
  }>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  if (updates.slug !== undefined) {
    const s = updates.slug.trim().toLowerCase();
    if (!slugValid(s)) return { error: "Slug must be URL-safe" };
    const { data: existing } = await admin
      .from("model_pages")
      .select("id")
      .eq("slug", s)
      .neq("id", id)
      .maybeSingle();
    if (existing) return { error: "Slug already in use" };
    updates.slug = s;
  }

  const { error } = await admin
    .from("model_pages")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  await logAudit(admin, user.id, "update_model_page", "model_pages", id, { updates: Object.keys(updates) });
  revalidatePath("/admin/model-pages");
  revalidatePath("/models");
  revalidatePath(`/models/${updates?.slug ?? "*"}`);
  return {};
}

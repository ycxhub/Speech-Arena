"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Json } from "@/types/database";

/**
 * Playground tables are added via migration but may not yet be in the
 * auto-generated Supabase types. We cast to `any` for these two tables
 * and type the results explicitly. Regenerate types after running the
 * 20260316 migration to remove these casts.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Forbidden");

  return { userId: user.id, admin };
}

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
    details: (details ?? null) as Json | null,
  });
}

/* ---------- Playground pages ---------- */

export type PlaygroundPageRow = {
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
  is_active: boolean;
  created_at: string;
  sentence_count: number;
};

export async function listPlaygroundPages(): Promise<PlaygroundPageRow[]> {
  const admin = getAdminClient();
  const { data, error } = await (admin.from("playground_pages" as AnyTable) as AnyTable)
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as Array<{
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
    is_active: boolean;
    created_at: string;
  }>;

  const pageIds = rows.map((p) => p.id);
  const sentenceCounts: Record<string, number> = {};
  if (pageIds.length > 0) {
    const { data: counts } = await (admin.from("playground_sample_sentences" as AnyTable) as AnyTable)
      .select("playground_page_id")
      .in("playground_page_id", pageIds);
    if (counts) {
      for (const c of counts as Array<{ playground_page_id: string }>) {
        sentenceCounts[c.playground_page_id] =
          (sentenceCounts[c.playground_page_id] ?? 0) + 1;
      }
    }
  }

  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    headline: p.headline,
    model_a_label: p.model_a_label,
    model_b_label: p.model_b_label,
    model_a_provider_slug: p.model_a_provider_slug,
    model_a_model_id: p.model_a_model_id,
    model_b_provider_slug: p.model_b_provider_slug,
    model_b_model_id: p.model_b_model_id,
    is_active: p.is_active,
    created_at: p.created_at,
    sentence_count: sentenceCounts[p.id] ?? 0,
  }));
}

export async function getPlaygroundPage(id: string) {
  const admin = getAdminClient();
  const { data } = await (admin.from("playground_pages" as AnyTable) as AnyTable)
    .select("*")
    .eq("id", id)
    .single();

  if (!data) return null;

  return data as {
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
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export async function createPlaygroundPage(input: {
  slug: string;
  title: string;
  headline: string;
  modelALabel: string;
  modelBLabel: string;
  modelAProviderSlug: string;
  modelAModelId: string;
  modelBProviderSlug: string;
  modelBModelId: string;
}): Promise<{ error?: string; id?: string }> {
  const { userId, admin } = await requireAdmin();
  const slug = input.slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    return { error: "Slug must be URL-safe" };

  const { data: existing } = await (admin.from("playground_pages" as AnyTable) as AnyTable)
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return { error: "Slug already exists" };

  const { data: inserted, error } = await (admin.from("playground_pages" as AnyTable) as AnyTable)
    .insert({
      slug,
      title: input.title.trim(),
      headline: input.headline.trim(),
      model_a_label: input.modelALabel.trim(),
      model_b_label: input.modelBLabel.trim(),
      model_a_provider_slug: input.modelAProviderSlug.trim(),
      model_a_model_id: input.modelAModelId.trim(),
      model_b_provider_slug: input.modelBProviderSlug.trim(),
      model_b_model_id: input.modelBModelId.trim(),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit(admin, userId, "create_playground_page", "playground_pages", inserted?.id ?? null, { slug });
  revalidatePath("/admin/murf-playground");
  return { id: inserted?.id };
}

export async function updatePlaygroundPage(
  id: string,
  updates: Partial<{
    slug: string;
    title: string;
    headline: string;
    model_a_label: string;
    model_b_label: string;
    model_a_provider_slug: string;
    model_a_model_id: string;
    model_b_provider_slug: string;
    model_b_model_id: string;
    is_active: boolean;
  }>
): Promise<{ error?: string }> {
  const { userId, admin } = await requireAdmin();

  if (updates.slug !== undefined) {
    const s = updates.slug.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))
      return { error: "Slug must be URL-safe" };
    const { data: existing } = await (admin.from("playground_pages" as AnyTable) as AnyTable)
      .select("id")
      .eq("slug", s)
      .neq("id", id)
      .maybeSingle();
    if (existing) return { error: "Slug already in use" };
    updates.slug = s;
  }

  const { error } = await (admin.from("playground_pages" as AnyTable) as AnyTable)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  await logAudit(admin, userId, "update_playground_page", "playground_pages", id, {
    updates: Object.keys(updates),
  });
  revalidatePath("/admin/murf-playground");
  return {};
}

export async function deletePlaygroundPage(
  id: string
): Promise<{ error?: string }> {
  const { userId, admin } = await requireAdmin();
  const { error } = await (admin.from("playground_pages" as AnyTable) as AnyTable)
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  await logAudit(admin, userId, "delete_playground_page", "playground_pages", id);
  revalidatePath("/admin/murf-playground");
  return {};
}

/* ---------- Sample sentences ---------- */

export type SampleSentenceRow = {
  id: string;
  text: string;
  language_id: string;
  language_code: string;
  language_name: string;
  sort_order: number;
  created_at: string;
};

export async function listSentencesForPage(
  pageId: string,
  languageId?: string
): Promise<SampleSentenceRow[]> {
  const admin = getAdminClient();

  let query = (admin.from("playground_sample_sentences" as AnyTable) as AnyTable)
    .select("id, text, language_id, sort_order, created_at")
    .eq("playground_page_id", pageId)
    .order("sort_order");

  if (languageId) query = query.eq("language_id", languageId);

  const { data } = await query;
  if (!data) return [];

  const rows = data as Array<{
    id: string;
    text: string;
    language_id: string;
    sort_order: number;
    created_at: string;
  }>;

  const langIds = [...new Set(rows.map((s) => s.language_id))];
  if (langIds.length === 0) return [];

  const { data: langs } = await admin
    .from("languages")
    .select("id, code, name")
    .in("id", langIds);
  const langMap = new Map((langs ?? []).map((l) => [l.id, l]));

  return rows.map((s) => {
    const lang = langMap.get(s.language_id);
    return {
      id: s.id,
      text: s.text,
      language_id: s.language_id,
      language_code: lang?.code ?? "",
      language_name: lang?.name ?? "",
      sort_order: s.sort_order,
      created_at: s.created_at,
    };
  });
}

export async function addSentence(
  pageId: string,
  languageId: string,
  text: string
): Promise<{ error?: string }> {
  const { userId, admin } = await requireAdmin();

  const { data: maxRow } = await (admin.from("playground_sample_sentences" as AnyTable) as AnyTable)
    .select("sort_order")
    .eq("playground_page_id", pageId)
    .eq("language_id", languageId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = ((maxRow as { sort_order: number } | null)?.sort_order ?? -1) + 1;

  const { error } = await (admin.from("playground_sample_sentences" as AnyTable) as AnyTable).insert({
    playground_page_id: pageId,
    language_id: languageId,
    text: text.trim(),
    sort_order: nextOrder,
  });

  if (error) return { error: error.message };
  await logAudit(admin, userId, "add_playground_sentence", "playground_sample_sentences", null, {
    pageId,
    languageId,
  });
  revalidatePath(`/admin/murf-playground/${pageId}`);
  return {};
}

export async function updateSentence(
  id: string,
  text: string
): Promise<{ error?: string }> {
  const { userId, admin } = await requireAdmin();
  const { error } = await (admin.from("playground_sample_sentences" as AnyTable) as AnyTable)
    .update({ text: text.trim() })
    .eq("id", id);
  if (error) return { error: error.message };
  await logAudit(admin, userId, "update_playground_sentence", "playground_sample_sentences", id);
  revalidatePath("/admin/murf-playground");
  return {};
}

export async function deleteSentence(
  id: string
): Promise<{ error?: string }> {
  const { userId, admin } = await requireAdmin();
  const { error } = await (admin.from("playground_sample_sentences" as AnyTable) as AnyTable)
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  await logAudit(admin, userId, "delete_playground_sentence", "playground_sample_sentences", id);
  revalidatePath("/admin/murf-playground");
  return {};
}

export async function getLanguagesForAdmin(): Promise<
  { id: string; code: string; name: string }[]
> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("languages")
    .select("id, code, name")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

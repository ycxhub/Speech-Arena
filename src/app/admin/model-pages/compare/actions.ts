"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { listModelPages } from "../actions";
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

export type ComparePageRow = {
  id: string;
  slug: string;
  model_page_a_id: string;
  model_page_b_id: string;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  model_a_slug?: string;
  model_a_name?: string;
  model_b_slug?: string;
  model_b_name?: string;
};

export async function listComparePages(): Promise<ComparePageRow[]> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("compare_pages")
    .select(
      `
      id,
      slug,
      model_page_a_id,
      model_page_b_id,
      meta_title,
      meta_description,
      created_at,
      updated_at,
      model_page_a:model_page_a_id(slug, definition_name),
      model_page_b:model_page_b_id(slug, definition_name)
    `
    )
    .order("slug");

  if (error) return [];
  return (data ?? []).map((row: Record<string, unknown>) => {
    const a = row.model_page_a as { slug: string; definition_name: string } | null;
    const b = row.model_page_b as { slug: string; definition_name: string } | null;
    return {
      id: row.id as string,
      slug: row.slug as string,
      model_page_a_id: row.model_page_a_id as string,
      model_page_b_id: row.model_page_b_id as string,
      meta_title: row.meta_title as string | null,
      meta_description: row.meta_description as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      model_a_slug: a?.slug,
      model_a_name: a?.definition_name,
      model_b_slug: b?.slug,
      model_b_name: b?.definition_name,
    };
  });
}

export async function getComparePage(id: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("compare_pages")
    .select("*, model_page_a:model_page_a_id(slug, definition_name), model_page_b:model_page_b_id(slug, definition_name)")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

export async function createComparePage(
  slug: string,
  modelPageAId: string,
  modelPageBId: string,
  metaTitle?: string | null,
  metaDescription?: string | null
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  if (modelPageAId === modelPageBId) return { error: "Model A and Model B must be different" };

  const s = slug.trim().toLowerCase();
  if (!slugValid(s)) return { error: "Slug must be URL-safe (lowercase alphanumeric and hyphens)" };

  const { data: bySlug } = await admin.from("compare_pages").select("id").eq("slug", s).maybeSingle();
  if (bySlug) return { error: "A compare page with this slug already exists" };

  const { data: inserted, error } = await admin
    .from("compare_pages")
    .insert({
      slug: s,
      model_page_a_id: modelPageAId,
      model_page_b_id: modelPageBId,
      meta_title: metaTitle?.trim() || null,
      meta_description: metaDescription?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  await logAudit(admin, user.id, "create_compare_page", "compare_pages", inserted?.id ?? null, {
    slug: s,
    model_page_a_id: modelPageAId,
    model_page_b_id: modelPageBId,
  });
  revalidatePath("/admin/model-pages/compare");
  revalidatePath("/models/compare");
  return { id: inserted?.id };
}

export async function updateComparePage(
  id: string,
  updates: Partial<{
    slug: string;
    model_page_a_id: string;
    model_page_b_id: string;
    meta_title: string | null;
    meta_description: string | null;
  }>
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  if (
    updates.model_page_a_id !== undefined &&
    updates.model_page_b_id !== undefined &&
    updates.model_page_a_id === updates.model_page_b_id
  ) {
    return { error: "Model A and Model B must be different" };
  }

  if (updates.slug !== undefined) {
    const s = updates.slug.trim().toLowerCase();
    if (!slugValid(s)) return { error: "Slug must be URL-safe" };
    const { data: existing } = await admin
      .from("compare_pages")
      .select("id")
      .eq("slug", s)
      .neq("id", id)
      .maybeSingle();
    if (existing) return { error: "Slug already in use" };
    updates.slug = s;
  }

  const { error } = await admin
    .from("compare_pages")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  await logAudit(admin, user.id, "update_compare_page", "compare_pages", id, { updates: Object.keys(updates) });
  revalidatePath("/admin/model-pages/compare");
  revalidatePath("/models/compare");
  return {};
}

export async function getModelPagesForSelect(): Promise<{ id: string; slug: string; label: string }[]> {
  const pages = await listModelPages();
  return pages.map((p) => ({
    id: p.id,
    slug: p.slug,
    label: `${p.definition_name} (${p.provider_name ?? "—"})`,
  }));
}

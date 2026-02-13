"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function ensureAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      error: "Not authenticated",
      supabase: null as unknown as Awaited<ReturnType<typeof createClient>>,
    };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      error: "Forbidden: admin access required",
      supabase: null as unknown as Awaited<ReturnType<typeof createClient>>,
    };
  }
  return { error: null, supabase };
}

async function logAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  adminId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    details: (details ?? null) as import("@/types/database").Json | null,
  });
}

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length > 0;
}

export async function createProvider(
  name: string,
  slug: string,
  baseUrl?: string
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await ensureAdmin();
  if (authError || !supabase) return { error: authError ?? "Not authenticated" };

  const trimmedName = name?.trim();
  const trimmedSlug = (slug ?? slugFromName(trimmedName ?? "")).trim().toLowerCase();

  if (!trimmedName) return { error: "Provider name is required" };
  if (!trimmedSlug) return { error: "Slug is required" };
  if (!isValidSlug(trimmedSlug)) {
    return {
      error: "Slug must be URL-safe (lowercase alphanumeric and hyphens only)",
    };
  }

  const { data: existingName } = await supabase
    .from("providers")
    .select("id")
    .eq("name", trimmedName)
    .single();
  if (existingName) return { error: "Provider name already exists" };

  const { data: existingSlug } = await supabase
    .from("providers")
    .select("id")
    .eq("slug", trimmedSlug)
    .single();
  if (existingSlug) return { error: "Slug already exists" };

  const { data: inserted, error } = await supabase
    .from("providers")
    .insert({
      name: trimmedName,
      slug: trimmedSlug,
      base_url: baseUrl?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await logAudit(supabase, user.id, "create_provider", "providers", inserted?.id, {
      name: trimmedName,
      slug: trimmedSlug,
      base_url: baseUrl?.trim() || null,
    });

  revalidatePath("/admin/providers");
  revalidatePath("/admin");
  return {};
}

export async function updateProvider(
  id: string,
  name: string,
  slug: string,
  baseUrl?: string
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await ensureAdmin();
  if (authError || !supabase) return { error: authError ?? "Not authenticated" };

  const trimmedName = name?.trim();
  const trimmedSlug = slug?.trim().toLowerCase();

  if (!trimmedName) return { error: "Provider name is required" };
  if (!trimmedSlug) return { error: "Slug is required" };
  if (!isValidSlug(trimmedSlug)) {
    return {
      error: "Slug must be URL-safe (lowercase alphanumeric and hyphens only)",
    };
  }

  const { data: existingName } = await supabase
    .from("providers")
    .select("id")
    .eq("name", trimmedName)
    .neq("id", id)
    .single();
  if (existingName) return { error: "Provider name already exists" };

  const { data: existingSlug } = await supabase
    .from("providers")
    .select("id")
    .eq("slug", trimmedSlug)
    .neq("id", id)
    .single();
  if (existingSlug) return { error: "Slug already exists" };

  const { error } = await supabase
    .from("providers")
    .update({
      name: trimmedName,
      slug: trimmedSlug,
      base_url: baseUrl?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await logAudit(supabase, user.id, "update_provider", "providers", id, {
      name: trimmedName,
      slug: trimmedSlug,
      base_url: baseUrl?.trim() || null,
    });

  revalidatePath("/admin/providers");
  revalidatePath(`/admin/providers/${id}`);
  revalidatePath("/admin");
  return {};
}

export async function toggleProviderActive(id: string): Promise<{ error?: string }> {
  const { error: authError, supabase } = await ensureAdmin();
  if (authError || !supabase) return { error: authError ?? "Not authenticated" };

  const { data: provider } = await supabase
    .from("providers")
    .select("is_active")
    .eq("id", id)
    .single();
  if (!provider) return { error: "Provider not found" };

  const newActive = !provider.is_active;
  const { error } = await supabase
    .from("providers")
    .update({ is_active: newActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await logAudit(supabase, user.id, "toggle_provider_active", "providers", id, {
      is_active: newActive,
    });

  revalidatePath("/admin/providers");
  revalidatePath(`/admin/providers/${id}`);
  revalidatePath("/admin");
  return {};
}

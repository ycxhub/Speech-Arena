"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

type AdminClient = ReturnType<typeof getAdminClient>;

async function ensureAdmin(): Promise<
  { error: string; admin: null; userId: null } | { error: null; admin: AdminClient; userId: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", admin: null, userId: null };

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Forbidden: admin access required", admin: null, userId: null };
  }
  return { error: null, admin, userId: user.id };
}

async function logAudit(
  admin: AdminClient,
  adminId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  await admin.from("admin_audit_log").insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    details: (details ?? null) as import("@/types/database").Json | null,
  });
}

export async function createLanguage(
  name: string,
  code: string
): Promise<{ error?: string }> {
  const { error: authError, admin, userId } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };

  const trimmedName = name?.trim();
  const trimmedCode = code?.trim();

  if (!trimmedName) return { error: "Language name is required" };
  if (!trimmedCode) return { error: "Language code is required" };
  if (trimmedCode.length < 2 || trimmedCode.length > 20) {
    return { error: "Language code must be 2–20 characters" };
  }

  const { data: existing } = await admin
    .from("languages")
    .select("id")
    .eq("code", trimmedCode)
    .single();
  if (existing) return { error: "Language code already exists" };

  const { data: inserted, error } = await admin
    .from("languages")
    .insert({ name: trimmedName, code: trimmedCode })
    .select("id")
    .single();

  if (error) return { error: error.message };

  void logAudit(admin, userId, "create_language", "languages", inserted?.id, {
    name: trimmedName,
    code: trimmedCode,
  }).catch(() => {});

  revalidatePath("/admin/languages");
  return {};
}

export async function updateLanguage(
  id: string,
  name: string,
  code: string
): Promise<{ error?: string }> {
  const { error: authError, admin, userId } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };

  const trimmedName = name?.trim();
  const trimmedCode = code?.trim();

  if (!trimmedName) return { error: "Language name is required" };
  if (!trimmedCode) return { error: "Language code is required" };
  if (trimmedCode.length < 2 || trimmedCode.length > 20) {
    return { error: "Language code must be 2–20 characters" };
  }

  const { data: existing } = await admin
    .from("languages")
    .select("id")
    .eq("code", trimmedCode)
    .neq("id", id)
    .single();
  if (existing) return { error: "Language code already exists" };

  const { error } = await admin
    .from("languages")
    .update({ name: trimmedName, code: trimmedCode, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  void logAudit(admin, userId, "update_language", "languages", id, {
    name: trimmedName,
    code: trimmedCode,
  }).catch(() => {});

  revalidatePath("/admin/languages");
  return {};
}

export async function toggleLanguageActive(id: string): Promise<{ error?: string }> {
  const { error: authError, admin, userId } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };

  const { data: lang } = await admin
    .from("languages")
    .select("is_active")
    .eq("id", id)
    .single();
  if (!lang) return { error: "Language not found" };

  const newActive = !lang.is_active;
  const { error } = await admin
    .from("languages")
    .update({ is_active: newActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  void logAudit(admin, userId, "toggle_language_active", "languages", id, {
    is_active: newActive,
  }).catch(() => {});

  revalidatePath("/admin/languages");
  return {};
}

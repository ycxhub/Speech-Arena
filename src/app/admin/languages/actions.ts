"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function ensureAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", supabase: null as unknown as Awaited<ReturnType<typeof createClient>> };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Forbidden: admin access required", supabase: null as unknown as Awaited<ReturnType<typeof createClient>> };
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

export async function createLanguage(
  name: string,
  code: string
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await ensureAdmin();
  if (authError || !supabase) return { error: authError ?? "Not authenticated" };

  const trimmedName = name?.trim();
  const trimmedCode = code?.trim().toLowerCase();

  if (!trimmedName) return { error: "Language name is required" };
  if (!trimmedCode) return { error: "Language code is required" };
  if (trimmedCode.length < 2 || trimmedCode.length > 5) {
    return { error: "Language code must be 2–5 characters" };
  }
  if (!/^[a-z0-9]+$/.test(trimmedCode)) {
    return { error: "Language code must be alphanumeric" };
  }

  const { data: existing } = await supabase
    .from("languages")
    .select("id")
    .eq("code", trimmedCode)
    .single();
  if (existing) return { error: "Language code already exists" };

  const { data: inserted, error } = await supabase
    .from("languages")
    .insert({ name: trimmedName, code: trimmedCode })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await logAudit(supabase, user.id, "create_language", "languages", inserted?.id, {
      name: trimmedName,
      code: trimmedCode,
    });

  revalidatePath("/admin/languages");
  return {};
}

export async function updateLanguage(
  id: string,
  name: string,
  code: string
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await ensureAdmin();
  if (authError || !supabase) return { error: authError ?? "Not authenticated" };

  const trimmedName = name?.trim();
  const trimmedCode = code?.trim().toLowerCase();

  if (!trimmedName) return { error: "Language name is required" };
  if (!trimmedCode) return { error: "Language code is required" };
  if (trimmedCode.length < 2 || trimmedCode.length > 5) {
    return { error: "Language code must be 2–5 characters" };
  }
  if (!/^[a-z0-9]+$/.test(trimmedCode)) {
    return { error: "Language code must be alphanumeric" };
  }

  const { data: existing } = await supabase
    .from("languages")
    .select("id")
    .eq("code", trimmedCode)
    .neq("id", id)
    .single();
  if (existing) return { error: "Language code already exists" };

  const { error } = await supabase
    .from("languages")
    .update({ name: trimmedName, code: trimmedCode, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await logAudit(supabase, user.id, "update_language", "languages", id, {
      name: trimmedName,
      code: trimmedCode,
    });

  revalidatePath("/admin/languages");
  return {};
}

export async function toggleLanguageActive(id: string): Promise<{ error?: string }> {
  const { error: authError, supabase } = await ensureAdmin();
  if (authError || !supabase) return { error: authError ?? "Not authenticated" };

  const { data: lang } = await supabase
    .from("languages")
    .select("is_active")
    .eq("id", id)
    .single();
  if (!lang) return { error: "Language not found" };

  const newActive = !lang.is_active;
  const { error } = await supabase
    .from("languages")
    .update({ is_active: newActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await logAudit(supabase, user.id, "toggle_language_active", "languages", id, {
      is_active: newActive,
    });

  revalidatePath("/admin/languages");
  return {};
}

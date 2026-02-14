"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
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

  // Use admin client to bypass RLS infinite recursion on profiles table
  const { data: profile } = await getAdminClient()
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

export async function createSentence(
  languageId: string,
  text: string
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await ensureAdmin();
  if (authError || !supabase) return { error: authError ?? "Not authenticated" };

  const trimmed = text?.trim();
  if (!trimmed) return { error: "Sentence text is required" };
  if (trimmed.length > 500) return { error: "Sentence must be 500 characters or less" };

  const { data: inserted, error } = await supabase
    .from("sentences")
    .insert({ language_id: languageId, text: trimmed, version: 1 })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await logAudit(supabase, user.id, "create_sentence", "sentences", inserted?.id, {
      language_id: languageId,
      text_preview: trimmed.slice(0, 50),
    });

  await supabase.from("sentence_versions").insert({
    sentence_id: inserted!.id,
    text: trimmed,
    version: 1,
    created_by: user?.id ?? null,
  });

  revalidatePath("/admin/sentences");
  return {};
}

export async function updateSentence(
  id: string,
  text: string
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await ensureAdmin();
  if (authError || !supabase) return { error: authError ?? "Not authenticated" };

  const trimmed = text?.trim();
  if (!trimmed) return { error: "Sentence text is required" };
  if (trimmed.length > 500) return { error: "Sentence must be 500 characters or less" };

  const { data: current } = await supabase
    .from("sentences")
    .select("version")
    .eq("id", id)
    .single();
  if (!current) return { error: "Sentence not found" };

  const newVersion = current.version + 1;

  const { error } = await supabase
    .from("sentences")
    .update({
      text: trimmed,
      version: newVersion,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await logAudit(supabase, user.id, "update_sentence", "sentences", id, {
      version: newVersion,
      text_preview: trimmed.slice(0, 50),
    });

  await supabase.from("sentence_versions").insert({
    sentence_id: id,
    text: trimmed,
    version: newVersion,
    created_by: user?.id ?? null,
  });

  revalidatePath("/admin/sentences");
  return {};
}

export async function toggleSentenceActive(
  id: string
): Promise<{ error?: string }> {
  const { error: authError, supabase } = await ensureAdmin();
  if (authError || !supabase) return { error: authError ?? "Not authenticated" };

  const { data: sent } = await supabase
    .from("sentences")
    .select("is_active")
    .eq("id", id)
    .single();
  if (!sent) return { error: "Sentence not found" };

  const newActive = !sent.is_active;
  const { error } = await supabase
    .from("sentences")
    .update({
      is_active: newActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await logAudit(supabase, user.id, "toggle_sentence_active", "sentences", id, {
      is_active: newActive,
    });

  revalidatePath("/admin/sentences");
  return {};
}

export type BulkImportResult = {
  inserted: number;
  skipped: number;
  errors: string[];
};

export async function bulkImportSentences(
  rows: { language_code: string; text: string }[]
): Promise<BulkImportResult & { error?: string }> {
  const { error: authError, supabase } = await ensureAdmin();
  if (authError || !supabase)
    return { inserted: 0, skipped: 0, errors: [], error: authError ?? "Not authenticated" };

  const { data: languages } = await supabase
    .from("languages")
    .select("id, code")
    .eq("is_active", true);
  const codeToId = new Map((languages ?? []).map((l) => [l.code.toLowerCase(), l.id]));

  const errors: string[] = [];
  const toInsert: { language_id: string; text: string }[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const { language_code, text } = rows[i];
    const code = language_code?.trim().toLowerCase();
    const trimmed = text?.trim();

    if (!code) {
      errors.push(`Row ${i + 1}: language_code is required`);
      continue;
    }
    if (!trimmed) {
      errors.push(`Row ${i + 1}: text is required`);
      continue;
    }
    if (trimmed.length > 500) {
      errors.push(`Row ${i + 1}: text exceeds 500 characters`);
      continue;
    }

    const languageId = codeToId.get(code);
    if (!languageId) {
      errors.push(`Row ${i + 1}: unknown language code "${code}"`);
      continue;
    }

    const key = `${languageId}:${trimmed}`;
    if (seen.has(key)) {
      errors.push(`Row ${i + 1}: duplicate (same language + text)`);
      continue;
    }
    seen.add(key);
    toInsert.push({ language_id: languageId, text: trimmed });
  }

  if (toInsert.length === 0) {
    return { inserted: 0, skipped: rows.length, errors };
  }

  const { data: inserted, error } = await supabase
    .from("sentences")
    .insert(
      toInsert.map((r) => ({ language_id: r.language_id, text: r.text, version: 1 }))
    )
    .select("id");

  if (error) {
    return {
      inserted: 0,
      skipped: rows.length,
      errors: [...errors, error.message],
      error: error.message,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await logAudit(supabase, user.id, "bulk_import_sentences", "sentences", undefined, {
      inserted: inserted?.length ?? 0,
      skipped: rows.length - (inserted?.length ?? 0),
      total_rows: rows.length,
    });

  const insertedIds = inserted ?? [];
  for (let i = 0; i < insertedIds.length && i < toInsert.length; i++) {
    await supabase.from("sentence_versions").insert({
      sentence_id: insertedIds[i].id,
      text: toInsert[i].text,
      version: 1,
      created_by: user?.id ?? null,
    });
  }

  revalidatePath("/admin/sentences");
  return {
    inserted: insertedIds.length,
    skipped: rows.length - insertedIds.length,
    errors,
  };
}

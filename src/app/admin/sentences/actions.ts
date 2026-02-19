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
  if (!user)
    return {
      error: "Not authenticated",
      admin: null,
      userId: null,
    };

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      error: "Forbidden: admin access required",
      admin: null,
      userId: null,
    };
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

export async function createSentence(
  languageId: string,
  text: string
): Promise<{ error?: string }> {
  const { error: authError, admin, userId } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };

  const trimmed = text?.trim();
  if (!trimmed) return { error: "Sentence text is required" };
  if (trimmed.length > 500) return { error: "Sentence must be 500 characters or less" };

  const { data: inserted, error } = await admin
    .from("sentences")
    .insert({ language_id: languageId, text: trimmed, version: 1 })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit(admin, userId, "create_sentence", "sentences", inserted?.id, {
    language_id: languageId,
    text_preview: trimmed.slice(0, 50),
  });

  await admin.from("sentence_versions").insert({
    sentence_id: inserted!.id,
    text: trimmed,
    version: 1,
    created_by: userId,
  });

  revalidatePath("/admin/sentences");
  return {};
}

export async function updateSentence(
  id: string,
  text: string
): Promise<{ error?: string }> {
  const { error: authError, admin, userId } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };

  const trimmed = text?.trim();
  if (!trimmed) return { error: "Sentence text is required" };
  if (trimmed.length > 500) return { error: "Sentence must be 500 characters or less" };

  const { data: current } = await admin
    .from("sentences")
    .select("version")
    .eq("id", id)
    .single();
  if (!current) return { error: "Sentence not found" };

  const newVersion = current.version + 1;

  const { error } = await admin
    .from("sentences")
    .update({
      text: trimmed,
      version: newVersion,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit(admin, userId, "update_sentence", "sentences", id, {
    version: newVersion,
    text_preview: trimmed.slice(0, 50),
  });

  await admin.from("sentence_versions").insert({
    sentence_id: id,
    text: trimmed,
    version: newVersion,
    created_by: userId,
  });

  revalidatePath("/admin/sentences");
  return {};
}

export async function toggleSentenceActive(
  id: string
): Promise<{ error?: string }> {
  const { error: authError, admin, userId } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };

  const { data: sent } = await admin
    .from("sentences")
    .select("is_active")
    .eq("id", id)
    .single();
  if (!sent) return { error: "Sentence not found" };

  const newActive = !sent.is_active;
  const { error } = await admin
    .from("sentences")
    .update({
      is_active: newActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit(admin, userId, "toggle_sentence_active", "sentences", id, {
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
  const { error: authError, admin, userId } = await ensureAdmin();
  if (authError || !admin)
    return { inserted: 0, skipped: 0, errors: [], error: authError ?? "Not authenticated" };

  const { data: languages } = await admin
    .from("languages")
    .select("id, code")
    .eq("is_active", true);
  const codeToId = new Map((languages ?? []).map((l) => [l.code.toLowerCase(), l.id]));

  // Map "en" to first en-* variant (en-IN, en-US, en-UK) so CSV with "en" works
  const enVariants = ["en-in", "en-us", "en-uk"];
  for (const ev of enVariants) {
    const id = codeToId.get(ev);
    if (id) {
      codeToId.set("en", id);
      break;
    }
  }

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

  const { data: inserted, error } = await admin
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

  await logAudit(admin, userId, "bulk_import_sentences", "sentences", undefined, {
    inserted: inserted?.length ?? 0,
    skipped: rows.length - (inserted?.length ?? 0),
    total_rows: rows.length,
  });

  const insertedIds = inserted ?? [];
  for (let i = 0; i < insertedIds.length && i < toInsert.length; i++) {
    await admin.from("sentence_versions").insert({
      sentence_id: insertedIds[i].id,
      text: toInsert[i].text,
      version: 1,
      created_by: userId,
    });
  }

  revalidatePath("/admin/sentences");
  return {
    inserted: insertedIds.length,
    skipped: rows.length - insertedIds.length,
    errors,
  };
}

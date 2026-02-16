"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
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
    return { error: "Not authenticated", admin: null, userId: null };

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
  details?: Record<string, unknown>
) {
  await admin.from("admin_audit_log").insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: null,
    details: details ? JSON.parse(JSON.stringify(details)) : null,
  });
}

export async function updateProviderLanguages(
  providerId: string,
  languageIds: string[]
): Promise<{ error?: string }> {
  const { error: authError, admin, userId } = await ensureAdmin();
  if (authError || !admin) return { error: authError ?? "Not authenticated" };

  await admin.from("provider_languages").delete().eq("provider_id", providerId);

  if (languageIds.length > 0) {
    const { error } = await admin.from("provider_languages").insert(
      languageIds.map((language_id) => ({ provider_id: providerId, language_id }))
    );
    if (error) return { error: error.message };
  }

  await logAudit(admin, userId, "update_provider_languages", "provider_languages", {
    provider_id: providerId,
    language_ids: languageIds,
  });

  revalidatePath(`/admin/providers/${providerId}/languages`);
  revalidatePath(`/admin/providers/${providerId}/models`);
  revalidatePath("/admin/providers");
  return {};
}

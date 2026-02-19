import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuditLogClient } from "./page-client";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const admin = getAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/blind-test");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = 50;
  const from = (page - 1) * pageSize;

  let query = admin
    .from("admin_audit_log")
    .select(
      `
      id, admin_id, created_at, action, entity_type, entity_id, details,
      admin:profiles!admin_id(email)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (params.admin?.trim()) {
    const { data: admins } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", `%${params.admin.trim()}%`);
    const ids = (admins ?? []).map((a) => a.id);
    if (ids.length > 0) {
      query = query.in("admin_id", ids);
    } else {
      query = query.eq("admin_id", "00000000-0000-0000-0000-000000000000");
    }
  }
  if (params.action) query = query.eq("action", params.action);
  if (params.entity_type) query = query.eq("entity_type", params.entity_type);
  if (params.from) query = query.gte("created_at", params.from);
  if (params.to) query = query.lte("created_at", params.to + "T23:59:59.999Z");

  const { data, error, count } = await query.range(from, from + pageSize - 1);

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-page-title">Audit Log</h1>
        <p className="text-accent-red">Failed to load audit log.</p>
      </div>
    );
  }

  const rows = (data ?? []).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    adminEmail: (r.admin as { email?: string })?.email ?? "—",
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id ?? "",
    details: r.details ? JSON.stringify(r.details) : "",
  }));

  const actions = [
    "create_sentence", "update_sentence", "toggle_sentence_active", "bulk_import_sentences",
    "create_voice", "update_voice", "delete_voice", "bulk_create_voices_csv",
    "create_model_definition", "update_model_definition", "delete_model_definition",
    "create_model", "update_model", "toggle_model_active", "bulk_update_model_status", "delete_model",
    "create_language", "update_language", "toggle_language_active",
    "update_provider_languages", "add_api_key", "update_key_status",
    "create_provider", "update_provider", "toggle_provider_active", "abuse_flag",
    "update_user_role", "autogenerate_models", "export_test_logs_csv",
  ];
  const entityTypes = [
    "sentences", "provider_voices", "provider_model_definitions", "models",
    "languages", "provider_languages", "api_keys", "providers", "user",
    "profiles", "test_events",
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-page-title">Audit Log</h1>

      <AuditLogClient
        rows={rows}
        total={count ?? 0}
        page={page}
        pageSize={pageSize}
        actions={actions}
        entityTypes={entityTypes}
      />
    </div>
  );
}


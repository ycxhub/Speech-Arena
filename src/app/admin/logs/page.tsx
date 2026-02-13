import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogsClient } from "./page-client";
import { getTestLogs } from "./actions";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/blind-test");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const filters = {
    userQuery: params.user ?? undefined,
    providerId: params.provider ?? undefined,
    modelId: params.model ?? undefined,
    languageId: params.language ?? undefined,
    sentenceId: params.sentence_id ?? undefined,
    status: params.status ?? undefined,
    winnerId: params.winner ?? undefined,
    loserId: params.loser ?? undefined,
    fromDate: params.from ?? undefined,
    toDate: params.to ?? undefined,
    suspicious: params.suspicious === "1",
  };

  const { rows, total } = await getTestLogs(page, null, filters);

  const admin = getAdminClient();
  const { data: providers } = await admin.from("providers").select("id, name").eq("is_active", true);
  const { data: languages } = await admin.from("languages").select("id, name").eq("is_active", true);
  const { data: models } = await admin.from("models").select("id, name, provider_id").eq("is_active", true);

  return (
    <div className="space-y-8">
      <h1 className="text-page-title">Test Logs</h1>
      <Link href="/admin" className="text-sm text-accent-blue hover:text-accent-blue/80">
        ← Back to Admin
      </Link>
      <LogsClient
        initialRows={rows}
        total={total}
        page={page}
        providers={providers ?? []}
        languages={languages ?? []}
        models={models ?? []}
      />
    </div>
  );
}

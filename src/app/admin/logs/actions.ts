"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getSignedUrl } from "@/lib/r2/storage";
import { createHash } from "crypto";

const PAGE_SIZE = 50;
const MAX_EXPORT_ROWS = 100_000;
const SIGNED_URL_EXPIRY = 300;

export type LogRow = {
  id: string;
  votedAt: string;
  userEmail: string;
  languageName: string;
  sentenceText: string;
  modelAName: string;
  modelAProvider: string;
  modelBName: string;
  modelBProvider: string;
  winnerName: string;
  loserName: string;
  status: string;
  audioAId: string;
  audioBId: string;
  listenTimeAMs: number | null;
  listenTimeBMs: number | null;
  eloBeforeWinner: number | null;
  eloAfterWinner: number | null;
  eloBeforeLoser: number | null;
  eloAfterLoser: number | null;
  generationLatencyAMs: number | null;
  generationLatencyBMs: number | null;
};

export type LogFilters = {
  userQuery?: string;
  providerId?: string;
  modelId?: string;
  languageId?: string;
  sentenceId?: string;
  status?: string;
  winnerId?: string;
  loserId?: string;
  fromDate?: string;
  toDate?: string;
  suspicious?: boolean;
};

function anonymizeUserId(userId: string): string {
  const salt = process.env.ANONYMIZATION_SALT ?? "default-salt";
  const hash = createHash("sha256").update(userId + salt).digest("hex");
  return `user_${hash.slice(0, 8)}`;
}

export async function getTestLogs(
  page: number,
  _cursor: string | null,
  filters?: LogFilters
): Promise<{ rows: LogRow[]; nextCursor: string | null; total: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/blind-test");

  const admin = getAdminClient();

  let query = admin
    .from("test_events")
    .select(
      `
      id, voted_at, created_at, status, listen_time_a_ms, listen_time_b_ms,
      elo_before_winner, elo_after_winner, elo_before_loser, elo_after_loser,
      user_id, language_id, sentence_id, model_a_id, model_b_id, winner_id, loser_id,
      audio_a_id, audio_b_id,
      sentence:sentences(text),
      model_a:models!model_a_id(name, provider:providers(name)),
      model_b:models!model_b_id(name, provider:providers(name)),
      winner:models!winner_id(name, provider:providers(name)),
      loser:models!loser_id(name, provider:providers(name))
    `,
      { count: "exact" }
    )
    .order("voted_at", { ascending: false })
    .order("id", { ascending: false });

  if (filters?.userQuery) {
    const { data: users } = await admin
      .from("profiles")
      .select("id")
      .or(`email.ilike.%${filters.userQuery}%,id.ilike.%${filters.userQuery}%`);
    const ids = (users ?? []).map((u) => u.id);
    if (ids.length > 0) query = query.in("user_id", ids);
    else query = query.eq("user_id", "none");
  }
  if (filters?.providerId) {
    const { data: models } = await admin.from("models").select("id").eq("provider_id", filters.providerId);
    const modelIds = (models ?? []).map((m) => m.id);
    if (modelIds.length > 0) {
      query = query.or(`model_a_id.in.(${modelIds.join(",")}),model_b_id.in.(${modelIds.join(",")})`);
    }
  }
  if (filters?.modelId) {
    query = query.or(`model_a_id.eq.${filters.modelId},model_b_id.eq.${filters.modelId}`);
  }
  if (filters?.languageId) query = query.eq("language_id", filters.languageId);
  if (filters?.sentenceId) query = query.eq("sentence_id", filters.sentenceId);
  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters?.winnerId) query = query.eq("winner_id", filters.winnerId);
  if (filters?.loserId) query = query.eq("loser_id", filters.loserId);
  if (filters?.fromDate) query = query.gte("voted_at", filters.fromDate);
  if (filters?.toDate) query = query.lte("voted_at", filters.toDate + "T23:59:59.999Z");
  if (filters?.suspicious) {
    query = query.or("listen_time_a_ms.lt.3000,listen_time_b_ms.lt.3000");
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);

  if (error) return { rows: [], nextCursor: null, total: 0 };

  const { data: languages } = await admin.from("languages").select("id, name");
  const langMap = new Map((languages ?? []).map((l) => [l.id, l.name]));
  const { data: profiles } = await admin.from("profiles").select("id, email");
  const emailMap = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  const rows: LogRow[] = (data ?? []).map((e) => {
    const row = e as {
      voted_at: string | null;
      created_at: string;
      user_id: string;
      language_id: string;
      sentence: { text?: string } | null;
      model_a: { name?: string; provider?: { name?: string } } | null;
      model_b: { name?: string; provider?: { name?: string } } | null;
      winner: { name?: string; provider?: { name?: string } } | null;
      loser: { name?: string; provider?: { name?: string } } | null;
    };
    return {
      id: (e as { id: string }).id,
      votedAt: row.voted_at ?? row.created_at,
      userEmail: emailMap.get(row.user_id) ?? row.user_id.slice(0, 8),
      languageName: langMap.get(row.language_id) ?? "Unknown",
      sentenceText: (row.sentence as { text?: string })?.text ?? "",
      modelAName: row.model_a?.name ?? "Unknown",
      modelAProvider: (row.model_a?.provider as { name?: string })?.name ?? "",
      modelBName: row.model_b?.name ?? "Unknown",
      modelBProvider: (row.model_b?.provider as { name?: string })?.name ?? "",
      winnerName: row.winner?.name ?? "Unknown",
      loserName: row.loser?.name ?? "Unknown",
      status: (e as { status: string }).status,
      audioAId: (e as { audio_a_id: string }).audio_a_id,
      audioBId: (e as { audio_b_id: string }).audio_b_id,
      listenTimeAMs: (e as { listen_time_a_ms: number | null }).listen_time_a_ms,
      listenTimeBMs: (e as { listen_time_b_ms: number | null }).listen_time_b_ms,
      eloBeforeWinner: (e as { elo_before_winner: number | null }).elo_before_winner,
      eloAfterWinner: (e as { elo_after_winner: number | null }).elo_after_winner,
      eloBeforeLoser: (e as { elo_before_loser: number | null }).elo_before_loser,
      eloAfterLoser: (e as { elo_after_loser: number | null }).elo_after_loser,
      generationLatencyAMs: null as number | null,
      generationLatencyBMs: null as number | null,
    };
  });

  const hasMore = (count ?? 0) > from + PAGE_SIZE;
  const nextCursor = hasMore && rows.length > 0 ? `${rows[rows.length - 1]!.votedAt}_${rows[rows.length - 1]!.id}` : null;

  return { rows, nextCursor, total: count ?? 0 };
}

export async function getSignedLogAudioUrl(audioFileId: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Unauthorized" };

  const admin = getAdminClient();
  const { data: audioFile, error } = await admin
    .from("audio_files")
    .select("r2_key")
    .eq("id", audioFileId)
    .single();

  if (error || !audioFile) return { error: "Audio not found" };

  try {
    const url = await getSignedUrl(audioFile.r2_key, SIGNED_URL_EXPIRY);
    return { url };
  } catch {
    return { error: "Failed to generate URL" };
  }
}

export async function exportLogsCsv(
  filters?: LogFilters,
  anonymize = true
): Promise<{ csv?: string; filename?: string; error?: string; warning?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Unauthorized" };

  const admin = getAdminClient();

  let query = admin
    .from("test_events")
    .select(
      `
      id, voted_at, user_id, status, listen_time_a_ms, listen_time_b_ms,
      elo_before_winner, elo_after_winner, elo_before_loser, elo_after_loser,
      sentence:sentences(text),
      model_a:models!model_a_id(name, provider:providers(name)),
      model_b:models!model_b_id(name, provider:providers(name)),
      winner:models!winner_id(name, provider:providers(name)),
      loser:models!loser_id(name, provider:providers(name))
    `
    )
    .order("voted_at", { ascending: false });

  if (filters?.userQuery) {
    const { data: users } = await admin
      .from("profiles")
      .select("id")
      .or(`email.ilike.%${filters.userQuery}%,id.ilike.%${filters.userQuery}%`);
    const ids = (users ?? []).map((u) => u.id);
    if (ids.length > 0) query = query.in("user_id", ids);
    else query = query.eq("user_id", "none");
  }
  if (filters?.providerId) {
    const { data: models } = await admin.from("models").select("id").eq("provider_id", filters.providerId);
    const modelIds = (models ?? []).map((m) => m.id);
    if (modelIds.length > 0) {
      query = query.or(`model_a_id.in.(${modelIds.join(",")}),model_b_id.in.(${modelIds.join(",")})`);
    }
  }
  if (filters?.modelId) {
    query = query.or(`model_a_id.eq.${filters.modelId},model_b_id.eq.${filters.modelId}`);
  }
  if (filters?.languageId) query = query.eq("language_id", filters.languageId);
  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters?.fromDate) query = query.gte("voted_at", filters.fromDate);
  if (filters?.toDate) query = query.lte("voted_at", filters.toDate + "T23:59:59.999Z");
  if (filters?.suspicious) {
    query = query.or("listen_time_a_ms.lt.3000,listen_time_b_ms.lt.3000");
  }

  const { data, error } = await query.limit(MAX_EXPORT_ROWS + 1);

  if (error) return { error: "Failed to export" };

  const rows = data ?? [];
  const exceeded = rows.length > MAX_EXPORT_ROWS;
  const exportRows = rows.slice(0, MAX_EXPORT_ROWS);

  const { data: profiles } = await admin.from("profiles").select("id, email");
  const emailMap = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  const header =
    "test_event_id,timestamp,user_id,language,sentence_text,model_a_name,model_a_provider,model_b_name,model_b_provider,winner_name,loser_name,listen_time_a_ms,listen_time_b_ms,elo_before_winner,elo_after_winner,elo_before_loser,elo_after_loser,status,generation_latency_a_ms,generation_latency_b_ms";

  const csvRows = exportRows.map((e) => {
    const r = e as {
      id: string;
      voted_at: string | null;
      user_id: string;
      sentence: { text?: string } | null;
      model_a: { name?: string; provider?: { name?: string } } | null;
      model_b: { name?: string; provider?: { name?: string } } | null;
      winner: { name?: string; provider?: { name?: string } } | null;
      loser: { name?: string; provider?: { name?: string } } | null;
    };
    const userId = anonymize ? anonymizeUserId(r.user_id) : (emailMap.get(r.user_id) ?? r.user_id);
    const text = ((r.sentence as { text?: string })?.text ?? "").replace(/"/g, '""');
    const modelAName = (r.model_a?.name ?? "").replace(/"/g, '""');
    const modelAProv = ((r.model_a?.provider as { name?: string })?.name ?? "").replace(/"/g, '""');
    const modelBName = (r.model_b?.name ?? "").replace(/"/g, '""');
    const modelBProv = ((r.model_b?.provider as { name?: string })?.name ?? "").replace(/"/g, '""');
    const winnerName = (r.winner?.name ?? "").replace(/"/g, '""');
    const loserName = (r.loser?.name ?? "").replace(/"/g, '""');
    const ts = r.voted_at ? new Date(r.voted_at).toISOString() : "";
    const latA = "";
    const latB = "";
    return `"${r.id}","${ts}","${userId}","","${text}","${modelAName}","${modelAProv}","${modelBName}","${modelBProv}","${winnerName}","${loserName}",${(e as { listen_time_a_ms: number | null }).listen_time_a_ms ?? ""},${(e as { listen_time_b_ms: number | null }).listen_time_b_ms ?? ""},${(e as { elo_before_winner: number | null }).elo_before_winner ?? ""},${(e as { elo_after_winner: number | null }).elo_after_winner ?? ""},${(e as { elo_before_loser: number | null }).elo_before_loser ?? ""},${(e as { elo_after_loser: number | null }).elo_after_loser ?? ""},"${(e as { status: string }).status}",${latA},${latB}`;
  });

  const csv = [header, ...csvRows].join("\n");
  const filename = `test-logs-${new Date().toISOString().slice(0, 10)}.csv`;

  return {
    csv,
    filename,
    warning: exceeded ? `Export limited to ${MAX_EXPORT_ROWS} rows. Narrow filters.` : undefined,
  };
}

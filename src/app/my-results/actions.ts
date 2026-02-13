"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { calculateEloUpdate } from "@/lib/elo/calculator";
import { getSignedUrl } from "@/lib/r2/storage";

const PAGE_SIZE = 20;
const MAX_EXPORT_ROWS = 10_000;
const SIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes

export type PersonalLeaderboardRow = {
  modelId: string;
  modelName: string;
  providerName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  userElo: number;
  confidence: "strong" | "moderate" | "low";
};

export type TestHistoryRow = {
  id: string;
  votedAt: string;
  languageName: string;
  sentenceText: string;
  winnerName: string;
  winnerProvider: string;
  loserName: string;
  loserProvider: string;
  audioAId: string;
  audioBId: string;
};

export type MyResultsFilters = {
  languageId?: string;
  providerId?: string;
  modelId?: string;
  fromDate?: string;
  toDate?: string;
};

export async function getCompletedTestCount(userId: string): Promise<number> {
  const admin = getAdminClient();
  const { count, error } = await admin
    .from("test_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  if (error) return 0;
  return count ?? 0;
}

export async function getPersonalLeaderboard(
  userId: string,
  filters?: MyResultsFilters
): Promise<PersonalLeaderboardRow[]> {
  const admin = getAdminClient();

  let query = admin
    .from("test_events")
    .select(
      `
      id, voted_at, model_a_id, model_b_id, winner_id, loser_id,
      model_a:models!model_a_id(name, provider:providers(name)),
      model_b:models!model_b_id(name, provider:providers(name)),
      winner:models!winner_id(id),
      loser:models!loser_id(id)
    `
    )
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("voted_at", { ascending: true });

  if (filters?.languageId) {
    query = query.eq("language_id", filters.languageId);
  }
  if (filters?.fromDate) {
    query = query.gte("voted_at", filters.fromDate);
  }
  if (filters?.toDate) {
    query = query.lte("voted_at", filters.toDate + "T23:59:59.999Z");
  }

  const { data: events, error } = await query;
  if (error || !events) return [];

  // Build model stats and replay ELO
  const modelStats: Record<
    string,
    {
      modelId: string;
      modelName: string;
      providerName: string;
      matchesPlayed: number;
      wins: number;
      losses: number;
      ratings: Record<string, number>; // modelId -> current rating
    }
  > = {};

  for (const e of events) {
    const modelA = e.model_a as { id?: string; name?: string; provider?: { name?: string } } | null;
    const modelB = e.model_b as { id?: string; name?: string; provider?: { name?: string } } | null;
    const winnerId = (e.winner as { id?: string } | null)?.id ?? e.winner_id;
    const loserId = (e.loser as { id?: string } | null)?.id ?? e.loser_id;

    if (!winnerId || !loserId) continue;

    const modelAId = e.model_a_id;
    const modelBId = e.model_b_id;

    if (!modelStats[modelAId]) {
      modelStats[modelAId] = {
        modelId: modelAId,
        modelName: modelA?.name ?? "Unknown",
        providerName: (modelA?.provider as { name?: string })?.name ?? "Unknown",
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        ratings: {},
      };
    }
    if (!modelStats[modelBId]) {
      modelStats[modelBId] = {
        modelId: modelBId,
        modelName: modelB?.name ?? "Unknown",
        providerName: (modelB?.provider as { name?: string })?.name ?? "Unknown",
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        ratings: {},
      };
    }

    const winnerStats = modelStats[winnerId];
    const loserStats = modelStats[loserId];
    winnerStats.matchesPlayed++;
    winnerStats.wins++;
    loserStats.matchesPlayed++;
    loserStats.losses++;

    const winnerRating = winnerStats.ratings[winnerId] ?? 1500;
    const loserRating = loserStats.ratings[loserId] ?? 1500;
    const winnerMatches = winnerStats.matchesPlayed - 1;
    const loserMatches = loserStats.matchesPlayed - 1;

    const result = calculateEloUpdate({
      winnerRating,
      loserRating,
      winnerMatchesPlayed: winnerMatches,
      loserMatchesPlayed: loserMatches,
    });

    winnerStats.ratings[winnerId] = result.winnerNewRating;
    loserStats.ratings[loserId] = result.loserNewRating;
  }

  // Apply provider/model filter
  let rows: PersonalLeaderboardRow[] = Object.values(modelStats).map((s) => {
    const winRate = s.matchesPlayed > 0 ? (s.wins / s.matchesPlayed) * 100 : 0;
    const userElo = s.ratings[s.modelId] ?? 1500;
    let confidence: "strong" | "moderate" | "low" = "low";
    if (s.matchesPlayed >= 30) confidence = "strong";
    else if (s.matchesPlayed >= 10) confidence = "moderate";

    return {
      modelId: s.modelId,
      modelName: s.modelName,
      providerName: s.providerName,
      matchesPlayed: s.matchesPlayed,
      wins: s.wins,
      losses: s.losses,
      winRate,
      userElo: Math.round(userElo),
      confidence,
    };
  });

  if (filters?.providerId) {
    const providerModels = await admin
      .from("models")
      .select("id")
      .eq("provider_id", filters.providerId);
    const providerModelIds = new Set((providerModels.data ?? []).map((m) => m.id));
    rows = rows.filter((r) => providerModelIds.has(r.modelId));
  }
  if (filters?.modelId) {
    rows = rows.filter((r) => r.modelId === filters.modelId);
  }

  rows.sort((a, b) => b.userElo - a.userElo);
  return rows;
}

export async function getTestHistory(
  userId: string,
  page: number,
  filters?: MyResultsFilters
): Promise<{ rows: TestHistoryRow[]; total: number }> {
  const admin = getAdminClient();

  let query = admin
    .from("test_events")
    .select(
      `
      id, voted_at, created_at, sentence_id, model_a_id, model_b_id, winner_id, loser_id, audio_a_id, audio_b_id,
      sentence:sentences(text, language:languages(name)),
      model_a:models!model_a_id(name, provider:providers(name)),
      model_b:models!model_b_id(name, provider:providers(name)),
      winner:models!winner_id(name, provider:providers(name)),
      loser:models!loser_id(name, provider:providers(name))
    `,
      { count: "exact" }
    )
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("voted_at", { ascending: false });

  if (filters?.languageId) query = query.eq("language_id", filters.languageId);
  if (filters?.providerId) {
    const providerModels = await admin.from("models").select("id").eq("provider_id", filters.providerId);
    const ids = (providerModels.data ?? []).map((m) => m.id);
    if (ids.length > 0) {
      query = query.or(`model_a_id.in.(${ids.join(",")}),model_b_id.in.(${ids.join(",")})`);
    }
  }
  if (filters?.modelId) {
    query = query.or(`model_a_id.eq.${filters.modelId},model_b_id.eq.${filters.modelId}`);
  }
  if (filters?.fromDate) query = query.gte("voted_at", filters.fromDate);
  if (filters?.toDate) query = query.lte("voted_at", filters.toDate + "T23:59:59.999Z");

  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);

  if (error) return { rows: [], total: 0 };

  const rows: TestHistoryRow[] = (data ?? []).map((e) => {
    const row = e as { voted_at: string | null; created_at: string };
    const sentence = e.sentence as { text?: string; language?: { name?: string } } | null;
    const winner = e.winner as { name?: string; provider?: { name?: string } } | null;
    const loser = e.loser as { name?: string; provider?: { name?: string } } | null;
    return {
      id: e.id,
      votedAt: row.voted_at ?? row.created_at,
      languageName: (sentence?.language as { name?: string })?.name ?? "Unknown",
      sentenceText: (sentence as { text?: string })?.text ?? "",
      winnerName: winner?.name ?? "Unknown",
      winnerProvider: (winner?.provider as { name?: string })?.name ?? "",
      loserName: loser?.name ?? "Unknown",
      loserProvider: (loser?.provider as { name?: string })?.name ?? "",
      audioAId: e.audio_a_id,
      audioBId: e.audio_b_id,
    };
  });

  return { rows, total: count ?? 0 };
}

export async function getSignedAudioUrl(audioFileId: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = getAdminClient();
  const { data: audioFile, error } = await admin
    .from("audio_files")
    .select("r2_key")
    .eq("id", audioFileId)
    .single();

  if (error || !audioFile) return { error: "Audio not found" };

  const { data: testEvents } = await admin
    .from("test_events")
    .select("id")
    .eq("user_id", user.id)
    .or(`audio_a_id.eq.${audioFileId},audio_b_id.eq.${audioFileId}`)
    .limit(1);

  if (!testEvents || testEvents.length === 0) return { error: "Unauthorized" };

  try {
    const url = await getSignedUrl(audioFile.r2_key, SIGNED_URL_EXPIRY_SECONDS);
    return { url };
  } catch {
    return { error: "Failed to generate URL" };
  }
}

export async function exportMyResultsCsv(
  filters?: MyResultsFilters
): Promise<{ csv?: string; filename?: string; error?: string; warning?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const userId = user.id;
  const admin = getAdminClient();

  let query = admin
    .from("test_events")
    .select(
      `
      voted_at, listen_time_a_ms, listen_time_b_ms,
      sentence:sentences(text, language:languages(name)),
      winner:models!winner_id(name, provider:providers(name)),
      loser:models!loser_id(name, provider:providers(name))
    `
    )
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("voted_at", { ascending: false });

  if (filters?.languageId) query = query.eq("language_id", filters.languageId);
  if (filters?.fromDate) query = query.gte("voted_at", filters.fromDate);
  if (filters?.toDate) query = query.lte("voted_at", filters.toDate + "T23:59:59.999Z");

  const { data, error } = await query.limit(MAX_EXPORT_ROWS + 1);

  if (error) return { error: "Failed to export" };

  const rows = data ?? [];
  const exceeded = rows.length > MAX_EXPORT_ROWS;
  const exportRows = rows.slice(0, MAX_EXPORT_ROWS);

  const header = "timestamp,language,sentence_text,winner_model,winner_provider,loser_model,loser_provider,listen_time_a_ms,listen_time_b_ms";
  const csvRows = exportRows.map((e) => {
    const sentence = e.sentence as { text?: string; language?: { name?: string } } | null;
    const winner = e.winner as { name?: string; provider?: { name?: string } } | null;
    const loser = e.loser as { name?: string; provider?: { name?: string } } | null;
    const timestamp = e.voted_at ? new Date(e.voted_at).toISOString() : "";
    const text = (sentence?.text ?? "").replace(/"/g, '""');
    const languageName = (sentence?.language as { name?: string })?.name ?? "";
    const winnerName = (winner?.name ?? "").replace(/"/g, '""');
    const winnerProvider = ((winner?.provider as { name?: string })?.name ?? "").replace(/"/g, '""');
    const loserName = (loser?.name ?? "").replace(/"/g, '""');
    const loserProvider = ((loser?.provider as { name?: string })?.name ?? "").replace(/"/g, '""');
    return `"${timestamp}","${languageName}","${text}","${winnerName}","${winnerProvider}","${loserName}","${loserProvider}",${e.listen_time_a_ms ?? ""},${e.listen_time_b_ms ?? ""}`;
  });

  const csv = [header, ...csvRows].join("\n");
  const filename = `my-results-${new Date().toISOString().slice(0, 10)}.csv`;

  return {
    csv,
    filename,
    warning: exceeded ? `Export limited to ${MAX_EXPORT_ROWS} rows. Narrow filters for more.` : undefined,
  };
}

export async function getFilterOptions(userId: string): Promise<{
  languages: { id: string; name: string }[];
  providers: { id: string; name: string }[];
  models: { id: string; name: string; providerId: string }[];
}> {
  const admin = getAdminClient();

  const { data: events } = await admin
    .from("test_events")
    .select("language_id, model_a_id, model_b_id")
    .eq("user_id", userId)
    .eq("status", "completed");

  const languageIds = new Set<string>();
  const modelIds = new Set<string>();

  for (const e of events ?? []) {
    languageIds.add(e.language_id);
    modelIds.add(e.model_a_id);
    modelIds.add(e.model_b_id);
  }

  const [langRes, modelRes] = await Promise.all([
    languageIds.size > 0
      ? admin.from("languages").select("id, name").in("id", Array.from(languageIds))
      : Promise.resolve({ data: [] }),
    modelIds.size > 0
      ? admin.from("models").select("id, name, provider_id").in("id", Array.from(modelIds))
      : Promise.resolve({ data: [] }),
  ]);

  const models = modelRes.data ?? [];
  const providerIds = new Set(models.map((m) => m.provider_id));
  const provRes =
    providerIds.size > 0
      ? await admin.from("providers").select("id, name").in("id", Array.from(providerIds))
      : { data: [] };

  return {
    languages: (langRes.data ?? []).map((l) => ({ id: l.id, name: l.name })),
    providers: (provRes.data ?? []).map((p) => ({ id: p.id, name: p.name })),
    models: models.map((m) => ({ id: m.id, name: m.name, providerId: m.provider_id })),
  };
}

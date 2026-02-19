"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { calculateEloUpdate } from "@/lib/elo/calculator";
import { getSignedUrl } from "@/lib/r2/storage";

const PAGE_SIZE = 20;
const MAX_EXPORT_ROWS = 10_000;
const SIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes

export type PersonalLeaderboardRow = {
  modelId: string; // composite: provider_id:definition_name for model-level
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
  winnerWinRate?: number; // For custom tests: winner's overall win rate
};

export type CustomTestWinRateSummary = {
  modelName: string;
  providerName: string;
  wins: number;
  losses: number;
  winRate: number;
}[];

export type MyResultsFilters = {
  languageId?: string;
  providerId?: string;
  modelId?: string;
  fromDate?: string;
  toDate?: string;
};

export type TestType = "blind" | "custom";

export async function getCompletedTestCount(
  userId: string,
  testType?: TestType
): Promise<number> {
  const admin = getAdminClient();
  let query = admin
    .from("test_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  if (testType === "blind") {
    query = query.eq("test_type", "blind");
  } else if (testType === "custom") {
    query = query.eq("test_type", "custom");
  }

  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

export async function getPersonalLeaderboard(
  userId: string,
  filters?: MyResultsFilters,
  testType?: TestType
): Promise<PersonalLeaderboardRow[]> {
  if (testType === "custom") return [];

  const admin = getAdminClient();

  let query = admin
    .from("test_events")
    .select(
      `
      id, voted_at, model_a_id, model_b_id, winner_id, loser_id,
      model_a:models!model_a_id(name, provider_id, model_id, provider:providers(name)),
      model_b:models!model_b_id(name, provider_id, model_id, provider:providers(name)),
      winner:models!winner_id(id, provider_id, model_id),
      loser:models!loser_id(id, provider_id, model_id)
    `
    )
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("voted_at", { ascending: true });

  if (testType === "blind" || !testType) {
    query = query.eq("test_type", "blind");
  }

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

  // Resolve (provider_id, model_id) -> definition_name for all models in events
  const providerModelPairs = new Set<string>();
  for (const e of events) {
    const winner = e.winner as { provider_id?: string; model_id?: string } | null;
    const loser = e.loser as { provider_id?: string; model_id?: string } | null;
    if (winner?.provider_id && winner?.model_id) providerModelPairs.add(`${winner.provider_id}:${winner.model_id}`);
    if (loser?.provider_id && loser?.model_id) providerModelPairs.add(`${loser.provider_id}:${loser.model_id}`);
  }
  const defMap = new Map<string, string>();
  if (providerModelPairs.size > 0) {
    const { data: defs } = await admin
      .from("provider_model_definitions")
      .select("provider_id, model_id, name");
    for (const d of defs ?? []) {
      defMap.set(`${d.provider_id}:${d.model_id}`, d.name);
    }
  }
  function toDefinitionName(providerId: string, modelId: string): string {
    return defMap.get(`${providerId}:${modelId}`) ?? modelId;
  }

  // Build model-level stats (group by provider_id:definition_name) and replay ELO
  // Skip same-model pairs (different voices of same definition)
  const modelStats: Record<
    string,
    {
      modelId: string;
      modelName: string;
      providerName: string;
      matchesPlayed: number;
      wins: number;
      losses: number;
      ratings: Record<string, number>; // modelKey -> current rating
    }
  > = {};

  function modelKey(providerId: string, definitionName: string): string {
    return `${providerId}:${definitionName}`;
  }

  for (const e of events) {
    const modelA = e.model_a as {
      id?: string;
      name?: string;
      provider_id?: string;
      model_id?: string;
      provider?: { name?: string };
    } | null;
    const modelB = e.model_b as {
      id?: string;
      name?: string;
      provider_id?: string;
      model_id?: string;
      provider?: { name?: string };
    } | null;
    const winner = e.winner as { id?: string; provider_id?: string; model_id?: string } | null;
    const loser = e.loser as { id?: string; provider_id?: string; model_id?: string } | null;

    const winnerProviderId = winner?.provider_id;
    const winnerModelId = winner?.model_id;
    const loserProviderId = loser?.provider_id;
    const loserModelId = loser?.model_id;

    if (!winnerProviderId || !winnerModelId || !loserProviderId || !loserModelId) continue;

    const winnerDefName = toDefinitionName(winnerProviderId, winnerModelId);
    const loserDefName = toDefinitionName(loserProviderId, loserModelId);

    // Skip same-definition pairs (different voices of same model)
    if (winnerProviderId === loserProviderId && winnerDefName === loserDefName) continue;

    const winnerKey = modelKey(winnerProviderId, winnerDefName);
    const loserKey = modelKey(loserProviderId, loserDefName);

    if (!modelStats[winnerKey]) {
      const winnerModel = winnerKey === modelKey(modelA?.provider_id ?? "", toDefinitionName(modelA?.provider_id ?? "", modelA?.model_id ?? ""))
        ? modelA
        : modelB;
      modelStats[winnerKey] = {
        modelId: winnerKey,
        modelName: winnerDefName,
        providerName: (winnerModel?.provider as { name?: string })?.name ?? "Unknown",
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        ratings: {},
      };
    }
    if (!modelStats[loserKey]) {
      const loserModel = loserKey === modelKey(modelA?.provider_id ?? "", toDefinitionName(modelA?.provider_id ?? "", modelA?.model_id ?? ""))
        ? modelA
        : modelB;
      modelStats[loserKey] = {
        modelId: loserKey,
        modelName: loserDefName,
        providerName: (loserModel?.provider as { name?: string })?.name ?? "Unknown",
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        ratings: {},
      };
    }

    const winnerStats = modelStats[winnerKey];
    const loserStats = modelStats[loserKey];
    winnerStats.matchesPlayed++;
    winnerStats.wins++;
    loserStats.matchesPlayed++;
    loserStats.losses++;

    const winnerRating = winnerStats.ratings[winnerKey] ?? 1500;
    const loserRating = loserStats.ratings[loserKey] ?? 1500;
    const winnerMatches = winnerStats.matchesPlayed - 1;
    const loserMatches = loserStats.matchesPlayed - 1;

    const result = calculateEloUpdate({
      winnerRating,
      loserRating,
      winnerMatchesPlayed: winnerMatches,
      loserMatchesPlayed: loserMatches,
    });

    winnerStats.ratings[winnerKey] = result.winnerNewRating;
    loserStats.ratings[loserKey] = result.loserNewRating;
  }

  // Apply provider/model filter (modelId is provider_id:definition_name)
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
    rows = rows.filter((r) => r.modelId.startsWith(`${filters.providerId}:`));
  }
  if (filters?.modelId) {
    // modelId filter: provider_id:definition_name (composite) or models.id (legacy)
    const isComposite = filters.modelId.includes(":");
    if (isComposite) {
      rows = rows.filter((r) => r.modelId === filters.modelId);
    } else {
      // Resolve models.id -> (provider_id, definition_name) and filter
      const { data: modelRow } = await admin
        .from("models")
        .select("provider_id, model_id")
        .eq("id", filters.modelId)
        .single();
      if (modelRow) {
        const { data: def } = await admin
          .from("provider_model_definitions")
          .select("name")
          .eq("provider_id", modelRow.provider_id)
          .eq("model_id", modelRow.model_id)
          .maybeSingle();
        const defName = def?.name ?? modelRow.model_id;
        const key = `${modelRow.provider_id}:${defName}`;
        rows = rows.filter((r) => r.modelId === key);
      }
    }
  }

  rows.sort((a, b) => b.userElo - a.userElo);
  return rows;
}

export async function getTestHistory(
  userId: string,
  page: number,
  filters?: MyResultsFilters,
  testType?: TestType
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
      winner:models!winner_id(name, definition_id, provider_id, model_id, provider:providers(name)),
      loser:models!loser_id(name, definition_id, provider_id, model_id, provider:providers(name))
    `,
      { count: "exact" }
    )
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("voted_at", { ascending: false });

  if (testType === "blind" || testType === "custom") {
    query = query.eq("test_type", testType);
  }

  if (filters?.languageId) query = query.eq("language_id", filters.languageId);
  if (filters?.providerId) {
    const providerModels = await admin.from("models").select("id").eq("provider_id", filters.providerId);
    const ids = (providerModels.data ?? []).map((m) => m.id);
    if (ids.length > 0) {
      query = query.or(`model_a_id.in.(${ids.join(",")}),model_b_id.in.(${ids.join(",")})`);
    }
  }
  if (filters?.modelId) {
    const isComposite = filters.modelId.includes(":");
    if (isComposite) {
      const [providerId, definitionName] = filters.modelId.split(":", 2);
      const { data: defModels } = await admin
        .from("provider_model_definitions")
        .select("model_id")
        .eq("provider_id", providerId)
        .eq("name", definitionName);
      const modelIdsForDef = (defModels ?? []).map((d) => d.model_id);
      if (modelIdsForDef.length > 0) {
        const { data: modelRows } = await admin
          .from("models")
          .select("id")
          .eq("provider_id", providerId)
          .in("model_id", modelIdsForDef);
        const ids = (modelRows ?? []).map((r) => r.id);
        if (ids.length > 0) {
          query = query.or(`model_a_id.in.(${ids.join(",")}),model_b_id.in.(${ids.join(",")})`);
        }
      }
    } else {
      query = query.or(`model_a_id.eq.${filters.modelId},model_b_id.eq.${filters.modelId}`);
    }
  }
  if (filters?.fromDate) query = query.gte("voted_at", filters.fromDate);
  if (filters?.toDate) query = query.lte("voted_at", filters.toDate + "T23:59:59.999Z");

  const from = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);

  if (error) return { rows: [], total: 0 };

  // Resolve definition_id and (provider_id, model_id) -> definition display name
  const definitionIds = new Set<string>();
  const providerModelPairs = new Set<string>();
  for (const e of data ?? []) {
    const winner = e.winner as { definition_id?: string; provider_id?: string; model_id?: string } | null;
    const loser = e.loser as { definition_id?: string; provider_id?: string; model_id?: string } | null;
    if (winner?.definition_id) definitionIds.add(winner.definition_id);
    else if (winner?.provider_id && winner?.model_id) providerModelPairs.add(`${winner.provider_id}:${winner.model_id}`);
    if (loser?.definition_id) definitionIds.add(loser.definition_id);
    else if (loser?.provider_id && loser?.model_id) providerModelPairs.add(`${loser.provider_id}:${loser.model_id}`);
  }
  const defByIdMap = new Map<string, string>();
  const defByProviderModelMap = new Map<string, string>();
  if (definitionIds.size > 0) {
    const { data: defs } = await admin
      .from("provider_model_definitions")
      .select("id, name")
      .in("id", Array.from(definitionIds));
    for (const d of defs ?? []) defByIdMap.set(d.id, d.name);
  }
  if (providerModelPairs.size > 0) {
    const { data: defs } = await admin
      .from("provider_model_definitions")
      .select("provider_id, model_id, name");
    for (const d of defs ?? []) defByProviderModelMap.set(`${d.provider_id}:${d.model_id}`, d.name);
  }
  function toDisplayName(
    definitionId: string | undefined,
    providerId: string | undefined,
    modelId: string | undefined,
    fallback: string
  ): string {
    if (definitionId && defByIdMap.has(definitionId)) return defByIdMap.get(definitionId)!;
    if (providerId && modelId && defByProviderModelMap.has(`${providerId}:${modelId}`))
      return defByProviderModelMap.get(`${providerId}:${modelId}`)!;
    return fallback;
  }

  const rows: TestHistoryRow[] = (data ?? []).map((e) => {
    const row = e as { voted_at: string | null; created_at: string };
    const sentence = e.sentence as { text?: string; language?: { name?: string } } | null;
    const winner = e.winner as { name?: string; definition_id?: string; provider_id?: string; model_id?: string; provider?: { name?: string } } | null;
    const loser = e.loser as { name?: string; definition_id?: string; provider_id?: string; model_id?: string; provider?: { name?: string } } | null;
    const winnerName = toDisplayName(winner?.definition_id, winner?.provider_id, winner?.model_id, winner?.name ?? "Unknown");
    const loserName = toDisplayName(loser?.definition_id, loser?.provider_id, loser?.model_id, loser?.name ?? "Unknown");
    return {
      id: e.id,
      votedAt: row.voted_at ?? row.created_at,
      languageName: (sentence?.language as { name?: string })?.name ?? "Unknown",
      sentenceText: (sentence as { text?: string })?.text ?? "",
      winnerName,
      winnerProvider: (winner?.provider as { name?: string })?.name ?? "",
      loserName,
      loserProvider: (loser?.provider as { name?: string })?.name ?? "",
      audioAId: e.audio_a_id,
      audioBId: e.audio_b_id,
    };
  });

  if (testType === "custom" && rows.length > 0) {
    const { winRateByKey } = await getCustomTestWinRateSummary(userId, filters);
    for (const r of rows) {
      const key = `${r.winnerName}::${r.winnerProvider}`;
      r.winnerWinRate = winRateByKey[key];
    }
  }

  return { rows, total: count ?? 0 };
}

export async function getCustomTestWinRateSummary(
  userId: string,
  filters?: MyResultsFilters
): Promise<{ summary: CustomTestWinRateSummary; winRateByKey: Record<string, number> }> {
  const admin = getAdminClient();

  let query = admin
    .from("test_events")
    .select(
      `
      winner:models!winner_id(name, definition_id, provider_id, model_id, provider:providers(name)),
      loser:models!loser_id(name, definition_id, provider_id, model_id, provider:providers(name))
    `
    )
    .eq("user_id", userId)
    .eq("status", "completed")
    .eq("test_type", "custom");

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

  const { data: events, error } = await query;
  if (error || !events) return { summary: [], winRateByKey: {} };

  // Resolve definition_id and (provider_id, model_id) -> definition display name
  const definitionIds = new Set<string>();
  const providerModelPairs = new Set<string>();
  for (const e of events) {
    const winner = e.winner as { definition_id?: string; provider_id?: string; model_id?: string } | null;
    const loser = e.loser as { definition_id?: string; provider_id?: string; model_id?: string } | null;
    if (winner?.definition_id) definitionIds.add(winner.definition_id);
    else if (winner?.provider_id && winner?.model_id) providerModelPairs.add(`${winner.provider_id}:${winner.model_id}`);
    if (loser?.definition_id) definitionIds.add(loser.definition_id);
    else if (loser?.provider_id && loser?.model_id) providerModelPairs.add(`${loser.provider_id}:${loser.model_id}`);
  }
  const defByIdMap = new Map<string, string>();
  const defByProviderModelMap = new Map<string, string>();
  if (definitionIds.size > 0) {
    const { data: defs } = await admin
      .from("provider_model_definitions")
      .select("id, name")
      .in("id", Array.from(definitionIds));
    for (const d of defs ?? []) defByIdMap.set(d.id, d.name);
  }
  if (providerModelPairs.size > 0) {
    const { data: defs } = await admin
      .from("provider_model_definitions")
      .select("provider_id, model_id, name");
    for (const d of defs ?? []) defByProviderModelMap.set(`${d.provider_id}:${d.model_id}`, d.name);
  }
  function toDisplayName(
    definitionId: string | undefined,
    providerId: string | undefined,
    modelId: string | undefined,
    fallback: string
  ): string {
    if (definitionId && defByIdMap.has(definitionId)) return defByIdMap.get(definitionId)!;
    if (providerId && modelId && defByProviderModelMap.has(`${providerId}:${modelId}`))
      return defByProviderModelMap.get(`${providerId}:${modelId}`)!;
    return fallback;
  }

  const stats: Record<string, { modelName: string; providerName: string; wins: number; losses: number }> = {};
  for (const e of events) {
    const winner = e.winner as { name?: string; definition_id?: string; provider_id?: string; model_id?: string; provider?: { name?: string } } | null;
    const loser = e.loser as { name?: string; definition_id?: string; provider_id?: string; model_id?: string; provider?: { name?: string } } | null;
    const winnerName = toDisplayName(winner?.definition_id, winner?.provider_id, winner?.model_id, winner?.name ?? "Unknown");
    const winnerProvider = (winner?.provider as { name?: string })?.name ?? "";
    const loserName = toDisplayName(loser?.definition_id, loser?.provider_id, loser?.model_id, loser?.name ?? "Unknown");
    const loserProvider = (loser?.provider as { name?: string })?.name ?? "";
    const winnerKey = `${winnerName}::${winnerProvider}`;
    const loserKey = `${loserName}::${loserProvider}`;

    if (!stats[winnerKey]) {
      stats[winnerKey] = { modelName: winnerName, providerName: winnerProvider, wins: 0, losses: 0 };
    }
    stats[winnerKey].wins++;

    if (!stats[loserKey]) {
      stats[loserKey] = { modelName: loserName, providerName: loserProvider, wins: 0, losses: 0 };
    }
    stats[loserKey].losses++;
  }

  const summary: CustomTestWinRateSummary = Object.values(stats).map((s) => {
    const total = s.wins + s.losses;
    const winRate = total > 0 ? (s.wins / total) * 100 : 0;
    return { ...s, winRate };
  });

  const winRateByKey: Record<string, number> = {};
  for (const s of summary) {
    const key = `${s.modelName}::${s.providerName}`;
    winRateByKey[key] = s.winRate;
  }

  return { summary, winRateByKey };
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
  filters?: MyResultsFilters,
  testType?: TestType
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
      winner:models!winner_id(name, definition_id, provider_id, model_id, provider:providers(name)),
      loser:models!loser_id(name, definition_id, provider_id, model_id, provider:providers(name))
    `
    )
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("voted_at", { ascending: false });

  if (testType === "blind" || testType === "custom") {
    query = query.eq("test_type", testType);
  }

  if (filters?.languageId) query = query.eq("language_id", filters.languageId);
  if (filters?.fromDate) query = query.gte("voted_at", filters.fromDate);
  if (filters?.toDate) query = query.lte("voted_at", filters.toDate + "T23:59:59.999Z");

  const { data, error } = await query.limit(MAX_EXPORT_ROWS + 1);

  if (error) return { error: "Failed to export" };

  const rows = data ?? [];
  const exceeded = rows.length > MAX_EXPORT_ROWS;
  const exportRows = rows.slice(0, MAX_EXPORT_ROWS);

  // Resolve definition_id and (provider_id, model_id) -> definition display name
  const definitionIds = new Set<string>();
  const providerModelPairs = new Set<string>();
  for (const e of exportRows) {
    const winner = e.winner as { definition_id?: string; provider_id?: string; model_id?: string } | null;
    const loser = e.loser as { definition_id?: string; provider_id?: string; model_id?: string } | null;
    if (winner?.definition_id) definitionIds.add(winner.definition_id);
    else if (winner?.provider_id && winner?.model_id) providerModelPairs.add(`${winner.provider_id}:${winner.model_id}`);
    if (loser?.definition_id) definitionIds.add(loser.definition_id);
    else if (loser?.provider_id && loser?.model_id) providerModelPairs.add(`${loser.provider_id}:${loser.model_id}`);
  }
  const defByIdMap = new Map<string, string>();
  const defByProviderModelMap = new Map<string, string>();
  if (definitionIds.size > 0) {
    const { data: defs } = await admin
      .from("provider_model_definitions")
      .select("id, name")
      .in("id", Array.from(definitionIds));
    for (const d of defs ?? []) defByIdMap.set(d.id, d.name);
  }
  if (providerModelPairs.size > 0) {
    const { data: defs } = await admin
      .from("provider_model_definitions")
      .select("provider_id, model_id, name");
    for (const d of defs ?? []) defByProviderModelMap.set(`${d.provider_id}:${d.model_id}`, d.name);
  }
  function toDisplayName(
    definitionId: string | undefined,
    providerId: string | undefined,
    modelId: string | undefined,
    fallback: string
  ): string {
    if (definitionId && defByIdMap.has(definitionId)) return defByIdMap.get(definitionId)!;
    if (providerId && modelId && defByProviderModelMap.has(`${providerId}:${modelId}`))
      return defByProviderModelMap.get(`${providerId}:${modelId}`)!;
    return fallback;
  }

  const header = "timestamp,language,sentence_text,winner_model,winner_provider,loser_model,loser_provider,listen_time_a_ms,listen_time_b_ms";
  const csvRows = exportRows.map((e) => {
    const sentence = e.sentence as { text?: string; language?: { name?: string } } | null;
    const winner = e.winner as { name?: string; definition_id?: string; provider_id?: string; model_id?: string; provider?: { name?: string } } | null;
    const loser = e.loser as { name?: string; definition_id?: string; provider_id?: string; model_id?: string; provider?: { name?: string } } | null;
    const timestamp = e.voted_at ? new Date(e.voted_at).toISOString() : "";
    const text = (sentence?.text ?? "").replace(/"/g, '""');
    const languageName = (sentence?.language as { name?: string })?.name ?? "";
    const winnerName = toDisplayName(winner?.definition_id, winner?.provider_id, winner?.model_id, winner?.name ?? "").replace(/"/g, '""');
    const winnerProvider = ((winner?.provider as { name?: string })?.name ?? "").replace(/"/g, '""');
    const loserName = toDisplayName(loser?.definition_id, loser?.provider_id, loser?.model_id, loser?.name ?? "").replace(/"/g, '""');
    const loserProvider = ((loser?.provider as { name?: string })?.name ?? "").replace(/"/g, '""');
    return `"${timestamp}","${languageName}","${text}","${winnerName}","${winnerProvider}","${loserName}","${loserProvider}",${e.listen_time_a_ms ?? ""},${e.listen_time_b_ms ?? ""}`;
  });

  const csv = [header, ...csvRows].join("\n");
  const filename =
    testType === "custom"
      ? `my-custom-tests-${new Date().toISOString().slice(0, 10)}.csv`
      : `my-results-${new Date().toISOString().slice(0, 10)}.csv`;

  return {
    csv,
    filename,
    warning: exceeded ? `Export limited to ${MAX_EXPORT_ROWS} rows. Narrow filters for more.` : undefined,
  };
}

export async function getFilterOptions(
  userId: string,
  testType?: TestType
): Promise<{
  languages: { id: string; name: string }[];
  providers: { id: string; name: string }[];
  models: { id: string; name: string; providerId: string }[];
}> {
  const admin = getAdminClient();

  let eventsQuery = admin
    .from("test_events")
    .select("language_id, model_a_id, model_b_id")
    .eq("user_id", userId)
    .eq("status", "completed");

  if (testType === "blind" || testType === "custom") {
    eventsQuery = eventsQuery.eq("test_type", testType);
  }

  const { data: events } = await eventsQuery;

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
      ? admin.from("models").select("id, name, provider_id, model_id").in("id", Array.from(modelIds))
      : Promise.resolve({ data: [] }),
  ]);

  const models = modelRes.data ?? [];
  const providerIds = new Set(models.map((m) => m.provider_id));

  // Resolve (provider_id, model_id) -> definition_name for unique model options
  const defMap = new Map<string, string>();
  if (models.length > 0) {
    const { data: defs } = await admin
      .from("provider_model_definitions")
      .select("provider_id, model_id, name")
      .in("provider_id", Array.from(providerIds));
    for (const d of defs ?? []) {
      defMap.set(`${d.provider_id}:${d.model_id}`, d.name);
    }
  }

  const seen = new Set<string>();
  const modelOptions: { id: string; name: string; providerId: string }[] = [];
  for (const m of models) {
    const defName = defMap.get(`${m.provider_id}:${m.model_id}`) ?? m.name ?? m.model_id;
    const compositeKey = `${m.provider_id}:${defName}`;
    if (seen.has(compositeKey)) continue;
    seen.add(compositeKey);
    modelOptions.push({ id: compositeKey, name: defName, providerId: m.provider_id });
  }

  const provRes =
    providerIds.size > 0
      ? await admin.from("providers").select("id, name").in("id", Array.from(providerIds))
      : { data: [] };

  return {
    languages: (langRes.data ?? []).map((l) => ({ id: l.id, name: l.name })),
    providers: (provRes.data ?? []).map((p) => ({ id: p.id, name: p.name })),
    models: modelOptions,
  };
}

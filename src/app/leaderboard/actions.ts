"use server";

import { getAdminClient } from "@/lib/supabase/admin";

export type LeaderboardRow = {
  modelId: string;
  modelName: string;
  providerName: string;
  providerSlug: string;
  rating: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  lastUpdated: string;
  tags: string[] | null;
  isProvisional: boolean;
};

export type LeaderboardFilters = {
  languageId?: string;
  providerId?: string;
  tags?: string[];
  minMatches?: number;
};

export async function getGlobalLeaderboard(
  filters?: LeaderboardFilters
): Promise<LeaderboardRow[]> {
  const admin = getAdminClient();

  if (filters?.languageId) {
    const { data, error } = await admin.rpc("get_leaderboard_by_language_model", {
      p_language_id: filters.languageId,
      p_provider_id: filters.providerId ?? null,
      p_min_matches: filters.minMatches ?? null,
    });

    if (error) return [];
    return mapModelRowsToLeaderboard(data ?? [], filters);
  }

  const { data, error } = await admin.rpc("get_leaderboard_global_model", {
    p_provider_id: filters?.providerId ?? null,
    p_min_matches: filters?.minMatches ?? null,
  });

  if (error) return [];
  return mapModelRowsToLeaderboard(data ?? [], filters);
}

type ModelLeaderboardRow = {
  provider_id: string;
  definition_name: string;
  model_name: string | null;
  provider_name: string;
  provider_slug: string;
  rating: number;
  matches_played: number;
  wins: number;
  losses: number;
  last_updated: string;
  tags: string[] | null;
};

function mapModelRowsToLeaderboard(
  data: ModelLeaderboardRow[],
  filters?: LeaderboardFilters
): LeaderboardRow[] {
  let rows: LeaderboardRow[] = data.map((r) => {
    const winRate =
      r.matches_played > 0 ? (r.wins / r.matches_played) * 100 : 0;
    return {
      modelId: `${r.provider_id}:${r.definition_name}`,
      modelName: r.model_name ?? r.definition_name ?? "Unknown",
      providerName: r.provider_name,
      providerSlug: r.provider_slug,
      rating: Math.round(r.rating),
      matchesPlayed: r.matches_played,
      wins: r.wins,
      losses: r.losses,
      winRate,
      lastUpdated: r.last_updated,
      tags: r.tags,
      isProvisional: r.matches_played < 30,
    };
  });

  if (filters?.tags && filters.tags.length > 0) {
    rows = rows.filter(
      (r) => r.tags && filters!.tags!.some((t) => r.tags!.includes(t))
    );
  }

  return rows;
}

export async function getLeaderboardOptions(): Promise<{
  languages: { id: string; code: string }[];
  providers: { id: string; name: string }[];
}> {
  const admin = getAdminClient();

  const [langRes, provRes] = await Promise.all([
    admin.from("languages").select("id, code").eq("is_active", true).order("code"),
    admin.from("providers").select("id, name").eq("is_active", true).order("name"),
  ]);

  return {
    languages: (langRes.data ?? []).map((l) => ({ id: l.id, code: l.code })),
    providers: (provRes.data ?? []).map((p) => ({ id: p.id, name: p.name })),
  };
}

export type PairwiseMatrixModel = {
  modelId: string;
  modelName: string;
  providerName: string;
};

export type PairwiseMatrixResult = {
  models: PairwiseMatrixModel[];
  matrix: Record<string, Record<string, { winPct: number; n: number }>>;
};

export async function getPairwiseWinRateMatrix(
  filters?: LeaderboardFilters
): Promise<PairwiseMatrixResult> {
  const admin = getAdminClient();

  // Get leaderboard to determine model order and filter (participated only)
  const leaderboard = await getGlobalLeaderboard(filters);
  const participated = leaderboard.filter((r) => r.matchesPlayed > 0);
  const participatedIds = new Set(participated.map((r) => r.modelId));

  if (participated.length === 0) {
    return { models: [], matrix: {} };
  }

  let query = admin
    .from("test_events")
    .select(
      `
      winner_id, loser_id, language_id,
      winner:models!winner_id(definition_id, provider_id, model_id, name, provider:providers(name)),
      loser:models!loser_id(definition_id, provider_id, model_id, name, provider:providers(name))
    `
    )
    .eq("status", "completed")
    .eq("test_type", "blind")
    .not("winner_id", "is", null)
    .not("loser_id", "is", null);

  if (filters?.languageId) {
    query = query.eq("language_id", filters.languageId);
  }

  const { data: events, error } = await query;
  if (error || !events || events.length === 0) {
    return {
      models: participated.map((r) => ({
        modelId: r.modelId,
        modelName: r.modelName,
        providerName: r.providerName,
      })),
      matrix: {},
    };
  }

  // Resolve definition_id and (provider_id, model_id) -> definition_name
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
  function toDefinitionName(
    definitionId: string | undefined,
    providerId: string,
    modelId: string,
    modelName?: string
  ): string {
    if (definitionId && defByIdMap.has(definitionId)) return defByIdMap.get(definitionId)!;
    if (defByProviderModelMap.has(`${providerId}:${modelId}`)) return defByProviderModelMap.get(`${providerId}:${modelId}`)!;
    const trimmed = modelName ? modelName.trim() : "";
    if (trimmed) return trimmed;
    return modelId;
  }

  // Build pairwise matrix: (rowKey, colKey) -> { rowWins, total }
  const matrixData = new Map<string, Map<string, { rowWins: number; total: number }>>();

  for (const e of events) {
    const winner = e.winner as { definition_id?: string; provider_id?: string; model_id?: string; provider?: { name?: string } } | null;
    const loser = e.loser as { definition_id?: string; provider_id?: string; model_id?: string; provider?: { name?: string } } | null;
    if (!winner?.provider_id || !winner?.model_id || !loser?.provider_id || !loser?.model_id) continue;

    const winnerDefName = toDefinitionName(
      winner.definition_id,
      winner.provider_id,
      winner.model_id,
      (winner as { name?: string }).name
    );
    const loserDefName = toDefinitionName(
      loser.definition_id,
      loser.provider_id,
      loser.model_id,
      (loser as { name?: string }).name
    );
    const winnerKey = `${winner.provider_id}:${winnerDefName}`;
    const loserKey = `${loser.provider_id}:${loserDefName}`;

    if (winnerKey === loserKey) continue;

    // Filter by provider when set
    if (filters?.providerId) {
      if (!winnerKey.startsWith(`${filters.providerId}:`) || !loserKey.startsWith(`${filters.providerId}:`)) continue;
    }

    // Include all events; we filter output to participated models only
    if (!matrixData.has(winnerKey)) matrixData.set(winnerKey, new Map());
    const rowMap = matrixData.get(winnerKey)!;
    const cell = rowMap.get(loserKey) ?? { rowWins: 0, total: 0 };
    cell.rowWins += 1;
    cell.total += 1;
    rowMap.set(loserKey, cell);

    if (!matrixData.has(loserKey)) matrixData.set(loserKey, new Map());
    const loserRowMap = matrixData.get(loserKey)!;
    const loserCell = loserRowMap.get(winnerKey) ?? { rowWins: 0, total: 0 };
    loserCell.total += 1;
    loserRowMap.set(winnerKey, loserCell);
  }

  // Build result: models in leaderboard order, matrix as Record
  const models: PairwiseMatrixModel[] = participated.map((r) => ({
    modelId: r.modelId,
    modelName: r.modelName,
    providerName: r.providerName,
  }));

  const matrix: Record<string, Record<string, { winPct: number; n: number }>> = {};
  for (const rowId of models.map((m) => m.modelId)) {
    matrix[rowId] = {};
    const rowMap = matrixData.get(rowId);
    if (!rowMap) continue;
    for (const [colId, { rowWins, total }] of rowMap) {
      if (!participatedIds.has(colId)) continue;
      matrix[rowId][colId] = {
        winPct: total > 0 ? (rowWins / total) * 100 : 0,
        n: total,
      };
    }
  }

  return { models, matrix };
}

export async function getLeaderboardSummary(): Promise<{
  totalModels: number;
  totalMatches: number;
  activeLanguages: number;
}> {
  const admin = getAdminClient();

  const { data: global } = await admin
    .from("elo_ratings_global_model")
    .select("matches_played");

  const totalModels = global?.length ?? 0;
  const totalMatches = Math.floor(
    (global ?? []).reduce((s, r) => s + r.matches_played, 0) / 2
  );

  const { data: langIds } = await admin
    .from("elo_ratings_by_language_model")
    .select("language_id");
  const distinctLangs = new Set((langIds ?? []).map((r) => r.language_id));

  return {
    totalModels,
    totalMatches,
    activeLanguages: distinctLangs.size || 1,
  };
}

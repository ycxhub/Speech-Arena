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

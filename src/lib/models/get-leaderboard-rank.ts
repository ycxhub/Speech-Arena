import { getAdminClient } from "@/lib/supabase/admin";

export type LeaderboardRankResult = {
  rank: number;
  total: number;
  display: string;
};

export async function getLeaderboardRank(
  providerId: string,
  definitionName: string,
  useEloRank: boolean,
  rankOverride: number | null
): Promise<LeaderboardRankResult> {
  const admin = getAdminClient();

  if (!useEloRank && rankOverride != null) {
    const { count } = await admin
      .from("elo_ratings_global_model")
      .select("*", { count: "exact", head: true });
    const total = count ?? 0;
    return {
      rank: rankOverride,
      total,
      display: `Rank ${rankOverride}/${total}`,
    };
  }

  const { data: leaderboard } = await admin.rpc("get_leaderboard_global_model", {
    p_provider_id: undefined,
    p_min_matches: undefined,
  });

  const rows = (leaderboard ?? []) as {
    provider_id: string;
    definition_name: string;
    rating: number;
  }[];

  const idx = rows.findIndex(
    (r) => r.provider_id === providerId && r.definition_name === definitionName
  );

  if (idx >= 0) {
    return {
      rank: idx + 1,
      total: rows.length,
      display: `Rank ${idx + 1}/${rows.length}`,
    };
  }

  if (rankOverride != null) {
    return {
      rank: rankOverride,
      total: rows.length,
      display: `Rank ${rankOverride}/${rows.length}`,
    };
  }

  return {
    rank: 0,
    total: rows.length,
    display: "Unranked",
  };
}

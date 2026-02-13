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
    const { data, error } = await admin
      .from("elo_ratings_by_language")
      .select(
        `
        rating, matches_played, wins, losses, last_updated,
        model:models!inner(id, name, tags, provider_id, provider:providers!inner(id, name, slug))
      `
      )
      .eq("language_id", filters.languageId)
      .order("rating", { ascending: false });

    if (error) return [];
    return mapToRows(data ?? [], filters);
  }

  const { data, error } = await admin
    .from("elo_ratings_global")
    .select(
      `
      rating, matches_played, wins, losses, last_updated,
      model:models!inner(id, name, tags, provider_id, is_active, provider:providers!inner(id, name, slug, is_active))
    `
    )
    .eq("model.is_active", true)
    .eq("model.provider.is_active", true)
    .order("rating", { ascending: false });

  if (error) return [];
  return mapToRows(data ?? [], filters);
}

function mapToRows(
  data: Array<{
    rating: number;
    matches_played: number;
    wins: number;
    losses: number;
    last_updated: string;
    model: {
      id: string;
      name: string;
      tags: string[] | null;
      provider_id?: string;
      provider?: { id: string; name: string; slug: string };
    } | null;
  }>,
  filters?: LeaderboardFilters
): LeaderboardRow[] {
  type RowWithProvider = LeaderboardRow & { _providerId?: string };
  let rows: RowWithProvider[] = data
    .filter((r) => r.model != null)
    .map((r) => {
      const m = r.model!;
      const provider = m.provider ?? { name: "Unknown", slug: "", id: "" };
      const winRate =
        r.matches_played > 0 ? (r.wins / r.matches_played) * 100 : 0;
      return {
        modelId: m.id,
        modelName: m.name,
        providerName: provider.name,
        providerSlug: provider.slug,
        rating: Math.round(r.rating),
        matchesPlayed: r.matches_played,
        wins: r.wins,
        losses: r.losses,
        winRate,
        lastUpdated: r.last_updated,
        tags: m.tags,
        isProvisional: r.matches_played < 30,
        _providerId: provider.id || m.provider_id,
      };
    });

  if (filters?.providerId) {
    rows = rows.filter((r) => r._providerId === filters.providerId);
  }

  if (filters?.minMatches != null && filters.minMatches > 0) {
    rows = rows.filter((r) => r.matchesPlayed >= filters!.minMatches!);
  }

  if (filters?.tags && filters.tags.length > 0) {
    rows = rows.filter(
      (r) => r.tags && filters!.tags!.some((t) => r.tags!.includes(t))
    );
  }

  return rows.map(({ _providerId: _, ...rest }) => rest);
}

export async function getLeaderboardOptions(): Promise<{
  languages: { id: string; name: string }[];
  providers: { id: string; name: string }[];
}> {
  const admin = getAdminClient();

  const [langRes, provRes] = await Promise.all([
    admin.from("languages").select("id, name").eq("is_active", true).order("name"),
    admin.from("providers").select("id, name").eq("is_active", true).order("name"),
  ]);

  return {
    languages: (langRes.data ?? []).map((l) => ({ id: l.id, name: l.name })),
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
    .from("elo_ratings_global")
    .select("matches_played");

  const totalModels = global?.length ?? 0;
  const totalMatches = Math.floor(
    (global ?? []).reduce((s, r) => s + r.matches_played, 0) / 2
  );

  const { data: langIds } = await admin
    .from("elo_ratings_by_language")
    .select("language_id");
  const distinctLangs = new Set((langIds ?? []).map((r) => r.language_id));

  return {
    totalModels,
    totalMatches,
    activeLanguages: distinctLangs.size || 1,
  };
}

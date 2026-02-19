"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassTable } from "@/components/ui/glass-table";
import { GlassSelect } from "@/components/ui/glass-select";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassBadge } from "@/components/ui/glass-badge";
import type { LeaderboardRow } from "./actions";

type Props = {
  initialData: LeaderboardRow[];
  summary: { totalModels: number; totalMatches: number; activeLanguages: number };
  languages: { id: string; code: string }[];
  providers: { id: string; name: string }[];
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export function LeaderboardClient({
  initialData,
  summary,
  languages,
  providers,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const languageId = searchParams.get("language") ?? "";
  const providerId = searchParams.get("provider") ?? "";
  const minMatches = searchParams.get("min_matches") ?? "";

  const { participated, notYetParticipated } = useMemo(() => {
    let data = initialData;
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.modelName.toLowerCase().includes(q) ||
          r.providerName.toLowerCase().includes(q)
      );
    }
    const participated = data.filter((r) => r.matchesPlayed > 0);
    const notYetParticipated = data.filter((r) => r.matchesPlayed === 0);
    return { participated, notYetParticipated };
  }, [initialData, search]);

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.push(`/leaderboard?${params.toString()}`);
  };

  const tableData = participated.map((r, i) => ({
    ...r,
    rank: i + 1,
    rankDisplay: i + 1,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-page-title">Leaderboard</h1>

      {summary.totalMatches < 500 && summary.totalMatches > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          The leaderboard is still early. Rankings will become more reliable as
          more tests are completed.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard>
          <p className="text-2xl font-bold text-white">{summary.totalModels}</p>
          <p className="text-sm text-white/60">Models Ranked</p>
        </GlassCard>
        <GlassCard>
          <p className="text-2xl font-bold text-white">{summary.totalMatches}</p>
          <p className="text-sm text-white/60">Total Matches</p>
        </GlassCard>
        <GlassCard>
          <p className="text-2xl font-bold text-white">
            {summary.activeLanguages}
          </p>
          <p className="text-sm text-white/60">Active Languages</p>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="mb-4 flex flex-nowrap items-end gap-3 overflow-x-auto pb-2">
          <GlassSelect
            label="Language"
            options={[
              { value: "", label: "All Languages" },
              ...languages.map((l) => ({ value: l.id, label: l.code })),
            ]}
            value={languageId}
            onChange={(e) => updateUrl({ language: e.target.value })}
            className="w-36 shrink-0"
          />
          <GlassSelect
            label="Provider"
            options={[
              { value: "", label: "All providers" },
              ...providers.map((p) => ({ value: p.id, label: p.name })),
            ]}
            value={providerId}
            onChange={(e) => updateUrl({ provider: e.target.value })}
            className="w-36 shrink-0"
          />
          <GlassInput
            label="Min Matches"
            type="number"
            min={0}
            placeholder="0"
            value={minMatches}
            onChange={(e) => updateUrl({ min_matches: e.target.value })}
            className="w-28 shrink-0"
          />
          <GlassInput
            label="Search"
            placeholder="Model or provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[180px] shrink-0"
          />
        </div>

        {participated.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-4 text-white/60">
              {initialData.length === 0
                ? "No rankings yet. Be the first to run a blind test!"
                : "No models match your filters."}
            </p>
            {initialData.length === 0 && (
              <Link
                href="/blind-test"
                className="text-accent-blue hover:text-accent-blue/80"
              >
                Start Blind Test →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <GlassTable<LeaderboardRow & { rank: number; rankDisplay: React.ReactNode }>
              columns={[
                { key: "rankDisplay", header: "Rank", sortable: true },
                {
                  key: "modelName",
                  header: "Model",
                  render: (r) => (
                    <span className="flex items-center gap-2">
                      {r.modelName}
                      {r.isProvisional && (
                        <span title="This model has fewer than 30 matches. Its rating may change significantly.">
                          <GlassBadge color="orange">Provisional</GlassBadge>
                        </span>
                      )}
                    </span>
                  ),
                },
                { key: "providerName", header: "Provider" },
                {
                  key: "rating",
                  header: "ELO",
                  render: (r) => r.rating.toString(),
                },
                { key: "matchesPlayed", header: "Matches" },
                {
                  key: "winRate",
                  header: "Win Rate",
                  render: (r) => `${r.winRate.toFixed(1)}%`,
                },
                {
                  key: "lastUpdated",
                  header: "Last Updated",
                  render: (r) => formatRelativeTime(r.lastUpdated),
                },
              ]}
              data={tableData}
            />
          </div>
        )}
      </GlassCard>

      {notYetParticipated.length > 0 && (
        <GlassCard>
          <h2 className="mb-4 text-lg font-medium text-white/80">
            Not Yet Participated
          </h2>
          <p className="mb-4 text-sm text-white/50">
            Models that have not completed any blind tests yet.
          </p>
          <div className="overflow-x-auto">
            <GlassTable<LeaderboardRow>
              columns={[
                { key: "modelName", header: "Model" },
                { key: "providerName", header: "Provider" },
              ]}
              data={notYetParticipated}
            />
          </div>
        </GlassCard>
      )}
    </div>
  );
}

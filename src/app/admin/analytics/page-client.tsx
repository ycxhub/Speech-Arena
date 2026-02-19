"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { GlassTable } from "@/components/ui/glass-table";

type Props = {
  summary: {
    completedRounds: number;
    totalRounds: number;
    completionRate: string;
    activeModels: number;
    activeUsers: number;
  };
  testsPerDay: { day: string; count: number }[];
  latency: { provider: string; medianMs: number }[];
  errorRates: { provider: string; total: number; invalid: number; rate: number }[];
  matchups: { modelA: string; modelB: string; matches: number; aWins: number; bWins: number }[];
};

export function AnalyticsClient({
  summary,
  testsPerDay,
  latency,
  errorRates,
  matchups,
}: Props) {
  return (
    <div className="space-y-8">
      <h1 className="text-page-title">Analytics</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard>
          <p className="text-2xl font-bold text-white">
            {summary.completedRounds.toLocaleString()}
          </p>
          <p className="text-sm text-white/60">Total Tests</p>
        </GlassCard>
        <GlassCard>
          <p className="text-2xl font-bold text-white">{summary.completionRate}%</p>
          <p className="text-sm text-white/60">
            Completion Rate ({summary.completedRounds.toLocaleString()} /{" "}
            {summary.totalRounds.toLocaleString()})
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-2xl font-bold text-white">{summary.activeModels}</p>
          <p className="text-sm text-white/60">Active Models</p>
        </GlassCard>
        <GlassCard>
          <p className="text-2xl font-bold text-white">{summary.activeUsers}</p>
          <p className="text-sm text-white/60">Active Users</p>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="mb-4 text-section-heading">Tests per Day (last 30 days)</h2>
        <GlassTable<{ day: string; count: number }>
          columns={[
            { key: "day", header: "Date" },
            { key: "count", header: "Completed Tests" },
          ]}
          data={testsPerDay}
        />
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-section-heading">Median Generation Latency by Provider</h2>
        <GlassTable<{ provider: string; medianMs: number }>
          columns={[
            { key: "provider", header: "Provider" },
            {
              key: "medianMs",
              header: "Median (ms)",
              render: (r) => (
                <span className={r.medianMs > 5000 ? "text-accent-orange" : ""}>
                  {r.medianMs.toFixed(0)}
                </span>
              ),
            },
          ]}
          data={latency}
        />
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-section-heading">Error Rates by Provider</h2>
        <GlassTable<{ provider: string; total: number; invalid: number; rate: number }>
          columns={[
            { key: "provider", header: "Provider" },
            { key: "total", header: "Total" },
            { key: "invalid", header: "Invalid" },
            {
              key: "rate",
              header: "Error Rate",
              render: (r) => `${r.rate.toFixed(1)}%`,
            },
          ]}
          data={errorRates}
        />
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-section-heading">Top Matchup Pairs</h2>
        <GlassTable<{
          modelA: string;
          modelB: string;
          matches: number;
          aWins: number;
          bWins: number;
        }>
          columns={[
            { key: "modelA", header: "Model A" },
            { key: "modelB", header: "Model B" },
            { key: "matches", header: "Matches" },
            { key: "aWins", header: "A Wins" },
            { key: "bWins", header: "B Wins" },
          ]}
          data={matchups}
        />
      </GlassCard>
    </div>
  );
}

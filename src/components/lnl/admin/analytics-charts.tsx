"use client";

import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { LnlProgress } from "@/components/lnl/ui/lnl-progress";

export interface AnalyticsData {
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
  perAnnotatorProgress: Array<{
    userId?: string;
    email: string;
    completed: number;
    total: number;
  }>;
  labelDistribution: Record<string, number>;
  averageTimePerItemMs: number;
  flaggedItemsCount: number;
}

interface Props {
  data: AnalyticsData | null;
  isLoading?: boolean;
}

export function AnalyticsCharts({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <LnlCard key={i} className="animate-pulse">
            <div className="h-24 rounded bg-neutral-800" />
          </LnlCard>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <LnlCard>
        <p className="text-sm text-neutral-500">Select a task to view analytics</p>
      </LnlCard>
    );
  }

  const labelEntries = Object.entries(data.labelDistribution).sort(
    (a, b) => b[1] - a[1]
  );
  const maxLabelCount = Math.max(...labelEntries.map(([, c]) => c), 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <LnlCard>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Total items
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-100">
            {data.totalItems}
          </p>
        </LnlCard>
        <LnlCard>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Completion
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-100">
            {data.completionPercentage}%
          </p>
          <LnlProgress
            value={data.completedItems}
            max={data.totalItems}
            size="sm"
            className="mt-2"
          />
        </LnlCard>
        <LnlCard>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Avg time / item
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-100">
            {data.averageTimePerItemMs >= 1000
              ? `${(data.averageTimePerItemMs / 1000).toFixed(1)}s`
              : `${data.averageTimePerItemMs}ms`}
          </p>
        </LnlCard>
        <LnlCard>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Flagged items
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-400">
            {data.flaggedItemsCount}
          </p>
        </LnlCard>
      </div>

      {labelEntries.length > 0 && (
        <LnlCard>
          <h3 className="mb-4 text-sm font-semibold text-neutral-200">
            Label distribution
          </h3>
          <div className="space-y-3">
            {labelEntries.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-32 truncate text-sm text-neutral-400">
                  {name}
                </span>
                <div className="flex-1">
                  <div className="h-6 overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: `${(count / maxLabelCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-12 text-right text-sm tabular-nums text-neutral-400">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </LnlCard>
      )}

      {data.perAnnotatorProgress.length > 0 && (
        <LnlCard>
          <h3 className="mb-4 text-sm font-semibold text-neutral-200">
            Per-annotator progress
          </h3>
          <div className="space-y-3">
            {data.perAnnotatorProgress.map((a) => (
              <div key={a.email} className="flex items-center gap-4">
                <span className="w-40 truncate text-sm text-neutral-400">
                  {a.email}
                </span>
                <LnlProgress
                  value={a.completed}
                  max={a.total}
                  size="sm"
                  className="flex-1"
                />
                <span className="w-16 text-right text-sm tabular-nums text-neutral-400">
                  {a.completed} / {a.total}
                </span>
              </div>
            ))}
          </div>
        </LnlCard>
      )}
    </div>
  );
}

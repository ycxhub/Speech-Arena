"use client";

import { useState, useEffect } from "react";
import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { AnalyticsCharts } from "@/components/lnl/admin/analytics-charts";
import { ExportControls } from "@/components/lnl/admin/export-controls";
import type { AnalyticsData } from "@/components/lnl/admin/analytics-charts";

interface Task {
  id: string;
  name: string;
  status?: string;
}

interface Props {
  tasks: Task[];
}

export function ReportsClient({ tasks }: Props) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedTaskId) {
      setAnalytics(null);
      return;
    }

    setLoading(true);
    fetch(`/api/listen-and-log/tasks/${selectedTaskId}/analytics`)
      .then((r) => r.json())
      .then((data) => {
        setAnalytics(data);
      })
      .catch((err) => {
        console.error(err);
        setAnalytics(null);
      })
      .finally(() => setLoading(false));
  }, [selectedTaskId]);

  const annotators =
    analytics?.perAnnotatorProgress
      ?.filter((p): p is typeof p & { userId: string } => !!p.userId)
      .map((p) => ({ userId: p.userId, email: p.email })) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <LnlCard>
        <label className="mb-2 block text-sm font-medium text-neutral-400">
          Select task
        </label>
        <select
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          className="w-full max-w-md rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-200"
        >
          <option value="">— Choose a task —</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.status ? `(${t.status})` : ""}
            </option>
          ))}
        </select>
      </LnlCard>

      {selectedTaskId && (
        <>
          <AnalyticsCharts data={analytics} isLoading={loading} />
          <ExportControls taskId={selectedTaskId} annotators={annotators} />
        </>
      )}
    </div>
  );
}

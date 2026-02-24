"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { LnlProgress } from "@/components/lnl/ui/lnl-progress";
import { LnlButton } from "@/components/lnl/ui/lnl-button";

interface Props {
  taskId: string;
  totalItems: number;
  initialPending: number;
}

export function TtsGenerationProgress({
  taskId,
  totalItems,
  initialPending,
}: Props) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(initialPending);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const runBatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/listen-and-log/tasks/${taskId}/generate-audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: 5 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        return;
      }
      setRemaining(data.remaining);
      if (data.remaining === 0) {
        setIsPolling(false);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setIsPolling(false);
    }
  }, [taskId, router]);

  useEffect(() => {
    if (remaining <= 0) return;
    setIsPolling(true);
    runBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on mount when pending
  }, []);

  useEffect(() => {
    if (!isPolling || remaining <= 0) return;
    const id = setInterval(runBatch, 2500);
    return () => clearInterval(id);
  }, [isPolling, remaining, runBatch]);

  const completed = totalItems - remaining;

  return (
    <LnlCard>
      <h2 className="text-sm font-semibold text-neutral-100">Audio Generation</h2>
      <p className="mt-1 text-xs text-neutral-500">
        TTS audio is being generated for each item. This runs in the background.
      </p>
      <div className="mt-4">
        <LnlProgress
          value={completed}
          max={totalItems}
          label={`Generating audio (${completed}/${totalItems})`}
          showPercentage
        />
        {remaining > 0 && (
          <p className="mt-2 text-sm text-neutral-400">
            {remaining} items remaining. Generation continues automatically.
          </p>
        )}
        {remaining === 0 && totalItems > 0 && (
          <p className="mt-2 text-sm text-green-500">All audio generated.</p>
        )}
        {error && (
          <div className="mt-2 flex items-center gap-2">
            <p className="text-sm text-red-400">{error}</p>
            <LnlButton variant="secondary" size="sm" onClick={runBatch}>
              Retry
            </LnlButton>
          </div>
        )}
      </div>
    </LnlCard>
  );
}

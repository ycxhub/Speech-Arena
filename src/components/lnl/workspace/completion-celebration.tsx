"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { LnlModal } from "@/components/lnl/ui/lnl-modal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  summary: {
    totalItems: number;
    totalTimeSpentMs: number;
    labelsAssignedCount: number;
    itemsFlaggedCount: number;
    averageTimePerItemMs: number;
  };
}

export function CompletionCelebration({
  isOpen,
  onClose,
  taskId,
  summary,
}: Props) {
  const router = useRouter();
  const hasFiredConfetti = useRef(false);

  useEffect(() => {
    if (isOpen && !hasFiredConfetti.current) {
      hasFiredConfetti.current = true;
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#3b82f6", "#22c55e", "#eab308"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#3b82f6", "#22c55e", "#eab308"],
        });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen]);

  const handleReview = () => {
    onClose();
    router.push(`/listen-and-log/tasks/${taskId}/items/1`);
  };

  const handleDashboard = () => {
    onClose();
    router.push("/listen-and-log");
  };

  const formatTime = (ms: number) => {
    if (ms >= 60000) return `${Math.round(ms / 60000)}m`;
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms}ms`;
  };

  return (
    <LnlModal isOpen={isOpen} onClose={onClose} title="🎉 Task complete!">
      <div className="space-y-4">
        <p className="text-sm text-neutral-400">
          You&apos;ve completed all {summary.totalItems} items. Great work!
        </p>

        <div className="grid grid-cols-2 gap-3 rounded-lg bg-neutral-900/50 p-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">
              Total time
            </p>
            <p className="text-lg font-semibold tabular-nums text-neutral-200">
              {formatTime(summary.totalTimeSpentMs)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">
              Labels assigned
            </p>
            <p className="text-lg font-semibold tabular-nums text-neutral-200">
              {summary.labelsAssignedCount}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">
              Items flagged
            </p>
            <p className="text-lg font-semibold tabular-nums text-amber-400">
              {summary.itemsFlaggedCount}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">
              Avg time / item
            </p>
            <p className="text-lg font-semibold tabular-nums text-neutral-200">
              {formatTime(summary.averageTimePerItemMs)}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <LnlButton variant="secondary" onClick={handleReview}>
            Review annotations
          </LnlButton>
          <LnlButton onClick={handleDashboard}>Back to dashboard</LnlButton>
        </div>
      </div>
    </LnlModal>
  );
}

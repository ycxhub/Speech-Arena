"use client";

import Link from "next/link";
import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { LnlBadge } from "@/components/lnl/ui/lnl-badge";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { LnlProgress } from "@/components/lnl/ui/lnl-progress";

interface Props {
  task: {
    id: string;
    name: string;
    description: string | null;
    tool_type: string;
    status: string;
    completed: number;
    total: number;
    lastDisplayIndex: number | null;
  };
}

export function TaskCard({ task }: Props) {
  const isCompleted = task.completed >= task.total && task.total > 0;
  const startItem =
    task.lastDisplayIndex != null ? task.lastDisplayIndex + 1 : 1;

  return (
    <LnlCard>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-neutral-100">
            {task.name}
          </h3>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
              {task.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <LnlBadge variant="default">{task.tool_type}</LnlBadge>
            <LnlBadge
              variant={
                isCompleted
                  ? "success"
                  : task.status === "active"
                    ? "info"
                    : "default"
              }
            >
              {isCompleted ? "Completed" : task.status}
            </LnlBadge>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <LnlProgress value={task.completed} max={task.total} showPercentage />
        <p className="mt-1 text-xs text-neutral-500">
          {task.completed} of {task.total} items
        </p>
      </div>

      <div className="mt-4">
        {task.total === 0 ? (
          <p className="text-sm text-neutral-500">No items yet</p>
        ) : isCompleted ? (
          <Link href={`/listen-and-log/tasks/${task.id}/items/1`}>
            <LnlButton variant="secondary" size="sm">
              Review annotations
            </LnlButton>
          </Link>
        ) : (
          <Link href={`/listen-and-log/tasks/${task.id}/items/${startItem}`}>
            <LnlButton size="sm">
              {task.completed > 0 ? "Continue" : "Start"}
            </LnlButton>
          </Link>
        )}
      </div>
    </LnlCard>
  );
}

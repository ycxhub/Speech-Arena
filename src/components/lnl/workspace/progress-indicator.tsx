"use client";

import { LnlProgress } from "@/components/lnl/ui/lnl-progress";
import { LnlBadge } from "@/components/lnl/ui/lnl-badge";
import { cn } from "@/lib/utils";

interface Props {
  completed: number;
  total: number;
  size?: "sm" | "md";
  className?: string;
}

export function ProgressIndicator({
  completed,
  total,
  size = "sm",
  className,
}: Props) {
  const status =
    completed >= total && total > 0
      ? "completed"
      : completed > 0
        ? "in_progress"
        : "not_started";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LnlProgress value={completed} max={total} size={size} className="w-32" />
      <span className="text-xs tabular-nums text-neutral-400">
        {completed} / {total} items
      </span>
      <LnlBadge
        variant={
          status === "completed"
            ? "success"
            : status === "in_progress"
              ? "info"
              : "default"
        }
        className="shrink-0"
      >
        {status === "completed"
          ? "Completed"
          : status === "in_progress"
            ? "In Progress"
            : "Not Started"}
      </LnlBadge>
    </div>
  );
}

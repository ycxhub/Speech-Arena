"use client";

import { useState } from "react";
import { LnlBadge } from "@/components/lnl/ui/lnl-badge";
import { cn } from "@/lib/utils";

export interface HistoryEntry {
  id: string;
  changedBy: string;
  changedByEmail: string;
  previousData: unknown;
  changeType: string;
  changeDescription: string | null;
  createdAt: string;
}

interface Props {
  history: HistoryEntry[];
  className?: string;
}

export function AnnotationHistory({ history, className }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (history.length === 0) {
    return (
      <div className={cn("rounded-lg border border-neutral-800 p-3", className)}>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Version History
        </h3>
        <p className="text-xs text-neutral-600">No history yet</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-neutral-800", className)}>
      <h3 className="border-b border-neutral-800 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Version History
      </h3>
      <div className="max-h-48 overflow-y-auto">
        {history.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const prev = entry.previousData as Record<string, unknown> | null;

          return (
            <div
              key={entry.id}
              className="border-b border-neutral-800/50 last:border-b-0"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedId(isExpanded ? null : entry.id)
                }
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-neutral-900/50"
              >
                <div className="flex items-center gap-2">
                  <LnlBadge
                    variant={
                      entry.changeType === "reviewed"
                        ? "info"
                        : entry.changeType === "reopened"
                          ? "warning"
                          : "default"
                    }
                  >
                    {entry.changeType}
                  </LnlBadge>
                  <span className="text-xs text-neutral-400">
                    {entry.changedByEmail}
                  </span>
                  <span className="text-[10px] text-neutral-600">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
              </button>

              {isExpanded && prev && (
                <div className="border-t border-neutral-800 bg-neutral-950 px-3 py-2">
                  <p className="mb-1 text-[10px] font-medium text-neutral-500">
                    Previous state
                  </p>
                  <pre className="max-h-24 overflow-y-auto rounded bg-neutral-900 p-2 text-[10px] text-neutral-400">
                    {JSON.stringify(prev, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

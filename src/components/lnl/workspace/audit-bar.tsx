"use client";

import { LnlButton } from "@/components/lnl/ui/lnl-button";

export interface AnnotatorOption {
  userId: string;
  email: string;
}

interface Props {
  annotators: AnnotatorOption[];
  selectedAnnotatorId: string | null;
  onAnnotatorChange: (userId: string | null) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onReopen?: (annotationId: string) => void;
  currentAnnotationId?: string | null;
  currentAnnotationStatus?: string;
}

export function AuditBar({
  annotators,
  selectedAnnotatorId,
  onAnnotatorChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  onReopen,
  currentAnnotationId,
  currentAnnotationStatus,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-neutral-800 bg-neutral-950/50 px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-neutral-500">Annotator</span>
        <select
          value={selectedAnnotatorId ?? ""}
          onChange={(e) =>
            onAnnotatorChange(e.target.value ? e.target.value : null)
          }
          className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200"
        >
          <option value="">All</option>
          {annotators.map((a) => (
            <option key={a.userId} value={a.userId}>
              {a.email}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-neutral-500">Status</span>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200"
        >
          <option value="all">All</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="flagged">Flagged</option>
          <option value="reviewed">Reviewed</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-neutral-500">Sort</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200"
        >
          <option value="item">Item #</option>
          <option value="date">Date</option>
          <option value="annotator">Annotator</option>
        </select>
      </div>

      {onReopen &&
        currentAnnotationId &&
        (currentAnnotationStatus === "completed" ||
          currentAnnotationStatus === "reviewed") && (
          <LnlButton
            variant="secondary"
            size="sm"
            onClick={() => onReopen(currentAnnotationId)}
          >
            Reopen for revision
          </LnlButton>
        )}
    </div>
  );
}

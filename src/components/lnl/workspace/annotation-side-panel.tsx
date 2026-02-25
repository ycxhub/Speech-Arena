"use client";

import { LnlBadge } from "@/components/lnl/ui/lnl-badge";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { cn } from "@/lib/utils";

interface LabelDef {
  name: string;
  color: string;
  shortcut_key: string;
  description: string;
}

interface LabelEntry {
  start_word_index: number;
  end_word_index: number;
  label_name: string;
  color: string;
  comment: string;
}

interface Props {
  taskLabels: LabelDef[];
  labels: LabelEntry[];
  /** Item transcript text - used to show exact words for each annotation */
  itemText?: string;
  booleanAnswers: Record<string, boolean>;
  scores: Record<string, number>;
  overallComment: string;
  taskOptions: Record<string, unknown>;
  onAssignLabel: (labelName: string) => void;
  onRemoveLabel: (index: number) => void;
  onUpdateLabelComment: (index: number, comment: string) => void;
  onBooleanChange: (id: string, value: boolean) => void;
  onScoreChange: (id: string, value: number) => void;
  onOverallCommentChange: (value: string) => void;
  hasSelection: boolean;
  isSaving?: boolean;
  lastSavedAt?: Date | null;
  saveError?: string | null;
  readOnly?: boolean;
  onMarkComplete?: () => void;
  showMarkComplete?: boolean;
  status?: string;
}

function getLabelDisplayText(
  label: LabelEntry,
  itemText?: string
): string {
  if (!itemText) return `Words ${label.start_word_index}–${label.end_word_index}`;
  const words = itemText.split(/\s+/).filter(Boolean);
  if (words.length === 0) return `Words ${label.start_word_index}–${label.end_word_index}`;
  const start = Math.max(0, label.start_word_index);
  const end = Math.min(words.length - 1, label.end_word_index);
  if (start === 0 && end === words.length - 1) return "Entire Sentence";
  return words.slice(start, end + 1).join(" ");
}

export function AnnotationSidePanel({
  taskLabels,
  labels,
  itemText,
  booleanAnswers,
  scores,
  overallComment,
  taskOptions,
  onAssignLabel,
  onRemoveLabel,
  onUpdateLabelComment,
  onBooleanChange,
  onScoreChange,
  onOverallCommentChange,
  hasSelection,
  isSaving,
  lastSavedAt,
  saveError,
  readOnly = false,
  onMarkComplete,
  showMarkComplete,
  status = "in_progress",
}: Props) {
  const booleanQuestions = (taskOptions.boolean_questions ?? []) as string[];
  const scoringFields = (taskOptions.scoring_fields ?? []) as Array<{
    name: string;
    min: number;
    max: number;
    description: string;
  }>;
  const showOverallComment = taskOptions.overall_comment !== false;
  const showPerLabelComments = taskOptions.per_label_comments !== false;

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Label palette */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Labels
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {taskLabels.map((label) => (
            <button
              key={label.name}
              type="button"
              onClick={() => !readOnly && onAssignLabel(label.name)}
              disabled={readOnly || !hasSelection}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                hasSelection
                  ? "border-neutral-600 text-neutral-200 hover:bg-neutral-800"
                  : "cursor-not-allowed border-neutral-800 text-neutral-600"
              )}
              title={label.description}
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              {label.name}
              <kbd className="ml-1 rounded bg-neutral-800 px-1 text-[10px] text-neutral-500">
                {label.shortcut_key}
              </kbd>
            </button>
          ))}
        </div>
        {!hasSelection && taskLabels.length > 0 && (
          <p className="mt-1.5 text-[11px] text-neutral-600">
            Select word(s) in the transcript to assign a label
          </p>
        )}
      </div>

      {/* Annotations list */}
      {labels.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Annotations ({labels.length})
          </h3>
          <div className="flex flex-col gap-1.5">
            {labels.map((label, i) => (
              <div
                key={i}
                className="rounded-md border border-neutral-800 bg-neutral-900/50 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <LnlBadge color={label.color}>{label.label_name}</LnlBadge>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => onRemoveLabel(i)}
                      className="text-[11px] text-neutral-600 hover:text-red-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-neutral-400">
                  {getLabelDisplayText(label, itemText)}
                </p>
                {showPerLabelComments && (
                  <input
                    type="text"
                    placeholder="Add comment..."
                    value={label.comment}
                    onChange={(e) => !readOnly && onUpdateLabelComment(i, e.target.value)}
                    readOnly={readOnly}
                    className="mt-1.5 w-full rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-300 placeholder:text-neutral-600 focus:border-blue-600 focus:outline-none"
                    maxLength={500}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boolean questions */}
      {booleanQuestions.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Questions
          </h3>
          <div className="flex flex-col gap-3">
            {booleanQuestions.map((q, i) => {
              const value = booleanAnswers[String(i)];
              const isYes = value === true;
              const isNo = value === false;
              return (
                <div key={i}>
                  <p className="mb-1.5 text-sm text-neutral-300">{q}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => !readOnly && onBooleanChange(String(i), true)}
                      disabled={readOnly}
                      className={cn(
                        "min-h-[27px] min-w-[44px] rounded border px-2.5 py-1 text-xs font-medium transition-colors",
                        isYes
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                      )}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => !readOnly && onBooleanChange(String(i), false)}
                      disabled={readOnly}
                      className={cn(
                        "min-h-[27px] min-w-[44px] rounded border px-2.5 py-1 text-xs font-medium transition-colors",
                        isNo
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                      )}
                    >
                      No
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scoring fields */}
      {scoringFields.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Scoring
          </h3>
          <div className="flex flex-col gap-3">
            {scoringFields.map((field, i) => {
              const range = Array.from(
                { length: field.max - field.min + 1 },
                (_, idx) => field.min + idx
              );
              return (
                <div key={i}>
                  <p className="mb-1 text-xs text-neutral-300">{field.name}</p>
                  <div className="flex gap-1">
                    {range.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => !readOnly && onScoreChange(field.name, val)}
                        disabled={readOnly}
                        className={cn(
                          "size-7 rounded text-xs font-medium transition-colors",
                          scores[field.name] === val
                            ? "bg-blue-600 text-white"
                            : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                        )}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overall comment */}
      {showOverallComment && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Overall Comment
          </h3>
          <textarea
            value={overallComment}
            onChange={(e) => !readOnly && onOverallCommentChange(e.target.value)}
            readOnly={readOnly}
            placeholder="General observations about this item..."
            className="w-full resize-none rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-300 placeholder:text-neutral-600 focus:border-blue-600 focus:outline-none"
            rows={3}
            maxLength={2000}
          />
          <p className="mt-0.5 text-right text-[10px] text-neutral-600">
            {overallComment.length}/2000
          </p>
        </div>
      )}

      {/* Mark complete */}
      {showMarkComplete && !readOnly && (
        <div className="border-t border-neutral-800 pt-4">
          <LnlButton
            variant={status === "completed" || status === "reviewed" ? "secondary" : "primary"}
            size="sm"
            onClick={onMarkComplete}
            className="w-full"
          >
            {status === "completed" || status === "reviewed"
              ? "✓ Completed"
              : "Mark complete"}
          </LnlButton>
        </div>
      )}

      <div className="min-h-[60vh]" aria-hidden />

      {/* Auto-save indicator */}
      <div className="mt-auto border-t border-neutral-800 pt-4">
        {saveError ? (
          <p className="text-[11px] text-red-400" title={saveError}>
            {saveError}
          </p>
        ) : isSaving ? (
          <p className="text-[11px] text-neutral-500">Saving...</p>
        ) : lastSavedAt ? (
          <p className="text-[11px] text-green-600/80">Auto-saved ✓</p>
        ) : null}
      </div>
    </div>
  );
}

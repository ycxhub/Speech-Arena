"use client";

import { LnlToggle } from "@/components/lnl/ui/lnl-toggle";
import { LnlSelect } from "@/components/lnl/ui/lnl-select";
import { LnlInput } from "@/components/lnl/ui/lnl-input";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { LnlTooltip } from "@/components/lnl/ui/lnl-tooltip";

/** Microcopy for task options — short, easy-to-understand explanations */
const TASK_OPTION_MICROCOPY = {
  randomized_order:
    "Each annotator sees items in a different order. Reduces bias from item position.",
  transcript_visibility:
    "Choose whether the transcript is always shown, always hidden, or if annotators can toggle it.",
  show_ipa:
    "Shows IPA (phonetic) text for each item when available. Use for pronunciation tasks.",
  show_normalized_text:
    "Shows normalized text (e.g. numbers as words) when available. Helps compare spoken vs intended.",
  per_label_comments:
    "Annotators can add a comment to each label they assign to a word span.",
  overall_comment:
    "Annotators can add a general comment for the whole item.",
  boolean_questions:
    "Yes/No questions per item (e.g. \"Is pronunciation acceptable?\"). Appear as Yes/No choices in the annotation workspace.",
  scoring_fields:
    "Numeric rating scales per item (e.g. 1–5 for naturalness). For MOS-style ratings.",
} as const;

function OptionLabel({
  label,
  info,
}: {
  label: string;
  info: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      <LnlTooltip
        content={info}
        contentClassName="max-w-[220px] whitespace-normal"
        position="top"
      >
        <span
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-neutral-600 text-[10px] font-medium text-neutral-400 hover:bg-neutral-500 hover:text-neutral-300"
          aria-label="More info"
        >
          i
        </span>
      </LnlTooltip>
    </span>
  );
}

export interface TaskOptions {
  randomized_order: boolean;
  transcript_visibility: string;
  show_ipa: boolean;
  show_normalized_text: boolean;
  per_label_comments: boolean;
  overall_comment: boolean;
  boolean_questions: string[];
  scoring_fields: Array<{
    name: string;
    min: number;
    max: number;
    description: string;
  }>;
}

export const DEFAULT_TASK_OPTIONS: TaskOptions = {
  randomized_order: false,
  transcript_visibility: "shown",
  show_ipa: false,
  show_normalized_text: false,
  per_label_comments: true,
  overall_comment: true,
  boolean_questions: [],
  scoring_fields: [],
};

interface Props {
  value: TaskOptions;
  onChange: (options: TaskOptions) => void;
}

export function TaskOptionsForm({ value, onChange }: Props) {
  function update(partial: Partial<TaskOptions>) {
    onChange({ ...value, ...partial });
  }

  function addBooleanQuestion() {
    update({ boolean_questions: [...value.boolean_questions, ""] });
  }

  function updateBooleanQuestion(index: number, text: string) {
    const updated = value.boolean_questions.map((q, i) =>
      i === index ? text : q
    );
    update({ boolean_questions: updated });
  }

  function removeBooleanQuestion(index: number) {
    update({
      boolean_questions: value.boolean_questions.filter((_, i) => i !== index),
    });
  }

  function addScoringField() {
    update({
      scoring_fields: [
        ...value.scoring_fields,
        { name: "", min: 1, max: 5, description: "" },
      ],
    });
  }

  function updateScoringField(
    index: number,
    field: string,
    val: string | number
  ) {
    const updated = value.scoring_fields.map((f, i) =>
      i === index ? { ...f, [field]: val } : f
    );
    update({ scoring_fields: updated });
  }

  function removeScoringField(index: number) {
    update({
      scoring_fields: value.scoring_fields.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-neutral-200">Display Options</h3>
        <div className="flex flex-col gap-3 rounded-lg border border-neutral-800 p-4">
          <LnlToggle
            label={
              <OptionLabel
                label="Randomized item order"
                info={TASK_OPTION_MICROCOPY.randomized_order}
              />
            }
            checked={value.randomized_order}
            onChange={(v) => update({ randomized_order: v })}
          />
          <LnlSelect
            id="lnl-select-transcript-visibility"
            label={
              <OptionLabel
                label="Transcript visibility"
                info={TASK_OPTION_MICROCOPY.transcript_visibility}
              />
            }
            options={[
              { value: "shown", label: "Always shown" },
              { value: "hidden", label: "Always hidden" },
              { value: "toggleable", label: "Annotator can toggle" },
            ]}
            value={value.transcript_visibility}
            onChange={(e) =>
              update({ transcript_visibility: e.target.value })
            }
          />
          <LnlToggle
            label={
              <OptionLabel
                label="Show IPA transcription field"
                info={TASK_OPTION_MICROCOPY.show_ipa}
              />
            }
            checked={value.show_ipa}
            onChange={(v) => update({ show_ipa: v })}
          />
          <LnlToggle
            label={
              <OptionLabel
                label="Show normalized text field"
                info={TASK_OPTION_MICROCOPY.show_normalized_text}
              />
            }
            checked={value.show_normalized_text}
            onChange={(v) => update({ show_normalized_text: v })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-neutral-200">Comment Options</h3>
        <div className="flex flex-col gap-3 rounded-lg border border-neutral-800 p-4">
          <LnlToggle
            label={
              <OptionLabel
                label="Per-label comments"
                info={TASK_OPTION_MICROCOPY.per_label_comments}
              />
            }
            checked={value.per_label_comments}
            onChange={(v) => update({ per_label_comments: v })}
          />
          <LnlToggle
            label={
              <OptionLabel
                label="Overall item comment"
                info={TASK_OPTION_MICROCOPY.overall_comment}
              />
            }
            checked={value.overall_comment}
            onChange={(v) => update({ overall_comment: v })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-200">
            <OptionLabel
              label={`Boolean Questions (${value.boolean_questions.length}/10)`}
              info={TASK_OPTION_MICROCOPY.boolean_questions}
            />
          </h3>
          <LnlButton
            variant="secondary"
            size="sm"
            onClick={addBooleanQuestion}
            disabled={value.boolean_questions.length >= 10}
          >
            + Add Question
          </LnlButton>
        </div>
        {value.boolean_questions.map((q, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1">
              <LnlInput
                placeholder="e.g. Is the pronunciation acceptable?"
                value={q}
                onChange={(e) => updateBooleanQuestion(i, e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => removeBooleanQuestion(i)}
              className="px-2 text-neutral-500 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-200">
            <OptionLabel
              label={`Scoring Fields (${value.scoring_fields.length}/5)`}
              info={TASK_OPTION_MICROCOPY.scoring_fields}
            />
          </h3>
          <LnlButton
            variant="secondary"
            size="sm"
            onClick={addScoringField}
            disabled={value.scoring_fields.length >= 5}
          >
            + Add Scoring Field
          </LnlButton>
        </div>
        {value.scoring_fields.map((f, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-neutral-800 p-3"
          >
            <div className="w-36">
              <LnlInput
                label="Name"
                placeholder="Naturalness"
                value={f.name}
                onChange={(e) => updateScoringField(i, "name", e.target.value)}
              />
            </div>
            <div className="w-16">
              <LnlInput
                label="Min"
                type="number"
                value={String(f.min)}
                onChange={(e) =>
                  updateScoringField(i, "min", Number(e.target.value))
                }
              />
            </div>
            <div className="w-16">
              <LnlInput
                label="Max"
                type="number"
                value={String(f.max)}
                onChange={(e) =>
                  updateScoringField(i, "max", Number(e.target.value))
                }
              />
            </div>
            <div className="flex-1">
              <LnlInput
                label="Description"
                placeholder="Rate the naturalness"
                value={f.description}
                onChange={(e) =>
                  updateScoringField(i, "description", e.target.value)
                }
              />
            </div>
            <button
              type="button"
              onClick={() => removeScoringField(i)}
              className="mt-6 px-2 text-neutral-500 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

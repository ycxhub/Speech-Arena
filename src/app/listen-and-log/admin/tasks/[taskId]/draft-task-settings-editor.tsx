"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { LnlInput } from "@/components/lnl/ui/lnl-input";
import {
  LabelConfigEditor,
  type LabelConfig,
} from "@/components/lnl/admin/label-config-editor";
import { updateTask } from "../actions";

interface ScoringField {
  name: string;
  min: number;
  max: number;
  description: string;
}

interface Props {
  taskId: string;
  initialLabels: Array<{ name: string; color: string; shortcut_key?: string; description?: string }>;
  initialBooleanQuestions: string[];
  initialScoringFields: ScoringField[];
  initialTaskOptions: Record<string, unknown>;
}

function toLabelConfig(
  labels: Array<{ name: string; color: string; shortcut_key?: string; description?: string }>
): LabelConfig[] {
  return labels.map((l, i) => ({
    name: l.name,
    color: l.color,
    description: l.description ?? "",
    shortcut_key: l.shortcut_key ?? String(i + 1),
  }));
}

export function DraftTaskSettingsEditor({
  taskId,
  initialLabels,
  initialBooleanQuestions,
  initialScoringFields,
  initialTaskOptions,
}: Props) {
  const router = useRouter();
  const [labels, setLabels] = useState<LabelConfig[]>(
    toLabelConfig(initialLabels)
  );
  const [booleanQuestions, setBooleanQuestions] = useState<string[]>(
    initialBooleanQuestions
  );
  const [scoringFields, setScoringFields] = useState<ScoringField[]>(
    initialScoringFields
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateTask(taskId, {
      label_config: { labels },
      task_options: {
        ...initialTaskOptions,
        boolean_questions: booleanQuestions,
        scoring_fields: scoringFields,
      },
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  function addBooleanQuestion() {
    if (booleanQuestions.length >= 10) return;
    setBooleanQuestions([...booleanQuestions, ""]);
  }

  function updateBooleanQuestion(index: number, text: string) {
    setBooleanQuestions(
      booleanQuestions.map((q, i) => (i === index ? text : q))
    );
  }

  function removeBooleanQuestion(index: number) {
    setBooleanQuestions(booleanQuestions.filter((_, i) => i !== index));
  }

  function addScoringField() {
    if (scoringFields.length >= 5) return;
    setScoringFields([
      ...scoringFields,
      { name: "", min: 1, max: 5, description: "" },
    ]);
  }

  function updateScoringField(
    index: number,
    field: keyof ScoringField,
    val: string | number
  ) {
    setScoringFields(
      scoringFields.map((f, i) =>
        i === index ? { ...f, [field]: val } : f
      )
    );
  }

  function removeScoringField(index: number) {
    setScoringFields(scoringFields.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-6">
      <LnlCard>
        <h2 className="text-sm font-semibold text-neutral-100">
          Labels
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Edit labels for this task. Changes apply to new annotations.
        </p>
        <div className="mt-4">
          <LabelConfigEditor value={labels} onChange={setLabels} />
        </div>
      </LnlCard>

      <LnlCard>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-100">
            Boolean Questions ({booleanQuestions.length}/10)
          </h2>
          <LnlButton
            variant="secondary"
            size="sm"
            onClick={addBooleanQuestion}
            disabled={booleanQuestions.length >= 10}
          >
            + Add Question
          </LnlButton>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Yes/No questions per item (e.g. &quot;Is pronunciation acceptable?&quot;).
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {booleanQuestions.map((q, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <LnlInput
                  placeholder="e.g. Is the pronunciation acceptable?"
                  value={q}
                  onChange={(e) =>
                    updateBooleanQuestion(i, e.target.value)
                  }
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
      </LnlCard>

      <LnlCard>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-100">
            Scoring Fields ({scoringFields.length}/5)
          </h2>
          <LnlButton
            variant="secondary"
            size="sm"
            onClick={addScoringField}
            disabled={scoringFields.length >= 5}
          >
            + Add Scoring Field
          </LnlButton>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Numeric rating scales per item (e.g. 1–5 for naturalness).
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {scoringFields.map((f, i) => (
            <div
              key={i}
              className="flex flex-wrap items-start gap-3 rounded-lg border border-neutral-800 p-3"
            >
              <div className="w-36">
                <LnlInput
                  label="Name"
                  placeholder="Naturalness"
                  value={f.name}
                  onChange={(e) =>
                    updateScoringField(i, "name", e.target.value)
                  }
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
              <div className="min-w-0 flex-1">
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
      </LnlCard>

      <div className="flex items-center gap-3">
        <LnlButton size="sm" onClick={handleSave} loading={saving}>
          Save Task Settings
        </LnlButton>
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}

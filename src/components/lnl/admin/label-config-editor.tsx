"use client";

import { useState } from "react";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { LnlInput } from "@/components/lnl/ui/lnl-input";
import { LnlBadge } from "@/components/lnl/ui/lnl-badge";

export interface LabelConfig {
  name: string;
  color: string;
  description: string;
  shortcut_key: string;
}

const DEFAULT_COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"];

interface Props {
  value: LabelConfig[];
  onChange: (labels: LabelConfig[]) => void;
}

export function LabelConfigEditor({ value, onChange }: Props) {
  const [labels, setLabels] = useState<LabelConfig[]>(value);

  function update(newLabels: LabelConfig[]) {
    setLabels(newLabels);
    onChange(newLabels);
  }

  function addLabel() {
    if (labels.length >= 5) return;
    const idx = labels.length;
    update([
      ...labels,
      {
        name: "",
        color: DEFAULT_COLORS[idx] || "#6b7280",
        description: "",
        shortcut_key: String(idx + 1),
      },
    ]);
  }

  function removeLabel(index: number) {
    update(labels.filter((_, i) => i !== index));
  }

  function updateLabel(index: number, field: keyof LabelConfig, val: string) {
    const updated = labels.map((l, i) =>
      i === index ? { ...l, [field]: val } : l
    );
    update(updated);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-200">
          Labels ({labels.length}/5)
        </h3>
        <LnlButton
          variant="secondary"
          size="sm"
          onClick={addLabel}
          disabled={labels.length >= 5}
        >
          + Add Label
        </LnlButton>
      </div>

      {labels.length === 0 && (
        <p className="text-sm text-neutral-500">
          No labels configured. Add at least one label.
        </p>
      )}

      {labels.map((label, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3"
        >
          <div className="flex items-center gap-2 pt-6">
            <input
              type="color"
              value={label.color}
              onChange={(e) => updateLabel(i, "color", e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border border-neutral-700 bg-transparent"
            />
          </div>

          <div className="flex flex-1 gap-3">
            <div className="w-40">
              <LnlInput
                label="Name"
                placeholder="e.g. G2P Error"
                value={label.name}
                onChange={(e) => updateLabel(i, "name", e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="flex-1">
              <LnlInput
                label="Description"
                placeholder="Explain when to use this label"
                value={label.description}
                onChange={(e) => updateLabel(i, "description", e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="w-16">
              <LnlInput
                label="Key"
                value={label.shortcut_key}
                onChange={(e) =>
                  updateLabel(i, "shortcut_key", e.target.value.slice(0, 1))
                }
                maxLength={1}
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 pt-6">
            <LnlBadge color={label.color}>{label.name || "Label"}</LnlBadge>
            <button
              type="button"
              onClick={() => removeLabel(i)}
              className="text-xs text-neutral-500 transition-colors hover:text-red-400"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { LnlButton } from "@/components/lnl/ui/lnl-button";

export type TaskType = "blind_tests" | "manual" | "on_the_fly";

interface TaskTypeCard {
  type: TaskType;
  title: string;
  description: string;
  prerequisites: string;
}

const TASK_TYPES: TaskTypeCard[] = [
  {
    type: "blind_tests",
    title: "Create from Blind Tests",
    description: "No audio or text requirements.",
    prerequisites:
      "All items are sourced from completed blind tests (Falcon lost/won). Select model outcome and create.",
  },
  {
    type: "manual",
    title: "Create Manually",
    description: "Requires audio files and transcripts.",
    prerequisites:
      "Prepare a CSV with item_id, text, audio_filename columns, plus matching audio files (MP3, WAV). Keep them ready in this format, then upload after creating the task.",
  },
  {
    type: "on_the_fly",
    title: "Create on-the-fly",
    description: "No audio requirements.",
    prerequisites:
      "Upload a text file (.txt or .csv). Format: .txt = one line per item; .csv = text column required. Select a TTS model and language. Audio is generated automatically when the task is created.",
  },
];

interface Props {
  selectedType: TaskType | null;
  onSelect: (type: TaskType) => void;
}

export function TaskTypeSelector({
  selectedType,
  onSelect,
}: Props) {
  if (selectedType) return null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-neutral-100">Create a new task</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Choose how you want to create your task.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
        {TASK_TYPES.map((card) => (
          <div
            key={card.type}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(card.type)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(card.type)}
            className="cursor-pointer"
          >
          <LnlCard
            className="border-dashed transition-colors hover:border-neutral-600 hover:bg-neutral-900/50"
            padding="lg"
          >
            <h3 className="text-base font-semibold text-neutral-100">{card.title}</h3>
            <p className="mt-1 text-sm text-neutral-400">{card.description}</p>
            <p className="mt-2 text-xs text-neutral-500">{card.prerequisites}</p>
            <LnlButton variant="secondary" size="sm" className="mt-4">
              Select
            </LnlButton>
          </LnlCard>
          </div>
        ))}
      </div>
    </div>
  );
}

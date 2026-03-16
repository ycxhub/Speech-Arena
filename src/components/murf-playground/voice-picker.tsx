"use client";

import type { VoiceOption } from "@/app/pg/[slug]/actions";

interface Props {
  label: string;
  voices: VoiceOption[];
  value: string;
  onChange: (voiceId: string) => void;
  disabled?: boolean;
  voiceCount?: number;
}

export function VoicePicker({ label, voices, value, onChange, disabled, voiceCount }: Props) {
  const displayLabel =
    voiceCount !== undefined
      ? `${label} (${voiceCount} voice${voiceCount !== 1 ? "s" : ""} available)`
      : label;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="murf-label">{displayLabel}</label>
      <select
        className="murf-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || voices.length === 0}
      >
        {voices.length === 0 ? (
          <option value="">No voices available</option>
        ) : (
          <>
            <option value="">Select a voice</option>
            {voices.map((v) => (
              <option key={v.voiceId} value={v.voiceId}>
                {v.displayName} ({v.gender})
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  );
}

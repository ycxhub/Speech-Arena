"use client";

import type { VoiceOption } from "@/app/murf-playground/[slug]/actions";

interface Props {
  label: string;
  voices: VoiceOption[];
  value: string;
  onChange: (voiceId: string) => void;
  disabled?: boolean;
}

export function VoicePicker({ label, voices, value, onChange, disabled }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="murf-label">{label}</label>
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

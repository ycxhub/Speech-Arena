"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

const DEFAULT_MAX = 1000;

export function TextInput({
  value,
  onChange,
  maxLength = DEFAULT_MAX,
  disabled,
}: Props) {
  const remaining = maxLength - value.length;
  const isOver = remaining < 0;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="murf-label">Enter text to synthesize</label>
      <textarea
        className="murf-textarea"
        placeholder="Type or paste a sentence here..."
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= maxLength) {
            onChange(e.target.value);
          }
        }}
        disabled={disabled}
        rows={3}
      />
      <div className="flex justify-end">
        <span
          className="text-xs tabular-nums"
          style={{
            color: isOver
              ? "var(--murf-pink)"
              : remaining < 100
                ? "var(--murf-accent)"
                : "var(--murf-text-muted)",
          }}
        >
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}

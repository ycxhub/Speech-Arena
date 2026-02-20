"use client";

import { cn } from "@/lib/utils";

export interface LnlToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function LnlToggle({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: LnlToggleProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2.5",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-neutral-950",
          checked ? "bg-blue-600" : "bg-neutral-700"
        )}
      >
        <span
          className={cn(
            "inline-block size-3.5 rounded-full bg-white transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-[3px]"
          )}
        />
      </button>
      {label && (
        <span className="text-sm text-neutral-300">{label}</span>
      )}
    </label>
  );
}

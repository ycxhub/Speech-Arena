import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface LnlInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const LnlInput = forwardRef<HTMLInputElement, LnlInputProps>(
  function LnlInput({ label, error, helperText, className, id, ...props }, ref) {
    const inputId =
      id ?? (label ? `lnl-input-${label.replace(/\s/g, "-").toLowerCase()}` : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-neutral-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100",
            "placeholder:text-neutral-500",
            "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30",
            "transition-colors",
            error && "border-red-500/60 focus:border-red-500 focus:ring-red-500/30",
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [error && `${inputId}-error`, helperText && `${inputId}-helper`]
              .filter(Boolean)
              .join(" ") || undefined
          }
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-xs text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

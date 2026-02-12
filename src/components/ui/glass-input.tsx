import { cn } from "@/lib/utils";

export interface GlassInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function GlassInput({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}: GlassInputProps) {
  const inputId = id ?? (label ? `glass-input-${label.replace(/\s/g, "-")}` : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-white/80"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/30",
          "focus:border-accent-blue/50 focus:outline-none focus:ring-1 focus:ring-accent-blue/30",
          "transition-colors",
          error && "border-accent-red/50 focus:border-accent-red/50 focus:ring-accent-red/30",
          className
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [error && "glass-input-error", helperText && "glass-input-helper"]
            .filter(Boolean)
            .join(" ") || undefined
        }
        {...props}
      />
      {error && (
        <p
          id="glass-input-error"
          className="mt-1.5 text-sm text-accent-red"
          role="alert"
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p
          id="glass-input-helper"
          className="mt-1.5 text-sm text-white/60"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";

export interface GlassSelectOption {
  value: string;
  label: string;
}

export interface GlassSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  options: GlassSelectOption[];
  placeholder?: string;
}

export function GlassSelect({
  label,
  error,
  options,
  placeholder,
  className,
  id,
  value,
  onChange,
  ...props
}: GlassSelectProps) {
  const selectId =
    id ?? (label ? `glass-select-${label.replace(/\s/g, "-")}` : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-white/80"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white",
          "focus:border-accent-blue/50 focus:outline-none focus:ring-1 focus:ring-accent-blue/30",
          "transition-colors",
          "[&>option]:bg-[#0a0a0a] [&>option]:text-white",
          error &&
            "border-accent-red/50 focus:border-accent-red/50 focus:ring-accent-red/30",
          className
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "glass-select-error" : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p
          id="glass-select-error"
          className="mt-1.5 text-sm text-accent-red"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

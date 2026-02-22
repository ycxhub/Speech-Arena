import { cn } from "@/lib/utils";

export interface LnlSelectOption {
  value: string;
  label: string;
}

export interface LnlSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: React.ReactNode;
  error?: string;
  options: LnlSelectOption[];
  placeholder?: string;
}

export function LnlSelect({
  label,
  error,
  options,
  placeholder,
  className,
  id,
  value,
  onChange,
  ...props
}: LnlSelectProps) {
  const selectId =
    id ??
    (typeof label === "string"
      ? `lnl-select-${label.replace(/\s/g, "-").toLowerCase()}`
      : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-neutral-300"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        className={cn(
          "w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100",
          "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30",
          "transition-colors",
          "[&>option]:bg-neutral-800 [&>option]:text-neutral-100",
          error && "border-red-500/60 focus:border-red-500 focus:ring-red-500/30",
          className
        )}
        aria-invalid={error ? true : undefined}
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
        <p className="mt-1 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

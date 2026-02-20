import { cn } from "@/lib/utils";

export interface LnlProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function LnlProgress({
  value,
  max = 100,
  label,
  showPercentage = false,
  size = "md",
  className,
}: LnlProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercentage) && (
        <div className="mb-1.5 flex items-center justify-between text-xs text-neutral-400">
          {label && <span>{label}</span>}
          {showPercentage && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-neutral-800",
          size === "sm" ? "h-1.5" : "h-2.5"
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            "h-full rounded-full bg-blue-600 transition-all duration-300 ease-out",
            percentage === 100 && "bg-emerald-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

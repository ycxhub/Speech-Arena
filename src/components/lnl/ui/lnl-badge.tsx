import { cn } from "@/lib/utils";

export type LnlBadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info";

export interface LnlBadgeProps {
  variant?: LnlBadgeVariant;
  color?: string;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<LnlBadgeVariant, string> = {
  default: "bg-neutral-800 text-neutral-300 border-neutral-700",
  success: "bg-emerald-950 text-emerald-400 border-emerald-800",
  warning: "bg-amber-950 text-amber-400 border-amber-800",
  error: "bg-red-950 text-red-400 border-red-800",
  info: "bg-blue-950 text-blue-400 border-blue-800",
};

export function LnlBadge({
  variant = "default",
  color,
  className,
  children,
}: LnlBadgeProps) {
  const style = color
    ? {
        backgroundColor: `${color}18`,
        color,
        borderColor: `${color}40`,
      }
    : undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        !color && variantStyles[variant],
        className
      )}
      style={style}
    >
      {children}
    </span>
  );
}

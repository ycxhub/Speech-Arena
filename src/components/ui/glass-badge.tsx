import { cn } from "@/lib/utils";

const _ACCENT_COLORS = [
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
  "red",
] as const;

export type AccentColor = (typeof _ACCENT_COLORS)[number];

const accentStyles: Record<AccentColor, string> = {
  blue: "bg-accent-blue/10 text-accent-blue",
  green: "bg-accent-green/10 text-accent-green",
  yellow: "bg-accent-yellow/10 text-accent-yellow",
  orange: "bg-accent-orange/10 text-accent-orange",
  purple: "bg-accent-purple/10 text-accent-purple",
  red: "bg-accent-red/10 text-accent-red",
};

export interface GlassBadgeProps {
  color?: AccentColor;
  className?: string;
  children: React.ReactNode;
}

export function GlassBadge({
  color = "blue",
  className,
  children,
}: GlassBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        accentStyles[color],
        className
      )}
    >
      {children}
    </span>
  );
}

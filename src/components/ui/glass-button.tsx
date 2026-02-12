"use client";

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

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  accent?: AccentColor;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const accentMap: Record<
  AccentColor,
  { primary: string; secondary: string; ghost: string }
> = {
  blue: {
    primary: "border border-transparent bg-accent-blue text-white",
    secondary:
      "border border-accent-blue text-accent-blue bg-white/5 backdrop-blur-xl hover:bg-accent-blue/10",
    ghost: "border-transparent text-accent-blue hover:bg-accent-blue/10",
  },
  green: {
    primary: "border border-transparent bg-accent-green text-white",
    secondary:
      "border border-accent-green text-accent-green bg-white/5 backdrop-blur-xl hover:bg-accent-green/10",
    ghost: "border-transparent text-accent-green hover:bg-accent-green/10",
  },
  yellow: {
    primary: "border border-transparent bg-accent-yellow text-white",
    secondary:
      "border border-accent-yellow text-accent-yellow bg-white/5 backdrop-blur-xl hover:bg-accent-yellow/10",
    ghost: "border-transparent text-accent-yellow hover:bg-accent-yellow/10",
  },
  orange: {
    primary: "border border-transparent bg-accent-orange text-white",
    secondary:
      "border border-accent-orange text-accent-orange bg-white/5 backdrop-blur-xl hover:bg-accent-orange/10",
    ghost: "border-transparent text-accent-orange hover:bg-accent-orange/10",
  },
  purple: {
    primary: "border border-transparent bg-accent-purple text-white",
    secondary:
      "border border-accent-purple text-accent-purple bg-white/5 backdrop-blur-xl hover:bg-accent-purple/10",
    ghost: "border-transparent text-accent-purple hover:bg-accent-purple/10",
  },
  red: {
    primary: "border border-transparent bg-accent-red text-white",
    secondary:
      "border border-accent-red text-accent-red bg-white/5 backdrop-blur-xl hover:bg-accent-red/10",
    ghost: "border-transparent text-accent-red hover:bg-accent-red/10",
  },
};

const sizeMap = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
} as const;

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function GlassButton({
  variant = "primary",
  accent = "blue",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  className,
  children,
  ...props
}: GlassButtonProps) {
  const accentStyles = accentMap[accent];
  const variantStyles = accentStyles[variant];

  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]";

  const disabledStyles =
    "cursor-not-allowed opacity-50 pointer-events-none";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        baseStyles,
        variantStyles,
        sizeMap[size],
        (disabled || loading) && disabledStyles,
        className
      )}
      {...props}
    >
      {loading ? (
        <Spinner className="size-5" />
      ) : (
        children
      )}
    </button>
  );
}

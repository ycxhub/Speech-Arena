"use client";

import { cn } from "@/lib/utils";

export interface LnlButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 border-blue-600",
  secondary:
    "bg-neutral-800 text-neutral-100 hover:bg-neutral-700 active:bg-neutral-600 border-neutral-700",
  ghost:
    "bg-transparent text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 border-transparent",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border-red-600",
};

const sizeStyles: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

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

export function LnlButton({
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className,
  children,
  ...props
}: LnlButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-neutral-950",
        variantStyles[variant],
        sizeStyles[size],
        (disabled || loading) && "cursor-not-allowed opacity-50 pointer-events-none",
        className
      )}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : children}
    </button>
  );
}

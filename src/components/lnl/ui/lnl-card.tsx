import { cn } from "@/lib/utils";

export interface LnlCardProps {
  padding?: "sm" | "md" | "lg" | "none";
  className?: string;
  children: React.ReactNode;
}

const paddingStyles: Record<string, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

export function LnlCard({
  padding = "md",
  className,
  children,
}: LnlCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-800 bg-neutral-900",
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

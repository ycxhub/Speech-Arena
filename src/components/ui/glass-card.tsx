import { cn } from "@/lib/utils";

export interface GlassCardProps {
  className?: string;
  children: React.ReactNode;
}

export function GlassCard({ className, children }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

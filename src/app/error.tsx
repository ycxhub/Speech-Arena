"use client";

import { useEffect } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <GlassCard className="flex flex-col items-center gap-6 text-center">
        <h2 className="text-xl font-semibold text-white">
          Something went wrong
        </h2>
        <p className="max-w-md text-white/60">
          We encountered an unexpected error. Please try again.
        </p>
        <GlassButton onClick={reset} accent="blue">
          Try Again
        </GlassButton>
      </GlassCard>
    </div>
  );
}

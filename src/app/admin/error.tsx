"use client";

import { useEffect } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";

/**
 * Admin-specific error boundary that shows the actual error message
 * for debugging purposes. This will be removed after the issue is resolved.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <GlassCard className="flex flex-col items-center gap-6 text-center">
        <h2 className="text-xl font-semibold text-white">
          Admin Page Error
        </h2>
        <p className="max-w-md text-white/60">
          {error.message || "Unknown error"}
        </p>
        {error.digest && (
          <p className="text-xs text-white/40">Digest: {error.digest}</p>
        )}
        <GlassButton onClick={reset} accent="blue">
          Try Again
        </GlassButton>
      </GlassCard>
    </div>
  );
}

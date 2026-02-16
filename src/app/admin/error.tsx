"use client";

import { useEffect } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";

const CHUNK_ERROR_KEY = "chunk-error-refreshed";

function isChunkLoadError(error: Error): boolean {
  return (
    error?.name === "ChunkLoadError" ||
    (typeof error?.message === "string" && error.message.includes("Loading chunk"))
  );
}

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error);

    // Chunk load errors often happen after deployment when cached HTML references old chunks.
    // Auto-reload once to fetch fresh chunks.
    if (isChunkLoadError(error)) {
      try {
        const alreadyRefreshed = sessionStorage.getItem(CHUNK_ERROR_KEY);
        if (!alreadyRefreshed) {
          sessionStorage.setItem(CHUNK_ERROR_KEY, "true");
          window.location.reload();
          return;
        }
      } catch {
        // sessionStorage may be unavailable
      }
    }
  }, [error]);

  const handleRetry = () => {
    if (isChunkLoadError(error)) {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <GlassCard className="flex flex-col items-center gap-6 text-center">
        <h2 className="text-xl font-semibold text-white">
          Admin Page Error
        </h2>
        <p className="max-w-md text-white/60">
          {isChunkLoadError(error)
            ? "A script failed to load, often after a new deployment. Refreshing the page usually fixes it."
            : error.message || "Unknown error"}
        </p>
        {error.digest && !isChunkLoadError(error) && (
          <p className="text-xs text-white/40">Digest: {error.digest}</p>
        )}
        <GlassButton onClick={handleRetry} accent="blue">
          {isChunkLoadError(error) ? "Refresh page" : "Try Again"}
        </GlassButton>
      </GlassCard>
    </div>
  );
}

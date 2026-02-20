"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  ipaText?: string | null;
  normalizedText?: string | null;
  metadata?: Record<string, unknown>;
  enabledFields: {
    show_ipa: boolean;
    show_normalized_text: boolean;
  };
}

export function AdditionalFields({
  ipaText,
  normalizedText,
  metadata,
  enabledFields,
}: Props) {
  const [showIpa, setShowIpa] = useState(false);
  const [showNormalized, setShowNormalized] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  const hasIpa = enabledFields.show_ipa && !!ipaText;
  const hasNormalized = enabledFields.show_normalized_text && !!normalizedText;
  const metaEntries = metadata ? Object.entries(metadata).filter(([, v]) => v != null) : [];
  const hasMetadata = metaEntries.length > 0;

  if (!hasIpa && !hasNormalized && !hasMetadata) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {hasIpa && (
          <button
            type="button"
            onClick={() => setShowIpa(!showIpa)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs transition-colors",
              showIpa
                ? "border-blue-600 bg-blue-950 text-blue-400"
                : "border-neutral-700 text-neutral-500 hover:text-neutral-300"
            )}
          >
            IPA
          </button>
        )}
        {hasNormalized && (
          <button
            type="button"
            onClick={() => setShowNormalized(!showNormalized)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs transition-colors",
              showNormalized
                ? "border-blue-600 bg-blue-950 text-blue-400"
                : "border-neutral-700 text-neutral-500 hover:text-neutral-300"
            )}
          >
            Normalized
          </button>
        )}
        {hasMetadata && (
          <button
            type="button"
            onClick={() => setShowMetadata(!showMetadata)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs transition-colors",
              showMetadata
                ? "border-blue-600 bg-blue-950 text-blue-400"
                : "border-neutral-700 text-neutral-500 hover:text-neutral-300"
            )}
          >
            Metadata
          </button>
        )}
      </div>

      {showIpa && ipaText && (
        <div className="rounded-md border border-neutral-800 bg-neutral-900/50 px-3 py-2 font-mono text-sm text-neutral-300">
          {ipaText}
        </div>
      )}

      {showNormalized && normalizedText && (
        <div className="rounded-md border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-300">
          {normalizedText}
        </div>
      )}

      {showMetadata && metaEntries.length > 0 && (
        <div className="rounded-md border border-neutral-800 bg-neutral-900/50 px-3 py-2">
          {metaEntries.map(([key, val]) => (
            <div key={key} className="flex gap-2 text-xs">
              <span className="text-neutral-500">{key}:</span>
              <span className="text-neutral-300">{String(val)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

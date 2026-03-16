"use client";

import { useState } from "react";
import type { SampleSentence } from "@/app/pg/[slug]/actions";

interface Props {
  sentences: SampleSentence[];
  onSelect: (text: string) => void;
}

export function SentenceBucket({ sentences, onSelect }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyAllDone, setCopyAllDone] = useState(false);

  const handleCopyAll = () => {
    if (sentences.length === 0) return;
    const text = sentences.map((s) => s.text).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopyAllDone(true);
      setTimeout(() => setCopyAllDone(false), 2000);
    });
  };

  if (sentences.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl py-12"
        style={{ background: "var(--murf-bg-secondary)" }}
      >
        <p style={{ color: "var(--murf-text-muted)" }} className="text-sm">
          No sample sentences for this language yet.
        </p>
      </div>
    );
  }

  const handleCopy = (sentence: SampleSentence) => {
    onSelect(sentence.text);
    setCopiedId(sentence.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          className="murf-btn murf-btn-ghost murf-btn-sm"
          onClick={handleCopyAll}
        >
          {copyAllDone ? "Copied!" : "Copy all"}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
      {sentences.map((s) => (
        <button
          key={s.id}
          type="button"
          className="murf-card-secondary group relative cursor-pointer p-4 text-left transition-all hover:border-[var(--murf-accent)] hover:shadow-sm"
          onClick={() => handleCopy(s)}
        >
          <p className="pr-8 text-sm leading-relaxed" style={{ color: "var(--murf-text)" }}>
            {s.text}
          </p>
          <span
            className="absolute right-3 top-3 text-xs font-medium transition-colors"
            style={{
              color: copiedId === s.id ? "var(--murf-success)" : "var(--murf-text-muted)",
            }}
          >
            {copiedId === s.id ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
            )}
          </span>
        </button>
      ))}
      </div>
    </div>
  );
}

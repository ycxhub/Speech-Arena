"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface UseAutoSaveOptions {
  enabled?: boolean;
  delayMs?: number;
  maxRetries?: number;
}

const RETRY_DELAYS = [1000, 2000, 4000];

/**
 * Debounced auto-save hook.
 * Retries on failure with exponential backoff (up to 3 attempts).
 * Saves immediately on unmount.
 */
export function useAutoSave<T>(
  saveFunction: (data: T) => Promise<{ error?: string }>,
  data: T,
  options: UseAutoSaveOptions | number = 1000
) {
  const opts =
    typeof options === "number"
      ? { enabled: true, delayMs: options, maxRetries: 3 }
      : { enabled: true, delayMs: 1000, maxRetries: 3, ...options };

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef(data);
  const saveFnRef = useRef(saveFunction);

  dataRef.current = data;
  saveFnRef.current = saveFunction;

  const performSave = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsSaving(true);
    setError(null);
    let lastErr: string | undefined;

    for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
      const result = await saveFnRef.current(dataRef.current);
      if (!result.error) {
        setLastSavedAt(new Date());
        setError(null);
        setIsSaving(false);
        return result;
      }
      lastErr = result.error;
      if (attempt < opts.maxRetries - 1) {
        setError(`Save failed — retrying (${attempt + 1}/${opts.maxRetries})...`);
        await new Promise((r) =>
          setTimeout(r, RETRY_DELAYS[attempt] ?? 4000)
        );
      }
    }

    setError(lastErr ?? "Save failed");
    setIsSaving(false);
    return { error: lastErr };
  }, [opts.maxRetries]);

  const flushNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (opts.enabled) performSave();
  }, [opts.enabled, performSave]);

  useEffect(() => {
    if (!opts.enabled) return;

    timerRef.current = setTimeout(performSave, opts.delayMs);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (opts.enabled) performSave();
    };
  }, [data, opts.enabled, opts.delayMs, performSave]);

  return { isSaving, lastSavedAt, error, flushNow };
}

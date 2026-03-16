"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useWavesurfer } from "@wavesurfer/react";

interface Props {
  label: string;
  audioUrl: string | null;
  loading?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function MurfAudioPlayer({ label, audioUrl, loading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState(1);
  const [loadError, setLoadError] = useState(false);

  const { wavesurfer, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    url: audioUrl ?? undefined,
    waveColor: "#E7E4F2",
    progressColor: "#6642B3",
    cursorColor: "#42208A",
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    height: 64,
    normalize: true,
    plugins: useMemo(() => [], []),
  });

  useEffect(() => {
    setLoadError(false);
  }, [audioUrl]);

  useEffect(() => {
    if (!wavesurfer) return;
    const onError = () => setLoadError(true);
    wavesurfer.on("error", onError);
    return () => {
      wavesurfer.un("error", onError);
    };
  }, [wavesurfer]);

  const togglePlay = useCallback(() => wavesurfer?.playPause(), [wavesurfer]);

  const skipForward = useCallback(() => {
    if (!wavesurfer) return;
    wavesurfer.setTime(
      Math.min(wavesurfer.getCurrentTime() + 2, wavesurfer.getDuration())
    );
  }, [wavesurfer]);

  const skipBackward = useCallback(() => {
    if (!wavesurfer) return;
    wavesurfer.setTime(Math.max(wavesurfer.getCurrentTime() - 2, 0));
  }, [wavesurfer]);

  const restart = useCallback(() => wavesurfer?.setTime(0), [wavesurfer]);

  const changeSpeed = useCallback(() => {
    const idx = SPEED_OPTIONS.indexOf(speed);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length]!;
    setSpeed(next);
    wavesurfer?.setPlaybackRate(next);
  }, [wavesurfer, speed]);

  const duration = wavesurfer?.getDuration() ?? 0;

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (!audioUrl && !loading) {
    return (
      <div className="murf-card flex flex-col gap-3 p-5">
        <span className="text-sm font-semibold" style={{ color: "var(--murf-accent)" }}>
          {label}
        </span>
        <div
          className="flex h-16 items-center justify-center rounded-lg"
          style={{ background: "var(--murf-bg-secondary)" }}
        >
          <span className="text-sm" style={{ color: "var(--murf-text-muted)" }}>
            Enter text and click Generate
          </span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="murf-card flex flex-col gap-3 p-5">
        <span className="text-sm font-semibold" style={{ color: "var(--murf-accent)" }}>
          {label}
        </span>
        <div
          className="flex h-16 items-center justify-center rounded-lg"
          style={{ background: "var(--murf-bg-secondary)" }}
        >
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              style={{ color: "var(--murf-accent)" }}
              fill="none"
              viewBox="0 0 24 24"
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-sm" style={{ color: "var(--murf-text-muted)" }}>
              Generating audio...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="murf-card flex flex-col gap-3 p-5">
        <span className="text-sm font-semibold" style={{ color: "var(--murf-accent)" }}>
          {label}
        </span>
        <div
          className="flex h-16 items-center justify-center rounded-lg"
          style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
        >
          <span className="text-sm text-red-600">Failed to load audio</span>
        </div>
      </div>
    );
  }

  return (
    <div className="murf-card flex flex-col gap-3 p-5">
      <span className="text-sm font-semibold" style={{ color: "var(--murf-accent)" }}>
        {label}
      </span>

      <div ref={containerRef} className="w-full" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="murf-btn murf-btn-ghost murf-btn-sm"
            onClick={restart}
            title="Restart"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </button>
          <button
            type="button"
            className="murf-btn murf-btn-ghost murf-btn-sm"
            onClick={skipBackward}
            title="Skip back 2s"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062a1.125 1.125 0 011.683.977v8.123z" />
            </svg>
          </button>
          <button
            type="button"
            className={`murf-btn murf-btn-sm ${isPlaying ? "murf-btn-secondary" : "murf-btn-primary"}`}
            onClick={togglePlay}
            title="Play / Pause"
          >
            {isPlaying ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="murf-btn murf-btn-ghost murf-btn-sm"
            onClick={skipForward}
            title="Skip forward 2s"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
            </svg>
          </button>
        </div>

        <span
          className="text-xs tabular-nums"
          style={{ color: "var(--murf-text-muted)" }}
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <button
          type="button"
          onClick={changeSpeed}
          className="murf-btn murf-btn-secondary murf-btn-sm tabular-nums"
        >
          {speed}x
        </button>
      </div>
    </div>
  );
}

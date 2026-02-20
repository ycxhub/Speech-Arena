"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import { LnlButton } from "@/components/lnl/ui/lnl-button";

interface Props {
  audioUrl: string;
  onTimeUpdate?: (currentTime: number) => void;
  onReady?: (duration: number) => void;
  onSeek?: (time: number) => void;
  onError?: (error: Error) => void;
  onSkipItem?: () => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function AudioPlayer({
  audioUrl,
  onTimeUpdate,
  onReady,
  onSeek,
  onError,
  onSkipItem,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState(1);
  const [loadError, setLoadError] = useState<Error | null>(null);

  const { wavesurfer, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    url: audioUrl,
    waveColor: "#525252",
    progressColor: "#3b82f6",
    cursorColor: "#60a5fa",
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    height: 64,
    normalize: true,
    plugins: useMemo(() => [], []),
  });

  useEffect(() => {
    setLoadError(null);
  }, [audioUrl]);

  useEffect(() => {
    if (!wavesurfer) return;

    const handleReady = () => {
      setLoadError(null);
      onReady?.(wavesurfer.getDuration());
    };
    const handleError = (err: Error) => {
      setLoadError(err);
      onError?.(err);
    };
    const handleTimeUpdate = (time: number) => {
      onTimeUpdate?.(time);
    };
    const handleSeek = () => {
      onSeek?.(wavesurfer.getCurrentTime());
    };

    wavesurfer.on("ready", handleReady);
    wavesurfer.on("error", handleError);
    wavesurfer.on("timeupdate", handleTimeUpdate);
    wavesurfer.on("seeking", handleSeek);

    return () => {
      wavesurfer.un("ready", handleReady);
      wavesurfer.un("error", handleError);
      wavesurfer.un("timeupdate", handleTimeUpdate);
      wavesurfer.un("seeking", handleSeek);
    };
  }, [wavesurfer, onReady, onError, onTimeUpdate, onSeek]);

  const togglePlay = useCallback(() => {
    wavesurfer?.playPause();
  }, [wavesurfer]);

  const skipForward = useCallback(() => {
    if (!wavesurfer) return;
    wavesurfer.setTime(Math.min(wavesurfer.getCurrentTime() + 2, wavesurfer.getDuration()));
  }, [wavesurfer]);

  const skipBackward = useCallback(() => {
    if (!wavesurfer) return;
    wavesurfer.setTime(Math.max(wavesurfer.getCurrentTime() - 2, 0));
  }, [wavesurfer]);

  const restart = useCallback(() => {
    wavesurfer?.setTime(0);
  }, [wavesurfer]);

  const changeSpeed = useCallback(() => {
    const idx = SPEED_OPTIONS.indexOf(speed);
    const nextSpeed = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setSpeed(nextSpeed);
    wavesurfer?.setPlaybackRate(nextSpeed);
  }, [wavesurfer, speed]);

  useEffect(() => {
    const onPlayPause = () => togglePlay();
    const onSkipFwd = () => skipForward();
    const onSkipBwd = () => skipBackward();
    const onRestart = () => restart();

    window.addEventListener("lnl-shortcut-playpause", onPlayPause);
    window.addEventListener("lnl-shortcut-skipforward", onSkipFwd);
    window.addEventListener("lnl-shortcut-skipbackward", onSkipBwd);
    window.addEventListener("lnl-shortcut-restart", onRestart);

    return () => {
      window.removeEventListener("lnl-shortcut-playpause", onPlayPause);
      window.removeEventListener("lnl-shortcut-skipforward", onSkipFwd);
      window.removeEventListener("lnl-shortcut-skipbackward", onSkipBwd);
      window.removeEventListener("lnl-shortcut-restart", onRestart);
    };
  }, [togglePlay, skipForward, skipBackward, restart]);

  const duration = wavesurfer?.getDuration() ?? 0;

  if (loadError) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-red-900/50 bg-neutral-900 p-4">
        <p className="text-sm text-red-400">
          Audio failed to load: {loadError.message}
        </p>
        <p className="text-xs text-neutral-500">
          The file may be missing, corrupted, or inaccessible. You can skip this
          item and continue.
        </p>
        {onSkipItem && (
          <LnlButton variant="secondary" size="sm" onClick={onSkipItem}>
            Skip Item
          </LnlButton>
        )}
      </div>
    );
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div ref={containerRef} className="w-full" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <LnlButton variant="ghost" size="sm" onClick={restart} title="Restart (Ctrl+Home)">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </LnlButton>
          <LnlButton variant="ghost" size="sm" onClick={skipBackward} title="Skip back 2s (←)">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062a1.125 1.125 0 011.683.977v8.123z" />
            </svg>
          </LnlButton>
          <LnlButton
            variant={isPlaying ? "secondary" : "primary"}
            size="sm"
            onClick={togglePlay}
            title="Play/Pause (Space)"
          >
            {isPlaying ? (
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            ) : (
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            )}
          </LnlButton>
          <LnlButton variant="ghost" size="sm" onClick={skipForward} title="Skip forward 2s (→)">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
            </svg>
          </LnlButton>
        </div>

        <span className="text-xs tabular-nums text-neutral-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <button
          type="button"
          onClick={changeSpeed}
          className="rounded-md border border-neutral-700 px-2 py-1 text-xs tabular-nums text-neutral-300 transition-colors hover:bg-neutral-800"
        >
          {speed}x
        </button>
      </div>
    </div>
  );
}

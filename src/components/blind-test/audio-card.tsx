"use client";

import { useRef, useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { cn } from "@/lib/utils";

const MIN_LISTEN_MS = 3000;

export interface AudioCardProps {
  label: "A" | "B";
  audioUrl: string | null;
  loading?: boolean;
  error?: boolean;
  accent?: "blue" | "purple";
  listenTimeMs: number;
  onListenTimeUpdate?: (deltaMs: number) => void;
  onError?: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioCard({
  label,
  audioUrl,
  loading = false,
  error = false,
  accent = "blue",
  listenTimeMs,
  onListenTimeUpdate,
  onError,
}: AudioCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastTimeRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [canPlay, setCanPlay] = useState(false);

  const accentBorder =
    accent === "blue"
      ? "border-l-4 border-accent-blue/50"
      : "border-l-4 border-accent-purple/50";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const handleCanPlay = () => setCanPlay(true);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => {
      const now = performance.now();
      const t = audio.currentTime;
      setCurrentTime(t);
      if (onListenTimeUpdate && !audio.paused) {
        const deltaMs = now - lastTimeRef.current;
        lastTimeRef.current = now;
        if (deltaMs > 0 && deltaMs < 2000) onListenTimeUpdate(deltaMs);
      }
    };
    const handlePlay = () => {
      setIsPlaying(true);
      lastTimeRef.current = performance.now();
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setIsPlaying(false);
      setCanPlay(false);
      onError?.();
    };

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [audioUrl, onListenTimeUpdate, onError]);

  useEffect(() => {
    setIsPlaying(false); // Reset when URL changes; browser may not fire pause/ended on src change
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      setCanPlay(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    // Use actual audio state so button works even if React state got out of sync
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const listenProgress = Math.min(100, (listenTimeMs / MIN_LISTEN_MS) * 100);
  const isReadyToVote = listenTimeMs >= MIN_LISTEN_MS;

  if (error) {
    return (
      <GlassCard className={cn("flex min-h-[200px] flex-col", accentBorder)}>
        <span className="text-6xl font-bold text-white/20">{label}</span>
        <p className="mt-4 text-accent-red">Audio failed to load</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={cn("flex min-h-[200px] flex-col", accentBorder)}>
      <span className="text-6xl font-bold text-white/20">{label}</span>

      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="auto" className="hidden" />
      )}

      {loading || (!canPlay && audioUrl && !error) ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-full bg-white/20" />
          <p className="text-sm text-white/60">Loading...</p>
        </div>
      ) : (
        <div className="mt-4 flex w-full flex-col items-center gap-3">
          <GlassButton
            size="lg"
            accent={accent}
            onClick={togglePlay}
            disabled={!audioUrl}
          >
            {isPlaying ? "Pause" : "Play"}
          </GlassButton>
          <div className="w-full max-w-[200px]">
            <div className="mb-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-white/40 transition-all duration-150"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <p className="text-center text-sm text-white/60">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            {isReadyToVote ? (
              <>
                <span className="text-accent-green">✓</span>
                <p className="text-sm text-accent-green">Ready to vote</p>
              </>
            ) : (
              <>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-accent-blue/60 transition-all duration-150"
                    style={{ width: `${listenProgress}%` }}
                  />
                </div>
                <p className="text-sm text-white/60">
                  Listen for {Math.ceil((MIN_LISTEN_MS - listenTimeMs) / 1000)} more seconds
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

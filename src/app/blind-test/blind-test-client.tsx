"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassSelect } from "@/components/ui/glass-select";
import { AudioCard } from "@/components/blind-test/audio-card";
import {
  prepareNextRoundAction,
  markRoundInvalid,
  submitVote,
  type LanguageOption,
} from "./actions";
import { toast } from "sonner";

const LANGUAGE_STORAGE_KEY = "blind-test-language-id";

interface BlindTestClientProps {
  userId: string;
  languages: LanguageOption[];
  initialCompletedRounds: number;
}

type RoundData = {
  testEventId: string;
  sentence: string;
  audioA: string;
  audioB: string;
};

export function BlindTestClient({
  userId: _userId,
  languages,
  initialCompletedRounds,
}: BlindTestClientProps) {
  const [languageId, setLanguageId] = useState<string>("");
  const [completedRoundsCount, setCompletedRoundsCount] =
    useState(initialCompletedRounds);
  const [round, setRound] = useState<RoundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [listenTimeA, setListenTimeA] = useState(0);
  const [listenTimeB, setListenTimeB] = useState(0);
  const [voting, setVoting] = useState(false);
  const [errorA, setErrorA] = useState(false);
  const [errorB, setErrorB] = useState(false);
  const [voteFlash, setVoteFlash] = useState<"A" | "B" | null>(null);

  const [prefetchedRound, setPrefetchedRound] = useState<{
    languageId: string;
    round: RoundData;
  } | null>(null);
  const prefetchInFlightRef = useRef(false);

  const startPrefetch = useCallback((langId: string) => {
    if (prefetchInFlightRef.current) return;
    prefetchInFlightRef.current = true;
    prepareNextRoundAction(langId)
      .then(({ data, error }) => {
        prefetchInFlightRef.current = false;
        if (error || !data) return;
        setPrefetchedRound({
          languageId: langId,
          round: {
            testEventId: data.testEventId,
            sentence: data.sentence.text,
            audioA: data.audioA.url,
            audioB: data.audioB.url,
          },
        });
      })
      .catch(() => {
        prefetchInFlightRef.current = false;
      });
  }, []);

  const loadRound = useCallback(
    async (langId: string) => {
      setLoading(true);
      setRound(null);
      setListenTimeA(0);
      setListenTimeB(0);
      setErrorA(false);
      setErrorB(false);
      const { data, error } = await prepareNextRoundAction(langId);
      setLoading(false);
      if (error) {
        toast.error(error);
        return;
      }
      if (data) {
        setRound({
          testEventId: data.testEventId,
          sentence: data.sentence.text,
          audioA: data.audioA.url,
          audioB: data.audioB.url,
        });
        startPrefetch(langId);
      }
    },
    [startPrefetch]
  );

  useEffect(() => {
    if (languages.length === 0) return;
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
    const defaultId =
      stored && languages.some((l) => l.id === stored) ? stored : languages[0]!.id;
    setLanguageId(defaultId);
    loadRound(defaultId);
  }, [languages, loadRound]);

  useEffect(() => {
    if (languageId) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, languageId);
    }
  }, [languageId]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id) {
      setPrefetchedRound(null);
      setLanguageId(id);
      loadRound(id);
    }
  };

  const handleVote = async (winner: "A" | "B") => {
    if (!round || voting) return;
    const canVote = listenTimeA >= 3000 && listenTimeB >= 3000;
    if (!canVote) return;

    setVoting(true);
    setVoteFlash(winner);

    const { error } = await submitVote(
      round.testEventId,
      winner,
      listenTimeA,
      listenTimeB
    );

    if (error) {
      toast.error("Failed to submit vote. Retrying...");
      const { error: retryError } = await submitVote(
        round.testEventId,
        winner,
        listenTimeA,
        listenTimeB
      );
      if (retryError) {
        toast.error("Vote could not be submitted. Please check your connection.");
        setVoting(false);
        setVoteFlash(null);
        return;
      }
    }

    toast.success("Vote recorded");
    setCompletedRoundsCount((n) => n + 1);
    setTimeout(() => {
      setVoteFlash(null);
      setVoting(false);
    }, 500);

    if (prefetchedRound && prefetchedRound.languageId === languageId) {
      setRound(prefetchedRound.round);
      setPrefetchedRound(null);
      setListenTimeA(0);
      setListenTimeB(0);
      setErrorA(false);
      setErrorB(false);
      startPrefetch(languageId);
    } else {
      loadRound(languageId);
    }
  };

  const handleSkipRound = async () => {
    if (!round || voting) return;
    setVoting(true);
    const { error } = await markRoundInvalid(round.testEventId);
    if (error) {
      toast.error(error);
      setVoting(false);
    } else {
      setErrorA(false);
      setErrorB(false);
      setCompletedRoundsCount((n) => n + 1);
      if (prefetchedRound && prefetchedRound.languageId === languageId) {
        setRound(prefetchedRound.round);
        setPrefetchedRound(null);
        setListenTimeA(0);
        setListenTimeB(0);
        startPrefetch(languageId);
      } else {
        loadRound(languageId);
      }
      setVoting(false);
    }
  };

  const canVote = listenTimeA >= 3000 && listenTimeB >= 3000 && !voting;
  const showSkip = errorA || errorB;

  const languageOptions = languages.map((l) => ({ value: l.id, label: l.name }));
  const hasLanguages = languages.length > 0;

  return (
    <div className="relative mx-auto max-w-6xl space-y-6 px-4 py-6">
      <h1 className="text-page-title">Blind Test</h1>

      <div className="absolute right-4 top-6 text-sm text-white/60">
        Round {completedRoundsCount + 1}
      </div>

      {/* Language picker */}
      {hasLanguages && (
        <div className="max-w-xs">
          <GlassSelect
            label="Language"
            options={languageOptions}
            value={languageId}
            onChange={handleLanguageChange}
          />
        </div>
      )}

      {/* Sentence display */}
      <GlassCard>
        <p className="text-center text-lg text-white">
          {!hasLanguages
            ? "No languages available. Please add languages in Admin."
            : loading
              ? "Loading..."
              : round?.sentence ?? "—"}
        </p>
      </GlassCard>

      {/* Two audio cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div
          className={
            voteFlash === "A"
              ? "animate-pulse rounded-2xl ring-2 ring-accent-blue/50"
              : ""
          }
        >
          <AudioCard
            label="A"
            audioUrl={round?.audioA ?? null}
            loading={loading}
            error={errorA}
            accent="blue"
            listenTimeMs={listenTimeA}
            onListenTimeUpdate={(d) => setListenTimeA((t) => t + d)}
            onError={() => setErrorA(true)}
          />
        </div>
        <div
          className={
            voteFlash === "B"
              ? "animate-pulse rounded-2xl ring-2 ring-accent-purple/50"
              : ""
          }
        >
          <AudioCard
            label="B"
            audioUrl={round?.audioB ?? null}
            loading={loading}
            error={errorB}
            accent="purple"
            listenTimeMs={listenTimeB}
            onListenTimeUpdate={(d) => setListenTimeB((t) => t + d)}
            onError={() => setErrorB(true)}
          />
        </div>
      </div>

      {/* Vote buttons */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-4">
          <GlassButton
            size="lg"
            accent="blue"
            disabled={!canVote}
            onClick={() => handleVote("A")}
            title={!canVote ? "Listen to both clips first" : undefined}
          >
            Vote A
          </GlassButton>
          <GlassButton
            size="lg"
            accent="purple"
            disabled={!canVote}
            onClick={() => handleVote("B")}
            title={!canVote ? "Listen to both clips first" : undefined}
          >
            Vote B
          </GlassButton>
        </div>
        {showSkip && (
          <GlassButton
            variant="secondary"
            accent="red"
            size="md"
            onClick={handleSkipRound}
            disabled={voting}
          >
            Skip Round
          </GlassButton>
        )}
      </div>
    </div>
  );
}

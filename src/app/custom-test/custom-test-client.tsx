"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassSelect } from "@/components/ui/glass-select";
import { AudioCard } from "@/components/blind-test/audio-card";
import {
  getModelsForLanguage,
  prepareCustomRound,
  type ModelOption,
} from "./actions";
import { submitVote, markRoundInvalid } from "../blind-test/actions";
import type { LanguageOption } from "./actions";
import { toast } from "sonner";

const LANGUAGE_STORAGE_KEY = "custom-test-language-id";

interface CustomTestClientProps {
  languages: LanguageOption[];
}

type RoundData = {
  testEventId: string;
  sentence: string;
  audioA: string;
  audioB: string;
};

export function CustomTestClient({ languages }: CustomTestClientProps) {
  const [mode, setMode] = useState<"setup" | "testing">("setup");
  const [languageId, setLanguageId] = useState<string>("");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [modelAId, setModelAId] = useState<string>("");
  const [modelBId, setModelBId] = useState<string>("");
  const [modelALabel, setModelALabel] = useState<string>("");
  const [modelBLabel, setModelBLabel] = useState<string>("");
  const [round, setRound] = useState<RoundData | null>(null);
  const [loading, setLoading] = useState(false);
  const [listenTimeA, setListenTimeA] = useState(0);
  const [listenTimeB, setListenTimeB] = useState(0);
  const [voting, setVoting] = useState(false);
  const [errorA, setErrorA] = useState(false);
  const [errorB, setErrorB] = useState(false);
  const [voteFlash, setVoteFlash] = useState<"A" | "B" | null>(null);

  // Default language from localStorage
  useEffect(() => {
    if (languages.length === 0) return;
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem(LANGUAGE_STORAGE_KEY)
        : null;
    const defaultId =
      stored && languages.some((l) => l.id === stored) ? stored : languages[0]!.id;
    setLanguageId(defaultId);
  }, [languages]);

  // Fetch models when language changes
  const fetchModels = useCallback(async (langId: string) => {
    const list = await getModelsForLanguage(langId);
    setModels(list);
    setModelAId("");
    setModelBId("");
  }, []);

  useEffect(() => {
    if (languageId) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, languageId);
      fetchModels(languageId);
    }
  }, [languageId, fetchModels]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id) setLanguageId(id);
  };

  const handleStartTest = async () => {
    if (!languageId || !modelAId || !modelBId || modelAId === modelBId) return;
    const labelA = models.find((m) => m.id === modelAId)?.label ?? "";
    const labelB = models.find((m) => m.id === modelBId)?.label ?? "";
    setModelALabel(labelA);
    setModelBLabel(labelB);
    setLoading(true);
    setRound(null);
    const { data, error } = await prepareCustomRound(languageId, modelAId, modelBId);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    if (data) {
      setMode("testing");
      setRound({
        testEventId: data.testEventId,
        sentence: data.sentence.text,
        audioA: data.audioA.url,
        audioB: data.audioB.url,
      });
      setListenTimeA(0);
      setListenTimeB(0);
      setErrorA(false);
      setErrorB(false);
    }
  };

  const loadNextRound = useCallback(async () => {
    if (!languageId || !modelAId || !modelBId) return;
    setLoading(true);
    setRound(null);
    const { data, error } = await prepareCustomRound(languageId, modelAId, modelBId);
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
      setListenTimeA(0);
      setListenTimeB(0);
      setErrorA(false);
      setErrorB(false);
    }
  }, [languageId, modelAId, modelBId]);

  const handleChangeModels = () => {
    setMode("setup");
    setRound(null);
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
    setTimeout(() => {
      setVoteFlash(null);
      setVoting(false);
    }, 500);

    setRound(null);
    setListenTimeA(0);
    setListenTimeB(0);
    setErrorA(false);
    setErrorB(false);
    loadNextRound();
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
      setRound(null);
      setListenTimeA(0);
      setListenTimeB(0);
      setVoting(false);
      loadNextRound();
    }
  };

  const canVote = listenTimeA >= 3000 && listenTimeB >= 3000 && !voting;
  const showSkip = errorA || errorB;
  const canStartTest =
    languageId && modelAId && modelBId && modelAId !== modelBId && !loading;

  const languageOptions = languages.map((l) => ({ value: l.id, label: l.code }));
  const modelAOption = models.find((m) => m.id === modelAId);
  const modelOptionsForA = models.map((m) => ({ value: m.id, label: m.label }));
  const modelOptionsForB = modelAOption
    ? models
        .filter((m) => m.gender === modelAOption.gender && m.id !== modelAId)
        .map((m) => ({ value: m.id, label: m.label }))
    : models.map((m) => ({ value: m.id, label: m.label }));

  if (mode === "setup") {
    return (
      <div className="relative mx-auto max-w-6xl space-y-6 px-4 py-6">
        <h1 className="text-page-title">Custom Test</h1>

        <GlassCard className="max-w-xl space-y-4">
          <p className="text-white/80">
            Pick two TTS models to compare. A random sentence will be generated
            for both.
          </p>

          <GlassSelect
            label="Language"
            options={languageOptions}
            value={languageId}
            onChange={handleLanguageChange}
          />

          <GlassSelect
            label="Model A"
            options={modelOptionsForA}
            value={modelAId}
            onChange={(e) => {
              setModelAId(e.target.value);
              setModelBId("");
            }}
            placeholder="Select model..."
          />

          <GlassSelect
            label="Model B"
            options={modelOptionsForB}
            value={modelBId}
            onChange={(e) => setModelBId(e.target.value)}
            placeholder={modelAId ? "Select model (same gender)..." : "Select Model A first..."}
          />

          {modelAId && modelBId && modelAId === modelBId && (
            <p className="text-sm text-accent-red">
              Model A and Model B must be different.
            </p>
          )}
          {modelAId && modelOptionsForB.length === 0 && (
            <p className="text-sm text-accent-yellow">
              No models with the same gender as Model A available for this language.
            </p>
          )}

          <GlassButton
            size="lg"
            accent="blue"
            disabled={!canStartTest}
            onClick={handleStartTest}
          >
            {loading ? "Generating..." : "Start Test"}
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl space-y-6 px-4 py-6">
      <h1 className="text-page-title">Custom Test</h1>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-4">
          <GlassButton
            variant="secondary"
            size="md"
            onClick={handleChangeModels}
            disabled={voting || loading}
          >
            Change Models
          </GlassButton>
        </div>
        {modelALabel && modelBLabel && (
          <p className="text-sm text-white/70">
            Comparing: <span className="text-accent-blue">{modelALabel}</span>
            {" vs "}
            <span className="text-accent-purple">{modelBLabel}</span>
          </p>
        )}
      </div>

      <GlassCard>
        <p className="text-center text-lg text-white">
          {loading ? "Loading..." : round?.sentence ?? "—"}
        </p>
      </GlassCard>

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

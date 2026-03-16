"use client";

import { useState, useCallback, useTransition, useRef, useEffect } from "react";
import {
  getVoicesForProvider,
  getSampleSentences,
  type PlaygroundConfig,
  type LanguageOption,
  type VoiceOption,
  type SampleSentence,
} from "./actions";
import { MurfAudioPlayer } from "@/components/murf-playground/murf-audio-player";
import { VoicePicker } from "@/components/murf-playground/voice-picker";
import { SentenceBucket } from "@/components/murf-playground/sentence-bucket";
import { TextInput } from "@/components/murf-playground/text-input";

interface Props {
  config: PlaygroundConfig;
  languages: LanguageOption[];
  initialLanguageId: string;
  initialVoicesA: VoiceOption[];
  initialVoicesB: VoiceOption[];
  initialSentences: SampleSentence[];
}

export function PlaygroundClient({
  config,
  languages,
  initialLanguageId,
  initialVoicesA,
  initialVoicesB,
  initialSentences,
}: Props) {
  const [languageId, setLanguageId] = useState(initialLanguageId);
  const [voicesA, setVoicesA] = useState<VoiceOption[]>(initialVoicesA);
  const [voicesB, setVoicesB] = useState<VoiceOption[]>(initialVoicesB);
  const [voiceIdA, setVoiceIdA] = useState(initialVoicesA[0]?.voiceId ?? "");
  const [voiceIdB, setVoiceIdB] = useState(initialVoicesB[0]?.voiceId ?? "");
  const [sentences, setSentences] = useState<SampleSentence[]>(initialSentences);
  const [text, setText] = useState("");
  const [audioUrlA, setAudioUrlA] = useState<string | null>(null);
  const [audioUrlB, setAudioUrlB] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const prevBlobA = useRef<string | null>(null);
  const prevBlobB = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (prevBlobA.current) URL.revokeObjectURL(prevBlobA.current);
      if (prevBlobB.current) URL.revokeObjectURL(prevBlobB.current);
    };
  }, []);

  const selectedLanguage = languages.find((l) => l.id === languageId);

  const handleLanguageChange = useCallback(
    (newLangId: string) => {
      setLanguageId(newLangId);
      setVoiceIdA("");
      setVoiceIdB("");
      setAudioUrlA(null);
      setAudioUrlB(null);
      setError(null);

      startTransition(async () => {
        const [newVoicesA, newVoicesB, newSentences] = await Promise.all([
          getVoicesForProvider(config.modelAProviderSlug, newLangId),
          getVoicesForProvider(config.modelBProviderSlug, newLangId),
          getSampleSentences(config.id, newLangId),
        ]);
        setVoicesA(newVoicesA);
        setVoicesB(newVoicesB);
        setVoiceIdA(newVoicesA[0]?.voiceId ?? "");
        setVoiceIdB(newVoicesB[0]?.voiceId ?? "");
        setSentences(newSentences);
      });
    },
    [config]
  );

  const handleGenerate = useCallback(async () => {
    if (!text.trim() || !voiceIdA || !voiceIdB || !selectedLanguage) return;

    setGenerating(true);
    setError(null);
    setAudioUrlA(null);
    setAudioUrlB(null);

    if (prevBlobA.current) URL.revokeObjectURL(prevBlobA.current);
    if (prevBlobB.current) URL.revokeObjectURL(prevBlobB.current);
    prevBlobA.current = null;
    prevBlobB.current = null;

    try {
      const [resA, resB] = await Promise.all([
        fetch("/api/murf-playground/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            providerSlug: config.modelAProviderSlug,
            modelId: config.modelAModelId,
            voiceId: voiceIdA,
            text: text.trim(),
            languageCode: selectedLanguage.code,
          }),
        }),
        fetch("/api/murf-playground/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            providerSlug: config.modelBProviderSlug,
            modelId: config.modelBModelId,
            voiceId: voiceIdB,
            text: text.trim(),
            languageCode: selectedLanguage.code,
          }),
        }),
      ]);

      if (!resA.ok || !resB.ok) {
        const errA = !resA.ok ? await resA.json().catch(() => ({})) : null;
        const errB = !resB.ok ? await resB.json().catch(() => ({})) : null;
        const msg =
          (errA as { error?: string })?.error ??
          (errB as { error?: string })?.error ??
          "Audio generation failed";
        setError(msg);
        setGenerating(false);
        return;
      }

      const [blobA, blobB] = await Promise.all([resA.blob(), resB.blob()]);
      const urlA = URL.createObjectURL(blobA);
      const urlB = URL.createObjectURL(blobB);

      prevBlobA.current = urlA;
      prevBlobB.current = urlB;

      setAudioUrlA(urlA);
      setAudioUrlB(urlB);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [text, voiceIdA, voiceIdB, selectedLanguage, config]);

  const handleSentenceSelect = useCallback((sentenceText: string) => {
    setText(sentenceText);
  }, []);

  const canGenerate =
    text.trim().length > 0 && voiceIdA && voiceIdB && !generating;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1
          className="text-2xl font-bold sm:text-3xl"
          style={{ color: "var(--murf-text)" }}
        >
          {config.headline}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--murf-text-muted)" }}>
          Select a language, pick voices, and generate audio to compare
        </p>
      </div>

      {/* Controls */}
      <div className="murf-card mb-6 space-y-5 p-6">
        {/* Language picker */}
        <div className="max-w-xs">
          <label className="murf-label">Language</label>
          <select
            className="murf-select"
            value={languageId}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={isPending || languages.length === 0}
          >
            {languages.length === 0 ? (
              <option value="">No languages available</option>
            ) : (
              languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.code})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Voice pickers */}
        <div className="grid gap-5 sm:grid-cols-2">
          <VoicePicker
            label={`${config.modelALabel} Voice`}
            voices={voicesA}
            value={voiceIdA}
            onChange={setVoiceIdA}
            disabled={isPending}
          />
          <VoicePicker
            label={`${config.modelBLabel} Voice`}
            voices={voicesB}
            value={voiceIdB}
            onChange={setVoiceIdB}
            disabled={isPending}
          />
        </div>

        {/* Text input */}
        <TextInput
          value={text}
          onChange={setText}
          maxLength={1000}
          disabled={generating}
        />

        {/* Generate button + error */}
        <div className="flex flex-col items-start gap-3">
          <button
            type="button"
            className="murf-btn murf-btn-primary murf-btn-lg"
            disabled={!canGenerate}
            onClick={handleGenerate}
          >
            {generating ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
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
                Generating...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                  />
                </svg>
                Generate Audio
              </>
            )}
          </button>
          {error && (
            <p className="text-sm" style={{ color: "var(--murf-pink)" }}>
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Audio players */}
      <div className="mb-10 grid gap-6 sm:grid-cols-2">
        <MurfAudioPlayer
          label={config.modelALabel}
          audioUrl={audioUrlA}
          loading={generating}
        />
        <MurfAudioPlayer
          label={config.modelBLabel}
          audioUrl={audioUrlB}
          loading={generating}
        />
      </div>

      {/* Divider */}
      <div
        className="mb-8 h-px w-full"
        style={{ background: "var(--murf-border)" }}
      />

      {/* Sample sentences */}
      <div>
        <h2
          className="mb-4 text-xl font-semibold"
          style={{ color: "var(--murf-text)" }}
        >
          Sample Sentences
        </h2>
        <p className="mb-4 text-sm" style={{ color: "var(--murf-text-muted)" }}>
          Click a sentence to use it as input above.
        </p>
        <SentenceBucket sentences={sentences} onSelect={handleSentenceSelect} />
      </div>
    </div>
  );
}

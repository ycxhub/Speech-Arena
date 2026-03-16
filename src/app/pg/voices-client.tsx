"use client";

import { useState, useCallback, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import {
  getVoicesForProvider,
  getSampleSentences,
  type LanguageOption,
  type VoiceOption,
  type SampleSentence,
  type PlaygroundPageLink,
} from "./[slug]/actions";

import { MurfAudioPlayer } from "@/components/murf-playground/murf-audio-player";
import { VoicePicker } from "@/components/murf-playground/voice-picker";
import { SentenceBucket } from "@/components/murf-playground/sentence-bucket";
import { TextInput } from "@/components/murf-playground/text-input";

const PROVIDER_SLUG = "murf";
const MODEL_ID = "FALCON";

const PLAYGROUND_INDUSTRIES = [
  { value: "Banking", label: "Banking" },
  { value: "Concierge", label: "Concierge" },
  { value: "Customer Support", label: "Customer Support" },
  { value: "Digital/Apps", label: "Digital/Apps" },
  { value: "Ecommerce", label: "Ecommerce" },
  { value: "F&B", label: "F&B" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Insurance", label: "Insurance" },
  { value: "Retail", label: "Retail" },
  { value: "Telecom", label: "Telecom" },
  { value: "Travel", label: "Travel" },
] as const;

function simplifyTitle(title: string): string {
  return title.replace(/^Compare\s+/i, "").replace(/\s+vs\s+/i, " & ");
}

interface Props {
  languages: LanguageOption[];
  initialLanguageId: string;
  initialVoices: VoiceOption[];
  initialSentences: SampleSentence[];
  sentencePageId: string;
  comparePages: PlaygroundPageLink[];
}

export function VoicesClient({
  languages,
  initialLanguageId,
  initialVoices,
  initialSentences,
  sentencePageId,
  comparePages,
}: Props) {
  const [languageId, setLanguageId] = useState(initialLanguageId);
  const [industry, setIndustry] = useState<string>("Retail");
  const [voices, setVoices] = useState<VoiceOption[]>(initialVoices);
  const [voiceId, setVoiceId] = useState(initialVoices[0]?.voiceId ?? "");
  const [sentences, setSentences] = useState<SampleSentence[]>(initialSentences);
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const prevBlob = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (prevBlob.current) URL.revokeObjectURL(prevBlob.current);
    };
  }, []);

  const selectedLanguage = languages.find((l) => l.id === languageId);

  const handleLanguageChange = useCallback(
    (newLangId: string) => {
      setLanguageId(newLangId);
      setVoiceId("");
      setAudioUrl(null);
      setError(null);

      startTransition(async () => {
        const [newVoices, newSentences] = await Promise.all([
          getVoicesForProvider(PROVIDER_SLUG, newLangId, MODEL_ID),
          getSampleSentences(sentencePageId, newLangId, industry),
        ]);
        setVoices(newVoices);
        setVoiceId(newVoices[0]?.voiceId ?? "");
        setSentences(newSentences);
        if (newSentences.length > 0) setText(newSentences[0].text);
      });
    },
    [sentencePageId, industry]
  );

  const handleIndustryChange = useCallback(
    (newIndustry: string) => {
      setIndustry(newIndustry);
      setError(null);
      startTransition(async () => {
        const newSentences = await getSampleSentences(
          sentencePageId,
          languageId,
          newIndustry || undefined
        );
        setSentences(newSentences);
        if (newSentences.length > 0) setText(newSentences[0].text);
      });
    },
    [sentencePageId, languageId]
  );

  useEffect(() => {
    if (initialSentences.length > 0 && !text) {
      setText(initialSentences[0].text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!text.trim() || !voiceId || !selectedLanguage) return;

    setGenerating(true);
    setError(null);
    setAudioUrl(null);

    if (prevBlob.current) URL.revokeObjectURL(prevBlob.current);
    prevBlob.current = null;

    try {
      const res = await fetch("/api/pg/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerSlug: PROVIDER_SLUG,
          modelId: MODEL_ID,
          voiceId,
          text: text.trim(),
          languageCode: selectedLanguage.code,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          (body as { error?: string })?.error ?? "Audio generation failed"
        );
        setGenerating(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      prevBlob.current = url;
      setAudioUrl(url);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [text, voiceId, selectedLanguage]);

  const handleSentenceSelect = useCallback((sentenceText: string) => {
    setText(sentenceText);
  }, []);

  const handleTryAnotherSentence = useCallback(() => {
    if (sentences.length === 0) return;
    const randomSentence =
      sentences[Math.floor(Math.random() * sentences.length)];
    setText(randomSentence.text);
  }, [sentences]);

  const canGenerate = text.trim().length > 0 && voiceId && !generating;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1
          className="text-2xl font-bold sm:text-3xl"
          style={{ color: "var(--murf-text)" }}
        >
          Explore Murf Falcon Voices
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--murf-text-muted)" }}>
          Select a language, pick a voice, and generate audio to listen
        </p>
      </div>

      {/* Controls */}
      <div className="murf-card mb-6 space-y-5 p-6">
        {/* Language and Industry filters */}
        <div className="flex flex-wrap gap-5">
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
          <div className="max-w-xs">
            <label className="murf-label">Industry</label>
            <select
              className="murf-select"
              value={industry}
              onChange={(e) => handleIndustryChange(e.target.value)}
              disabled={isPending}
            >
              {PLAYGROUND_INDUSTRIES.map((ind) => (
                <option key={ind.value} value={ind.value}>
                  {ind.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Voice picker -- single, full width */}
        <VoicePicker
          label="Murf Falcon Voice"
          voices={voices}
          value={voiceId}
          onChange={setVoiceId}
          disabled={isPending}
          voiceCount={voices.length}
        />

        {/* Text input */}
        <div className="space-y-2">
          <TextInput
            value={text}
            onChange={setText}
            maxLength={1000}
            disabled={generating}
          />
          <button
            type="button"
            className="murf-btn murf-btn-secondary murf-btn-sm"
            disabled={sentences.length === 0}
            onClick={handleTryAnotherSentence}
          >
            Try another sentence
          </button>
        </div>

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

      {/* Audio player -- single, full width */}
      <div className="mb-10">
        <MurfAudioPlayer
          label="Murf Falcon"
          audioUrl={audioUrl}
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
          Choose industry and language above to filter. Click a sentence to use
          it as input, or copy all.
        </p>
        <SentenceBucket
          sentences={sentences}
          onSelect={handleSentenceSelect}
        />
      </div>

      {/* Compare section (footer) */}
      {comparePages.length > 0 && (
        <>
          <div
            className="mb-8 mt-12 h-px w-full"
            style={{ background: "var(--murf-border)" }}
          />
          <div className="pb-8">
            <h2
              className="mb-2 text-xl font-semibold"
              style={{ color: "var(--murf-text)" }}
            >
              Compare with Other Models
            </h2>
            <p
              className="mb-6 text-sm"
              style={{ color: "var(--murf-text-muted)" }}
            >
              Listen side-by-side and pick your favorite voice.
            </p>
            <div className="murf-catalog-grid">
              {comparePages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/pg/${page.slug}`}
                  className="murf-catalog-card"
                >
                  <span className="murf-catalog-card-title">
                    {simplifyTitle(page.title)}
                  </span>
                  <span className="murf-catalog-card-cta">
                    Listen & compare
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M6 4L10 8L6 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

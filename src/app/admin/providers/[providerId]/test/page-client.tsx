"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassSelect } from "@/components/ui/glass-select";
import { GlassButton } from "@/components/ui/glass-button";
import { testProviderApi } from "./actions";
import { toast } from "sonner";

const DEFAULT_TEXT = "Hi there, run a quick test to confirm it works";

type Model = {
  id: string;
  name: string;
  model_id: string;
  voice_id: string | null;
  display_name: string | null;
  languageCodes: string[];
};
type Language = { id: string; code: string; name: string };

interface TestApiPageClientProps {
  providerId: string;
  models: Model[];
  languages: Language[];
  isReady: boolean;
  missingItems: { label: string; href: string }[];
}

export function TestApiPageClient({
  providerId,
  models,
  languages,
  isReady,
  missingItems,
}: TestApiPageClientProps) {
  const [text, setText] = useState(DEFAULT_TEXT);
  const uniqueModelIds = [...new Set(models.map((m) => m.model_id))];
  const firstModelId = uniqueModelIds[0] ?? "";
  const [selectedModelId, setSelectedModelId] = useState(firstModelId);
  const modelsForSelectedModel = models.filter((m) => m.model_id === selectedModelId);
  const languageCodesForSelectedModel = [
    ...new Set(modelsForSelectedModel.flatMap((m) => m.languageCodes)),
  ];
  const [languageCode, setLanguageCode] = useState(
    languageCodesForSelectedModel[0] ?? languages[0]?.code ?? ""
  );
  const modelsForSelectedModelAndLanguage = modelsForSelectedModel.filter((m) =>
    m.languageCodes.includes(languageCode)
  );
  const [selectedModelRowId, setSelectedModelRowId] = useState(
    modelsForSelectedModelAndLanguage[0]?.id ?? ""
  );

  useEffect(() => {
    const codes = [...new Set(modelsForSelectedModel.flatMap((m) => m.languageCodes))];
    setLanguageCode((prev) => (codes.includes(prev) ? prev : codes[0] ?? ""));
  }, [selectedModelId, models]);

  useEffect(() => {
    const forModelAndLang = modelsForSelectedModel.filter((m) =>
      m.languageCodes.includes(languageCode)
    );
    const firstId = forModelAndLang[0]?.id ?? "";
    setSelectedModelRowId((prev) =>
      forModelAndLang.some((m) => m.id === prev) ? prev : firstId
    );
  }, [selectedModelId, languageCode, models]);
  const [loading, setLoading] = useState(false);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!selectedModelRowId || !languageCode) {
      toast.error("Select a model, voice, and language");
      return;
    }
    setLoading(true);
    setError(null);
    setAudioDataUrl(null);
    try {
      const result = await testProviderApi(providerId, selectedModelRowId, languageCode, text);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else if (result.audioDataUrl) {
        setAudioDataUrl(result.audioDataUrl);
        toast.success("Audio generated successfully");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return (
      <GlassCard>
        <h2 className="mb-4 text-section-heading">Test API Call</h2>
        <p className="mb-4 text-sm text-white/60">
          Run a test TTS generation to verify your provider configuration. Add
          models, voices, and keys first.
        </p>
        <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="font-medium text-white">Setup incomplete</p>
          <ul className="list-inside list-disc text-sm text-white/60">
            {missingItems.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className="text-accent-blue hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </GlassCard>
    );
  }

  const modelOptions = uniqueModelIds.map((modelId) => {
    const m = models.find((x) => x.model_id === modelId)!;
    return { value: modelId, label: `${m.name} (${m.model_id})` };
  });
  const languageOptions = languages
    .filter((l) => languageCodesForSelectedModel.includes(l.code))
    .map((l) => ({ value: l.code, label: l.code }));
  const voiceOptions = modelsForSelectedModelAndLanguage.map((m) => ({
    value: m.id,
    label: m.display_name ?? m.voice_id ?? m.name,
  }));

  return (
    <GlassCard>
      <h2 className="mb-4 text-section-heading">Test API Call</h2>
      <p className="mb-6 text-sm text-white/60">
        Enter text and select a model, voice, and language. Click Test to generate
        audio and verify your provider configuration.
      </p>

      <div className="space-y-4 max-w-xl">
        <GlassInput
          label="Text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={DEFAULT_TEXT}
        />
        <GlassSelect
          label="Model"
          options={modelOptions}
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.target.value)}
        />
        <GlassSelect
          label="Language"
          options={languageOptions}
          value={languageCode}
          onChange={(e) => setLanguageCode(e.target.value)}
        />
        <GlassSelect
          label="Voice Name (Display Name)"
          options={voiceOptions}
          value={selectedModelRowId}
          onChange={(e) => setSelectedModelRowId(e.target.value)}
        />
        <GlassButton
          onClick={handleTest}
          loading={loading}
          disabled={loading}
        >
          Test
        </GlassButton>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-accent-red/30 bg-accent-red/10 px-4 py-3">
          <p className="text-sm text-accent-red">{error}</p>
        </div>
      )}

      {audioDataUrl && (
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-white">Output</p>
          <audio
            controls
            src={audioDataUrl}
            className="w-full max-w-md"
          />
          <a
            href={audioDataUrl}
            download="test-output.mp3"
            className="inline-block text-sm text-accent-blue hover:underline"
          >
            Download audio
          </a>
        </div>
      )}
    </GlassCard>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassSelect } from "@/components/ui/glass-select";
import { GlassButton } from "@/components/ui/glass-button";
import { createModel, updateModel } from "./actions";
import { toast } from "sonner";

type Model = {
  id?: string;
  name: string;
  model_id: string;
  voice_id?: string | null;
  excludeVoiceId?: string;
  gender: string;
  languages: string[];
  tags: string[];
};

type ProviderVoice = {
  id: string;
  voice_id: string;
  gender: string;
  display_name: string | null;
};

interface AddModelModalProps {
  open: boolean;
  onClose: () => void;
  providerId: string;
  model?: Model | null;
  languages: { id: string; code: string; name: string }[];
  providerVoices: ProviderVoice[];
  onSuccess?: () => void;
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "neutral", label: "Neutral" },
];

export function AddModelModal({
  open,
  onClose,
  providerId,
  model,
  languages,
  providerVoices,
  onSuccess,
}: AddModelModalProps) {
  const [name, setName] = useState(model?.name ?? "");
  const [modelId, setModelId] = useState(model?.model_id ?? "");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [customVoiceId, setCustomVoiceId] = useState(model?.voice_id ?? "");
  const [customGender, setCustomGender] = useState(model?.gender ?? "neutral");
  const [selectedLangIds, setSelectedLangIds] = useState<string[]>(model?.languages ?? []);
  const [tagsStr, setTagsStr] = useState((model?.tags ?? []).join(", "));
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [modelIdError, setModelIdError] = useState<string | null>(null);
  const [langError, setLangError] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const isEdit = !!model?.id;
  const isDuplicate = !!model && !model.id && !!model.excludeVoiceId;
  const useCustomVoice = selectedVoiceId === "__custom__";

  const selectedVoice = providerVoices.find((v) => v.id === selectedVoiceId);
  const voiceId = useCustomVoice ? customVoiceId : selectedVoice?.voice_id ?? "";
  const gender = useCustomVoice ? customGender : selectedVoice?.gender ?? "neutral";

  useEffect(() => {
    if (open) {
      setName(model?.name ?? "");
      setModelId(model?.model_id ?? "");
      const langIds =
        model?.languages
          ?.map((code) => languages.find((l) => l.code === code || l.id === code)?.id)
          .filter(Boolean) ?? [];
      setSelectedLangIds(langIds as string[]);
      setTagsStr((model?.tags ?? []).join(", "));

      if (isDuplicate) {
        setSelectedVoiceId("");
        setCustomVoiceId("");
        setCustomGender("neutral");
      } else if (model?.voice_id) {
        const match = providerVoices.find((v) => v.voice_id === model.voice_id);
        if (match) {
          setSelectedVoiceId(match.id);
          setCustomVoiceId("");
          setCustomGender("neutral");
        } else {
          setSelectedVoiceId("__custom__");
          setCustomVoiceId(model.voice_id);
          setCustomGender(model.gender);
        }
      } else {
        setSelectedVoiceId(providerVoices[0]?.id ?? "");
        setCustomVoiceId("");
        setCustomGender("neutral");
      }
    }
  }, [open, model, languages, providerVoices]);

  const validate = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError("Name is required");
      valid = false;
    } else setNameError(null);
    if (!modelId.trim()) {
      setModelIdError("Model ID is required");
      valid = false;
    } else setModelIdError(null);
    if (selectedLangIds.length === 0) {
      setLangError("At least one language is required");
      valid = false;
    } else setLangError(null);
    if (providerVoices.length === 0 && !model) {
      valid = false;
    }
    if (useCustomVoice && !customVoiceId.trim()) {
      valid = false;
    }
    if (isDuplicate && !selectedVoiceId && !customVoiceId.trim()) {
      setVoiceError("Select a different voice");
      valid = false;
    } else {
      setVoiceError(null);
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (providerVoices.length === 0 && !isEdit) {
      toast.error("Add voices first");
      return;
    }
    setLoading(true);
    try {
      const result = isEdit
        ? await updateModel(model.id!, providerId, name.trim(), modelId.trim(), voiceId.trim() || null, gender, selectedLangIds, tagsStr)
        : await createModel(providerId, name.trim(), modelId.trim(), voiceId.trim() || null, gender, selectedLangIds, tagsStr);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Model updated" : isDuplicate ? "Model duplicated with new voice" : "Model added");
      onClose();
      onSuccess?.();
      setName("");
      setModelId("");
      setSelectedVoiceId("");
      setCustomVoiceId("");
      setCustomGender("neutral");
      setSelectedLangIds([]);
      setTagsStr("");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName(model?.name ?? "");
    setModelId(model?.model_id ?? "");
    setSelectedVoiceId(providerVoices[0]?.id ?? "");
    setCustomVoiceId(model?.voice_id ?? "");
    setCustomGender(model?.gender ?? "neutral");
    setSelectedLangIds(model?.languages ?? []);
    setTagsStr((model?.tags ?? []).join(", "));
    setNameError(null);
    setModelIdError(null);
    setLangError(null);
    setVoiceError(null);
    onClose();
  };

  const toggleLanguage = (langId: string) => {
    setSelectedLangIds((prev) =>
      prev.includes(langId) ? prev.filter((id) => id !== langId) : [...prev, langId]
    );
  };

  const filteredVoices = model?.excludeVoiceId
    ? providerVoices.filter((v) => v.voice_id !== model.excludeVoiceId)
    : providerVoices;

  const voiceOptions = [
    ...filteredVoices.map((v) => ({
      value: v.id,
      label: v.display_name ? `${v.display_name} (${v.voice_id})` : v.voice_id,
    })),
    ...(isEdit || isDuplicate ? [{ value: "__custom__", label: "Other (custom voice ID)" }] : []),
  ];

  return (
    <GlassModal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit Model" : isDuplicate ? "Duplicate with different voice" : "Add Model"}
      footer={
        <>
          <GlassButton variant="ghost" onClick={handleClose}>
            Cancel
          </GlassButton>
          <GlassButton
            type="submit"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading || (providerVoices.length === 0 && !isEdit)}
          >
            {isEdit ? "Save" : "Add"}
          </GlassButton>
        </>
      }
    >
      <div className="space-y-4">
        {providerVoices.length === 0 && !isEdit ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-200">
              Add voices first before adding models.{" "}
              <Link href={`/admin/providers/${providerId}/voices`} className="text-accent-blue hover:underline">
                Go to Voices
              </Link>
            </p>
          </div>
        ) : (
          <>
            <GlassInput
              label="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={nameError ?? undefined}
              placeholder="e.g. Multilingual v2"
            />
            <GlassInput
              label="Model ID"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              error={modelIdError ?? undefined}
              placeholder="Provider TTS model (e.g. eleven_multilingual_v2, tts-1-hd)"
              helperText="TTS engine identifier"
            />
            {providerVoices.length > 0 && (
              <>
                <GlassSelect
                  label="Voice"
                  options={voiceOptions}
                  value={selectedVoiceId}
                  onChange={(e) => {
                    setSelectedVoiceId(e.target.value);
                    setVoiceError(null);
                  }}
                  placeholder={isDuplicate ? "Select a different voice" : undefined}
                  error={voiceError ?? undefined}
                />
                {useCustomVoice && (
                  <>
                    <GlassInput
                      label="Voice ID (custom)"
                      value={customVoiceId}
                      onChange={(e) => setCustomVoiceId(e.target.value)}
                      placeholder="Provider voice/character ID"
                    />
                    <GlassSelect
                      label="Gender"
                      options={GENDER_OPTIONS}
                      value={customGender}
                      onChange={(e) => setCustomGender(e.target.value)}
                    />
                  </>
                )}
                {!useCustomVoice && selectedVoice && (
                  <p className="text-sm text-white/60">
                    Gender: {selectedVoice.gender}
                  </p>
                )}
              </>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">
                Supported languages
              </label>
              {langError && (
                <p className="mb-1.5 text-sm text-accent-red" role="alert">
                  {langError}
                </p>
              )}
              {languages.length === 0 ? (
                <p className="text-sm text-white/60">
                  Configure provider languages first.{" "}
                  <Link href={`/admin/providers/${providerId}/languages`} className="text-accent-blue hover:underline">
                    Go to Languages
                  </Link>
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {languages.map((l) => (
                    <label
                      key={l.id}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLangIds.includes(l.id)}
                        onChange={() => toggleLanguage(l.id)}
                        className="rounded border-white/20"
                      />
                      {l.code}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <GlassInput
              label="Tags"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="e.g. neural, fast, premium (comma-separated)"
            />
          </>
        )}
      </div>
    </GlassModal>
  );
}

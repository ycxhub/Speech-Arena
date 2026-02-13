"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassSelect } from "@/components/ui/glass-select";
import { GlassButton } from "@/components/ui/glass-button";
import { createModel, updateModel } from "./actions";
import { toast } from "sonner";

type Model = {
  id: string;
  name: string;
  model_id: string;
  voice_id?: string | null;
  gender: string;
  languages: string[]; // language codes or IDs
  tags: string[];
};

interface AddModelModalProps {
  open: boolean;
  onClose: () => void;
  providerId: string;
  model?: Model | null;
  languages: { id: string; code: string; name: string }[];
  onSuccess?: () => void;
}

export function AddModelModal({
  open,
  onClose,
  providerId,
  model,
  languages,
  onSuccess,
}: AddModelModalProps) {
  const [name, setName] = useState(model?.name ?? "");
  const [modelId, setModelId] = useState(model?.model_id ?? "");
  const [voiceId, setVoiceId] = useState(model?.voice_id ?? "");
  const [gender, setGender] = useState(model?.gender ?? "neutral");
  const [selectedLangIds, setSelectedLangIds] = useState<string[]>(model?.languages ?? []);
  const [tagsStr, setTagsStr] = useState((model?.tags ?? []).join(", "));
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [modelIdError, setModelIdError] = useState<string | null>(null);
  const [langError, setLangError] = useState<string | null>(null);

  const isEdit = !!model;

  useEffect(() => {
    if (open) {
      setName(model?.name ?? "");
      setModelId(model?.model_id ?? "");
      setVoiceId(model?.voice_id ?? "");
      setGender(model?.gender ?? "neutral");
      // Resolve language codes to IDs
      const langIds =
        model?.languages
          ?.map((code) => languages.find((l) => l.code === code)?.id)
          .filter(Boolean) ?? [];
      setSelectedLangIds(langIds as string[]);
      setTagsStr((model?.tags ?? []).join(", "));
    }
  }, [open, model, languages]);

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
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = isEdit
        ? await updateModel(model.id, providerId, name.trim(), modelId.trim(), voiceId.trim() || null, gender, selectedLangIds, tagsStr)
        : await createModel(providerId, name.trim(), modelId.trim(), voiceId.trim() || null, gender, selectedLangIds, tagsStr);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Model updated" : "Model added");
      onClose();
      onSuccess?.();
      setName("");
      setModelId("");
      setVoiceId("");
      setGender("neutral");
      setSelectedLangIds([]);
      setTagsStr("");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName(model?.name ?? "");
    setModelId(model?.model_id ?? "");
    setVoiceId(model?.voice_id ?? "");
    setGender(model?.gender ?? "neutral");
    setSelectedLangIds(model?.languages ?? []);
    setTagsStr((model?.tags ?? []).join(", "));
    setNameError(null);
    setModelIdError(null);
    setLangError(null);
    onClose();
  };

  const toggleLanguage = (langId: string) => {
    setSelectedLangIds((prev) =>
      prev.includes(langId) ? prev.filter((id) => id !== langId) : [...prev, langId]
    );
  };

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "neutral", label: "Neutral" },
  ];

  return (
    <GlassModal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit Model" : "Add Model"}
      footer={
        <>
          <GlassButton variant="ghost" onClick={handleClose}>
            Cancel
          </GlassButton>
          <GlassButton
            type="submit"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          >
            {isEdit ? "Save" : "Add"}
          </GlassButton>
        </>
      }
    >
      <div className="space-y-4">
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
        <GlassInput
          label="Voice ID"
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          placeholder="Provider voice/character ID (e.g. ElevenLabs voice ID). Optional."
          helperText="Voice/character; some providers derive from gender if empty"
        />
        <GlassSelect
          label="Gender"
          options={genderOptions}
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/80">
            Supported languages
          </label>
          {langError && (
            <p className="mb-1.5 text-sm text-accent-red" role="alert">
              {langError}
            </p>
          )}
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
                {l.name} ({l.code})
              </label>
            ))}
          </div>
        </div>
        <GlassInput
          label="Tags"
          value={tagsStr}
          onChange={(e) => setTagsStr(e.target.value)}
          placeholder="e.g. neural, fast, premium (comma-separated)"
        />
      </div>
    </GlassModal>
  );
}

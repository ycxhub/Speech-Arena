"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassSelect } from "@/components/ui/glass-select";
import { GlassButton } from "@/components/ui/glass-button";
import { createVoice, updateVoice } from "./actions";
import { toast } from "sonner";

type Voice = {
  id: string;
  voice_id: string;
  gender: string;
  display_name: string | null;
  language_id?: string;
};

interface AddVoiceModalProps {
  open: boolean;
  onClose: () => void;
  providerId: string;
  voice?: Voice | null;
  languages: { id: string; code: string }[];
  onSuccess?: () => void;
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "neutral", label: "Neutral" },
];

export function AddVoiceModal({
  open,
  onClose,
  providerId,
  voice,
  languages,
  onSuccess,
}: AddVoiceModalProps) {
  const [voiceId, setVoiceId] = useState(voice?.voice_id ?? "");
  const [gender, setGender] = useState(voice?.gender ?? "neutral");
  const [languageId, setLanguageId] = useState(voice?.language_id ?? "");
  const [displayName, setDisplayName] = useState(voice?.display_name ?? "");
  const [loading, setLoading] = useState(false);
  const [voiceIdError, setVoiceIdError] = useState<string | null>(null);
  const [languageError, setLanguageError] = useState<string | null>(null);

  const isEdit = !!voice;

  const languageOptions = languages.map((l) => ({ value: l.id, label: l.code }));

  useEffect(() => {
    if (open) {
      setVoiceId(voice?.voice_id ?? "");
      setGender(voice?.gender ?? "neutral");
      setLanguageId(voice?.language_id ?? languages[0]?.id ?? "");
      setDisplayName(voice?.display_name ?? "");
      setVoiceIdError(null);
      setLanguageError(null);
    }
  }, [open, voice, languages]);

  const validate = () => {
    let valid = true;
    if (!voiceId.trim()) {
      setVoiceIdError("Voice ID is required");
      valid = false;
    } else setVoiceIdError(null);
    if (!languageId) {
      setLanguageError("Language is required");
      valid = false;
    } else setLanguageError(null);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = isEdit
        ? await updateVoice(voice.id, providerId, voiceId.trim(), gender, languageId, displayName.trim() || undefined)
        : await createVoice(providerId, voiceId.trim(), gender, languageId, displayName.trim() || undefined);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Voice updated" : "Voice added");
      onClose();
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Voice" : "Add Voice"}
      footer={
        <>
          <GlassButton variant="ghost" onClick={onClose}>
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
          label="Voice ID"
          value={voiceId}
          onChange={(e) => setVoiceId(e.target.value)}
          error={voiceIdError ?? undefined}
          placeholder="Provider's voice/character ID (e.g. ElevenLabs voice ID)"
          helperText="Required. The API identifier for this voice."
        />
        <GlassSelect
          label="Gender"
          options={GENDER_OPTIONS}
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        />
        <GlassSelect
          label="Language"
          options={languageOptions}
          value={languageId}
          onChange={(e) => setLanguageId(e.target.value)}
          error={languageError ?? undefined}
        />
        <GlassInput
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Optional label for this voice"
        />
      </div>
    </GlassModal>
  );
}

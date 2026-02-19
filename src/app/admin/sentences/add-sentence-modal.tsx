"use client";

import { useState } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassSelect } from "@/components/ui/glass-select";
import { GlassButton } from "@/components/ui/glass-button";
import { createSentence } from "./actions";
import { toast } from "sonner";
import { SENTENCE_LABEL_OPTIONS } from "./constants";

type Language = { id: string; code: string; name: string };

interface AddSentenceModalProps {
  open: boolean;
  onClose: () => void;
  languages: Language[];
  onSuccess?: () => void;
}

export function AddSentenceModal({
  open,
  onClose,
  languages,
  onSuccess,
}: AddSentenceModalProps) {
  const [languageId, setLanguageId] = useState("");
  const [sentenceLabel, setSentenceLabel] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [sentenceLabelError, setSentenceLabelError] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);

  const validate = () => {
    let valid = true;
    if (!languageId) {
      setLanguageError("Language is required");
      valid = false;
    } else setLanguageError(null);
    if (!sentenceLabel) {
      setSentenceLabelError("Sentence Label is required");
      valid = false;
    } else setSentenceLabelError(null);
    if (!text.trim()) {
      setTextError("Sentence text is required");
      valid = false;
    } else if (text.trim().length > 500) {
      setTextError("Sentence must be 500 characters or less");
      valid = false;
    } else setTextError(null);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await createSentence(languageId, sentenceLabel, text.trim());
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Sentence added");
      setLanguageId("");
      setSentenceLabel("");
      setText("");
      onClose();
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setLanguageId("");
    setSentenceLabel("");
    setText("");
    setLanguageError(null);
    setSentenceLabelError(null);
    setTextError(null);
    onClose();
  };

  const options = languages.map((l) => ({
    value: l.id,
    label: l.code,
  }));

  return (
    <GlassModal
      open={open}
      onClose={handleClose}
      title="Add Sentence"
      footer={
        <>
          <GlassButton variant="ghost" onClick={handleClose}>
            Cancel
          </GlassButton>
          <GlassButton
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          >
            Add
          </GlassButton>
        </>
      }
    >
      <div className="space-y-4">
        <GlassSelect
          label="Language"
          options={[{ value: "", label: "Select language" }, ...options]}
          value={languageId}
          onChange={(e) => setLanguageId(e.target.value)}
          error={languageError ?? undefined}
        />
        <GlassSelect
          label="Sentence Label"
          options={[
            { value: "", label: "Select label" },
            ...SENTENCE_LABEL_OPTIONS.map((l) => ({ value: l, label: l })),
          ]}
          value={sentenceLabel}
          onChange={(e) => setSentenceLabel(e.target.value)}
          error={sentenceLabelError ?? undefined}
        />
        <div className="w-full">
          <label className="mb-1.5 block text-sm font-medium text-white/80">
            Sentence text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/30 focus:border-accent-blue/50 focus:outline-none focus:ring-1 focus:ring-accent-blue/30"
            placeholder="Enter the sentence text..."
          />
          <p className="mt-1.5 text-sm text-white/60">
            {text.length}/500 characters
          </p>
          {textError && (
            <p className="mt-1.5 text-sm text-accent-red" role="alert">
              {textError}
            </p>
          )}
        </div>
      </div>
    </GlassModal>
  );
}

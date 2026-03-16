"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassSelect } from "@/components/ui/glass-select";
import { GlassButton } from "@/components/ui/glass-button";
import { createLanguage, updateLanguage } from "./actions";
import { toast } from "sonner";

const PREDEFINED_LANGUAGE_OPTIONS = [
  { value: "en-US", label: "en-US" },
  { value: "en-IN", label: "en-IN" },
  { value: "en-UK", label: "en-UK" },
  { value: "en-AU", label: "en-AU" },
  { value: "hi-IN", label: "hi-IN" },
  { value: "fr-FR", label: "fr-FR" },
  { value: "de-DE", label: "de-DE" },
  { value: "es-ES", label: "es-ES" },
  { value: "es-MX", label: "es-MX" },
  { value: "ta-IN", label: "ta-IN" },
  { value: "bn-IN", label: "bn-IN" },
  { value: "gu-IN", label: "gu-IN" },
  { value: "kn-IN", label: "kn-IN" },
  { value: "te-IN", label: "te-IN" },
  { value: "ml-IN", label: "ml-IN" },
  { value: "mr-IN", label: "mr-IN" },
  { value: "pa-IN", label: "pa-IN" },
  { value: "it-IT", label: "it-IT" },
  { value: "zh-CN", label: "zh-CN" },
  { value: "Multilingual", label: "Multilingual" },
  { value: "Codemixed", label: "Codemixed" },
] as const;

type Language = {
  id: string;
  name: string;
  code: string;
};

interface AddLanguageModalProps {
  open: boolean;
  onClose: () => void;
  language?: Language | null;
  existingCodes?: string[];
  onSuccess?: () => void;
}

export function AddLanguageModal({
  open,
  onClose,
  language,
  existingCodes = [],
  onSuccess,
}: AddLanguageModalProps) {
  const [code, setCode] = useState(language?.code ?? "");
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const isEdit = !!language;

  const options = [
    ...PREDEFINED_LANGUAGE_OPTIONS,
    ...(isEdit && language && !PREDEFINED_LANGUAGE_OPTIONS.some((o) => o.value === language.code)
      ? [{ value: language.code, label: language.code }]
      : []),
  ];

  useEffect(() => {
    if (open) {
      setCode(language?.code ?? "");
      setCodeError(null);
    }
  }, [open, language]);

  const validate = () => {
    if (!code.trim()) {
      setCodeError("Language is required");
      return false;
    }
    if (!isEdit && existingCodes.includes(code)) {
      setCodeError("This language already exists");
      return false;
    }
    setCodeError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = isEdit
        ? await updateLanguage(language.id, code.trim(), code.trim())
        : await createLanguage(code.trim(), code.trim());
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Language updated" : "Language added");
      onClose();
      onSuccess?.();
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCode(language?.code ?? "");
    setCodeError(null);
    onClose();
  };

  return (
    <GlassModal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit Language" : "Add Language"}
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
        <GlassSelect
          label="Language / Locale"
          options={options}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={codeError ?? undefined}
        />
      </div>
    </GlassModal>
  );
}

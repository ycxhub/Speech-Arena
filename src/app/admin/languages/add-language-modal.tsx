"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { createLanguage, updateLanguage } from "./actions";
import { toast } from "sonner";

type Language = {
  id: string;
  name: string;
  code: string;
};

interface AddLanguageModalProps {
  open: boolean;
  onClose: () => void;
  language?: Language | null;
  onSuccess?: () => void;
}

export function AddLanguageModal({
  open,
  onClose,
  language,
  onSuccess,
}: AddLanguageModalProps) {
  const [name, setName] = useState(language?.name ?? "");
  const [code, setCode] = useState(language?.code ?? "");
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const isEdit = !!language;

  useEffect(() => {
    if (language) {
      setName(language.name);
      setCode(language.code);
    } else {
      setName("");
      setCode("");
    }
  }, [language, open]);

  const validate = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError("Name is required");
      valid = false;
    } else setNameError(null);
    if (!code.trim()) {
      setCodeError("Code is required");
      valid = false;
    } else {
      const c = code.trim().toLowerCase();
      if (c.length < 2 || c.length > 5) {
        setCodeError("Code must be 2–5 characters");
        valid = false;
      } else if (!/^[a-z0-9]+$/.test(c)) {
        setCodeError("Code must be alphanumeric");
        valid = false;
      } else setCodeError(null);
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = isEdit
        ? await updateLanguage(language.id, name.trim(), code.trim().toLowerCase())
        : await createLanguage(name.trim(), code.trim().toLowerCase());
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Language updated" : "Language added");
      onClose();
      onSuccess?.();
      setName("");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName(language?.name ?? "");
    setCode(language?.code ?? "");
    setNameError(null);
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
        <GlassInput
          label="Language name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError ?? undefined}
          placeholder="e.g. English"
        />
        <GlassInput
          label="Language code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={codeError ?? undefined}
          placeholder="e.g. en"
          helperText="2–5 character alphanumeric (e.g. en, es, hi)"
        />
      </div>
    </GlassModal>
  );
}

"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { createModelDefinition, updateModelDefinition } from "./actions";
import { toast } from "sonner";

type ModelDefinition = {
  id: string;
  name: string;
  model_id: string;
  endpoint?: string | null;
};

interface AddModelDefinitionModalProps {
  open: boolean;
  onClose: () => void;
  providerId: string;
  definition?: ModelDefinition | null;
  onSuccess?: () => void;
}

export function AddModelDefinitionModal({
  open,
  onClose,
  providerId,
  definition,
  onSuccess,
}: AddModelDefinitionModalProps) {
  const [name, setName] = useState(definition?.name ?? "");
  const [modelId, setModelId] = useState(definition?.model_id ?? "");
  const [endpoint, setEndpoint] = useState(definition?.endpoint ?? "");
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [modelIdError, setModelIdError] = useState<string | null>(null);

  const isEdit = !!definition?.id;
  const isDuplicate = !!definition && !definition.id;

  useEffect(() => {
    if (open) {
      setName(definition?.name ?? "");
      setModelId(definition?.model_id ?? "");
      setEndpoint(definition?.endpoint ?? "");
      setNameError(null);
      setModelIdError(null);
    }
  }, [open, definition]);

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
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = isEdit
        ? await updateModelDefinition(definition!.id, providerId, name.trim(), modelId.trim(), endpoint.trim() || undefined)
        : await createModelDefinition(providerId, name.trim(), modelId.trim(), endpoint.trim() || undefined);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Model definition updated" : isDuplicate ? "Model definition duplicated" : "Model definition added");
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
      title={isEdit ? "Edit Model Definition" : isDuplicate ? "Duplicate Model Definition" : "Add Model Definition"}
      footer={
        <>
          <GlassButton variant="ghost" onClick={onClose}>
            Cancel
          </GlassButton>
          <GlassButton type="submit" onClick={handleSubmit} loading={loading} disabled={loading}>
            {isEdit ? "Save" : "Add"}
          </GlassButton>
        </>
      }
    >
      <div className="space-y-4">
        <GlassInput
          label="Name"
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
          label="Endpoint"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="Optional API URL override (uses provider base_url if empty)"
        />
      </div>
    </GlassModal>
  );
}

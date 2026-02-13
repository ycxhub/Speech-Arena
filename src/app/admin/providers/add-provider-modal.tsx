"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { createProvider, updateProvider } from "./actions";
import { toast } from "sonner";

type Provider = {
  id: string;
  name: string;
  slug: string;
  base_url?: string | null;
  model_count_total?: number;
  key_count?: number;
};

interface AddProviderModalProps {
  open: boolean;
  onClose: () => void;
  provider?: Provider | null;
  onSuccess?: () => void;
}

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function AddProviderModal({
  open,
  onClose,
  provider,
  onSuccess,
}: AddProviderModalProps) {
  const [name, setName] = useState(provider?.name ?? "");
  const [slug, setSlug] = useState(provider?.slug ?? "");
  const [baseUrl, setBaseUrl] = useState(provider?.base_url ?? "");
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  const isEdit = !!provider;

  useEffect(() => {
    if (open) {
      const p = provider as Provider | null;
      const n = p?.name ?? "";
      const s = p?.slug ?? "";
      setName(n);
      setSlug(isEdit ? s : slugFromName(n));
      setBaseUrl(p?.base_url ?? "");
    }
  }, [open, provider, isEdit]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!isEdit) setSlug(slugFromName(value));
  };

  const validate = () => {
    let valid = true;
    if (!name.trim()) {
      setNameError("Name is required");
      valid = false;
    } else setNameError(null);
    const s = slug.trim().toLowerCase();
    if (!s) {
      setSlugError("Slug is required");
      valid = false;
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
      setSlugError("Slug must be URL-safe (lowercase alphanumeric and hyphens)");
      valid = false;
    } else setSlugError(null);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result =
        isEdit && provider
          ? await updateProvider(provider.id, name.trim(), slug.trim().toLowerCase(), baseUrl.trim() || undefined)
          : await createProvider(name.trim(), slug.trim().toLowerCase(), baseUrl.trim() || undefined);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Provider updated" : "Provider added");
      onClose();
      onSuccess?.();
      setName("");
      setSlug("");
      setBaseUrl("");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName(provider?.name ?? "");
    setSlug(provider?.slug ?? "");
    setBaseUrl(provider?.base_url ?? "");
    setNameError(null);
    setSlugError(null);
    onClose();
  };

  return (
    <GlassModal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit Provider" : "Add Provider"}
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
          label="Provider name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          error={nameError ?? undefined}
          placeholder="e.g. ElevenLabs"
        />
        <GlassInput
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          error={slugError ?? undefined}
          placeholder="e.g. elevenlabs"
          helperText={
            isEdit && ((provider as Provider)?.model_count_total ?? 0) > 0
              ? "Warning: Changing slug may affect R2 paths. Provider has existing models."
              : isEdit && ((provider as Provider)?.key_count ?? 0) > 0
                ? "Provider has API keys. Slug is used in R2 paths."
                : "URL-safe identifier (lowercase, alphanumeric, hyphens). Used in R2 paths."
          }
        />
        <GlassInput
          label="Base URL"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="e.g. https://api.elevenlabs.io (optional)"
        />
      </div>
    </GlassModal>
  );
}

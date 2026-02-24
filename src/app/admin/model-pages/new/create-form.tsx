"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassSelect } from "@/components/ui/glass-select";
import { createModelPage } from "../actions";
import { toast } from "sonner";

type ProviderWithDefs = {
  id: string;
  name: string;
  slug: string;
  definitions: { id: string; name: string; model_id: string }[];
};

export function CreateModelPageForm({
  providersWithDefs,
}: {
  providersWithDefs: ProviderWithDefs[];
}) {
  const router = useRouter();
  const [providerId, setProviderId] = useState("");
  const [definitionKey, setDefinitionKey] = useState("");
  const [slug, setSlug] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [loading, setLoading] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const selectedProvider = providersWithDefs.find((p) => p.id === providerId);
  const definitions = selectedProvider?.definitions ?? [];
  const definitionOptions = definitions.map((d) => ({
    value: `${providerId}:${d.name}`,
    label: `${d.name} (${d.model_id})`,
  }));

  const handleProviderChange = (val: string) => {
    setProviderId(val);
    setDefinitionKey("");
  };

  const handleDefinitionChange = (val: string) => {
    setDefinitionKey(val);
    if (val && !slug) {
      const [, defName] = val.split(":");
      setSlug(
        defName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId || !definitionKey) {
      toast.error("Select provider and definition");
      return;
    }
    const [, definitionName] = definitionKey.split(":");
    if (!definitionName) {
      toast.error("Invalid definition");
      return;
    }
    const s = slug.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
      setSlugError("Slug must be URL-safe (lowercase alphanumeric and hyphens)");
      return;
    }
    setSlugError(null);
    if (!oneLiner.trim()) {
      toast.error("One-liner is required");
      return;
    }

    setLoading(true);
    try {
      const result = await createModelPage(providerId, definitionName, s, oneLiner.trim());
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Model page created");
      router.push(result.id ? `/admin/model-pages/${result.id}` : "/admin/model-pages");
    } finally {
      setLoading(false);
    }
  };

  const providerOptions = providersWithDefs
    .filter((p) => p.definitions.length > 0)
    .map((p) => ({ value: p.id, label: p.name }));

  return (
    <GlassCard>
      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassSelect
          label="Provider"
          options={providerOptions}
          placeholder="Select provider"
          value={providerId}
          onChange={(e) => handleProviderChange(e.target.value)}
        />

        <GlassSelect
          label="Definition"
          options={definitionOptions}
          placeholder={providerId ? "Select definition" : "Select provider first"}
          value={definitionKey}
          onChange={(e) => handleDefinitionChange(e.target.value)}
          disabled={!providerId}
        />

        <GlassInput
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          error={slugError ?? undefined}
          placeholder="e.g. eleven-multilingual-v2"
          helperText="URL path: /models/[slug]. Lowercase, hyphens only."
        />

        <GlassInput
          label="One-liner"
          value={oneLiner}
          onChange={(e) => setOneLiner(e.target.value)}
          placeholder="Short description (e.g. Best for expressive, multilingual content)"
          required
        />

        <div className="flex gap-3">
          <GlassButton type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </GlassButton>
          <GlassButton
            type="button"
            variant="secondary"
            onClick={() => router.push("/admin/model-pages")}
          >
            Cancel
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  );
}

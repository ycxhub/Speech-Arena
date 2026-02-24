"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassSelect } from "@/components/ui/glass-select";
import { createComparePage } from "../actions";
import { toast } from "sonner";

type ModelPageOption = { id: string; slug: string; label: string };

export function CreateComparePageForm({
  modelPages,
}: {
  modelPages: ModelPageOption[];
}) {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [modelPageAId, setModelPageAId] = useState("");
  const [modelPageBId, setModelPageBId] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const modelOptions = modelPages.map((p) => ({ value: p.id, label: p.label }));
  const slugFromSelection = () => {
    if (modelPageAId && modelPageBId) {
      const a = modelPages.find((p) => p.id === modelPageAId);
      const b = modelPages.find((p) => p.id === modelPageBId);
      if (a && b) return `${a.slug}-vs-${b.slug}`;
    }
    return "";
  };

  const handleModelAChange = (val: string) => {
    setModelPageAId(val);
    if (val && modelPageBId) {
      const a = modelPages.find((p) => p.id === val);
      const b = modelPages.find((p) => p.id === modelPageBId);
      if (a && b) setSlug(`${a.slug}-vs-${b.slug}`);
    }
  };

  const handleModelBChange = (val: string) => {
    setModelPageBId(val);
    if (modelPageAId && val) {
      const a = modelPages.find((p) => p.id === modelPageAId);
      const b = modelPages.find((p) => p.id === val);
      if (a && b) setSlug(`${a.slug}-vs-${b.slug}`);
    }
  };

  const handleUseSuggestedSlug = () => {
    const suggested = slugFromSelection();
    if (suggested) setSlug(suggested);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (!modelPageAId || !modelPageBId) {
      toast.error("Select both Model A and Model B");
      return;
    }
    if (modelPageAId === modelPageBId) {
      toast.error("Model A and Model B must be different");
      return;
    }

    setLoading(true);
    try {
      const result = await createComparePage(
        slug,
        modelPageAId,
        modelPageBId,
        metaTitle.trim() || null,
        metaDescription.trim() || null
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Compare page created");
        router.push("/admin/model-pages/compare");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <GlassSelect
            label="Model A"
            options={[{ value: "", label: "Select model..." }, ...modelOptions]}
            value={modelPageAId}
            onChange={(e) => handleModelAChange(e.target.value)}
          />
        </div>
        <div>
          <GlassSelect
            label="Model B"
            options={[{ value: "", label: "Select model..." }, ...modelOptions]}
            value={modelPageBId}
            onChange={(e) => handleModelBChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <GlassInput
              label="Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. eleven-vs-openai"
            />
          </div>
          <GlassButton
            type="button"
            variant="secondary"
            onClick={handleUseSuggestedSlug}
            disabled={!modelPageAId || !modelPageBId}
          >
            Use suggested
          </GlassButton>
        </div>
        <div>
          <GlassInput
            label="Meta title (optional)"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
          />
        </div>
        <div>
          <GlassInput
            label="Meta description (optional)"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <GlassButton type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </GlassButton>
          <GlassButton
            type="button"
            variant="secondary"
            onClick={() => router.push("/admin/model-pages/compare")}
          >
            Cancel
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  );
}

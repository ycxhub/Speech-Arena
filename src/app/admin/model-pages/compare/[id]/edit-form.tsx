"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassSelect } from "@/components/ui/glass-select";
import { updateComparePage } from "../actions";
import { toast } from "sonner";

type ModelPageOption = { id: string; slug: string; label: string };

export function EditComparePageForm({
  comparePage,
  modelPages,
}: {
  comparePage: Record<string, unknown>;
  modelPages: ModelPageOption[];
}) {
  const router = useRouter();
  const [slug, setSlug] = useState((comparePage.slug as string) ?? "");
  const [modelPageAId, setModelPageAId] = useState((comparePage.model_page_a_id as string) ?? "");
  const [modelPageBId, setModelPageBId] = useState((comparePage.model_page_b_id as string) ?? "");
  const [metaTitle, setMetaTitle] = useState((comparePage.meta_title as string) ?? "");
  const [metaDescription, setMetaDescription] = useState((comparePage.meta_description as string) ?? "");
  const [loading, setLoading] = useState(false);

  const modelOptions = modelPages.map((p) => ({ value: p.id, label: p.label }));

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
      const result = await updateComparePage(comparePage.id as string, {
        slug,
        model_page_a_id: modelPageAId,
        model_page_b_id: modelPageBId,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Compare page updated");
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
            onChange={(e) => setModelPageAId(e.target.value)}
          />
        </div>
        <div>
          <GlassSelect
            label="Model B"
            options={[{ value: "", label: "Select model..." }, ...modelOptions]}
            value={modelPageBId}
            onChange={(e) => setModelPageBId(e.target.value)}
          />
        </div>
        <div>
          <GlassInput
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. eleven-vs-openai"
          />
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
            {loading ? "Saving..." : "Save"}
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

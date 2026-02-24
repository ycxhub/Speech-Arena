"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassSelect } from "@/components/ui/glass-select";
import type { ModelPageData } from "@/lib/models/get-model-page";

export function CompareHubClient({ modelPages }: { modelPages: ModelPageData[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillSlug = searchParams.get("model") ?? "";

  const [modelA, setModelA] = useState(prefillSlug);
  const [modelB, setModelB] = useState("");

  const options = modelPages.map((m) => ({ value: m.slug, label: `${m.definition_name} (${m.provider_name})` }));

  const handleCompare = () => {
    if (!modelA || !modelB) return;
    if (modelA === modelB) return;
    const slugA = modelA < modelB ? modelA : modelB;
    const slugB = modelA < modelB ? modelB : modelA;
    router.push(`/models/compare/${slugA}-vs-${slugB}`);
  };

  return (
    <GlassCard>
      <div className="space-y-4">
        <GlassSelect
          label="Model A"
          options={options}
          placeholder="Select first model"
          value={modelA}
          onChange={(e) => setModelA(e.target.value)}
        />
        <GlassSelect
          label="Model B"
          options={options}
          placeholder="Select second model"
          value={modelB}
          onChange={(e) => setModelB(e.target.value)}
        />
        <GlassButton
          onClick={handleCompare}
          disabled={!modelA || !modelB || modelA === modelB}
        >
          Compare
        </GlassButton>
      </div>
    </GlassCard>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { updateModelPage } from "../actions";
import { toast } from "sonner";

type ModelPage = Record<string, unknown>;

export function EditModelPageForm({ modelPage }: { modelPage: ModelPage }) {
  const router = useRouter();
  const id = modelPage.id as string;

  const [slug, setSlug] = useState((modelPage.slug as string) ?? "");
  const [logoUrl, setLogoUrl] = useState((modelPage.logo_url as string) ?? "");
  const [oneLiner, setOneLiner] = useState((modelPage.one_liner as string) ?? "");
  const [overviewMd, setOverviewMd] = useState((modelPage.overview_md as string) ?? "");
  const [rankOverride, setRankOverride] = useState<string>(
    modelPage.rank_override != null ? String(modelPage.rank_override) : ""
  );
  const [useEloRank, setUseEloRank] = useState((modelPage.use_elo_rank as boolean) ?? true);
  const [latencyMs, setLatencyMs] = useState<string>(
    modelPage.latency_ms != null ? String(modelPage.latency_ms) : ""
  );
  const [priceInput, setPriceInput] = useState<string>(
    modelPage.price_input_per_million_chars != null
      ? String(modelPage.price_input_per_million_chars)
      : ""
  );
  const [priceOutput, setPriceOutput] = useState<string>(
    modelPage.price_output_per_million_chars != null
      ? String(modelPage.price_output_per_million_chars)
      : ""
  );
  const [dataResidency, setDataResidency] = useState((modelPage.data_residency as string) ?? "");
  const [onPrem, setOnPrem] = useState<boolean | null>(
    modelPage.on_prem as boolean | null ?? null
  );
  const [launchedAtText, setLaunchedAtText] = useState((modelPage.launched_at_text as string) ?? "");
  const [multilingual, setMultilingual] = useState<boolean | null>(
    modelPage.multilingual as boolean | null ?? null
  );
  const [endpointStreaming, setEndpointStreaming] = useState(
    (modelPage.endpoint_streaming as boolean) ?? false
  );
  const [endpointWebsocket, setEndpointWebsocket] = useState(
    (modelPage.endpoint_websocket as boolean) ?? false
  );
  const [endpointNonStreaming, setEndpointNonStreaming] = useState(
    (modelPage.endpoint_non_streaming as boolean) ?? false
  );
  const [featureVoiceCloning, setFeatureVoiceCloning] = useState<boolean | null>(
    modelPage.feature_voice_cloning as boolean | null ?? null
  );
  const [featureVoiceDesign, setFeatureVoiceDesign] = useState<boolean | null>(
    modelPage.feature_voice_design as boolean | null ?? null
  );
  const [featureOpenSource, setFeatureOpenSource] = useState<boolean | null>(
    modelPage.feature_open_source as boolean | null ?? null
  );
  const [useCaseConversational, setUseCaseConversational] = useState<boolean | null>(
    modelPage.use_case_conversational as boolean | null ?? null
  );
  const [useCaseVoiceAgents, setUseCaseVoiceAgents] = useState<boolean | null>(
    modelPage.use_case_voice_agents as boolean | null ?? null
  );
  const [useCaseExpressive, setUseCaseExpressive] = useState<boolean | null>(
    modelPage.use_case_expressive as boolean | null ?? null
  );
  const [useCaseFlatContent, setUseCaseFlatContent] = useState<boolean | null>(
    modelPage.use_case_flat_content as boolean | null ?? null
  );
  const [useCaseMultilingual, setUseCaseMultilingual] = useState<boolean | null>(
    modelPage.use_case_multilingual as boolean | null ?? null
  );
  const [strengthsStr, setStrengthsStr] = useState(
    Array.isArray(modelPage.strengths) ? (modelPage.strengths as string[]).join("\n") : ""
  );
  const [weaknessesStr, setWeaknessesStr] = useState(
    Array.isArray(modelPage.weaknesses) ? (modelPage.weaknesses as string[]).join("\n") : ""
  );
  const [pricingDescription, setPricingDescription] = useState(
    (modelPage.pricing_description as string) ?? ""
  );
  const [metaTitle, setMetaTitle] = useState((modelPage.meta_title as string) ?? "");
  const [metaDescription, setMetaDescription] = useState((modelPage.meta_description as string) ?? "");
  const [isFeatured, setIsFeatured] = useState((modelPage.is_featured as boolean) ?? false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = slug.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
      toast.error("Slug must be URL-safe");
      return;
    }
    if (!oneLiner.trim()) {
      toast.error("One-liner is required");
      return;
    }

    setLoading(true);
    try {
      const result = await updateModelPage(id, {
        slug: s,
        logo_url: logoUrl.trim() || null,
        one_liner: oneLiner.trim(),
        overview_md: overviewMd.trim() || null,
        rank_override: rankOverride ? parseInt(rankOverride, 10) : null,
        use_elo_rank: useEloRank,
        latency_ms: latencyMs ? parseInt(latencyMs, 10) : null,
        price_input_per_million_chars: priceInput ? parseFloat(priceInput) : null,
        price_output_per_million_chars: priceOutput ? parseFloat(priceOutput) : null,
        data_residency: dataResidency.trim() || null,
        on_prem: onPrem,
        launched_at_text: launchedAtText.trim() || null,
        multilingual,
        endpoint_streaming: endpointStreaming,
        endpoint_websocket: endpointWebsocket,
        endpoint_non_streaming: endpointNonStreaming,
        feature_voice_cloning: featureVoiceCloning,
        feature_voice_design: featureVoiceDesign,
        feature_open_source: featureOpenSource,
        use_case_conversational: useCaseConversational,
        use_case_voice_agents: useCaseVoiceAgents,
        use_case_expressive: useCaseExpressive,
        use_case_flat_content: useCaseFlatContent,
        use_case_multilingual: useCaseMultilingual,
        strengths: strengthsStr.trim() ? strengthsStr.trim().split("\n").filter(Boolean) : [],
        weaknesses: weaknessesStr.trim() ? weaknessesStr.trim().split("\n").filter(Boolean) : [],
        pricing_description: pricingDescription.trim() || null,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        is_featured: isFeatured,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Model page updated");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const Checkbox = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex items-center gap-2">
        <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-white/20"
      />
      <span className="text-sm text-white/80">{label}</span>
    </label>
  );

  const TriState = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean | null;
    onChange: (v: boolean | null) => void;
  }) => (
    <div className="flex items-center gap-2">
      <span className="w-32 text-sm text-white/80">{label}</span>
      <select
        value={value === null ? "" : value ? "yes" : "no"}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : v === "yes");
        }}
        className="rounded border border-white/10 bg-white/5 px-2 py-1 text-white"
      >
        <option value="">—</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <GlassCard>
        <h2 className="mb-4 text-lg font-medium text-white">Basic</h2>
        <div className="space-y-4">
          <GlassInput label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          <GlassInput
            label="Model logo URL"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
          />
          <GlassInput
            label="One-liner"
            value={oneLiner}
            onChange={(e) => setOneLiner(e.target.value)}
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">Overview (markdown)</label>
            <textarea
              value={overviewMd}
              onChange={(e) => setOverviewMd(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-lg font-medium text-white">Rank &amp; Stats</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useEloRank}
              onChange={(e) => setUseEloRank(e.target.checked)}
            />
            <span className="text-sm text-white/80">Use ELO rank when available</span>
          </div>
          <GlassInput
            label="Rank override"
            value={rankOverride}
            onChange={(e) => setRankOverride(e.target.value)}
            placeholder="e.g. 3"
          />
          <GlassInput
            label="Latency (ms)"
            value={latencyMs}
            onChange={(e) => setLatencyMs(e.target.value)}
            type="number"
          />
          <GlassInput
            label="Price input (per 1M chars)"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            type="number"
            step="0.01"
          />
          <GlassInput
            label="Price output (per 1M chars)"
            value={priceOutput}
            onChange={(e) => setPriceOutput(e.target.value)}
            type="number"
            step="0.01"
          />
          <GlassInput
            label="Data residency"
            value={dataResidency}
            onChange={(e) => setDataResidency(e.target.value)}
            placeholder="e.g. US, EU, 10+ regions"
          />
          <TriState label="On-prem" value={onPrem} onChange={setOnPrem} />
          <GlassInput
            label="Launched (text)"
            value={launchedAtText}
            onChange={(e) => setLaunchedAtText(e.target.value)}
            placeholder="e.g. Jan 2024"
          />
          <TriState label="Multilingual" value={multilingual} onChange={setMultilingual} />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-lg font-medium text-white">Endpoints</h2>
        <div className="flex flex-wrap gap-4">
          <Checkbox label="Streaming" checked={endpointStreaming} onChange={setEndpointStreaming} />
          <Checkbox label="WebSocket" checked={endpointWebsocket} onChange={setEndpointWebsocket} />
          <Checkbox
            label="Non-streaming"
            checked={endpointNonStreaming}
            onChange={setEndpointNonStreaming}
          />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-lg font-medium text-white">Features &amp; Use cases</h2>
        <div className="space-y-2">
          <TriState label="Voice cloning" value={featureVoiceCloning} onChange={setFeatureVoiceCloning} />
          <TriState label="Voice design" value={featureVoiceDesign} onChange={setFeatureVoiceDesign} />
          <TriState label="Open source" value={featureOpenSource} onChange={setFeatureOpenSource} />
          <TriState
            label="Conversational AI"
            value={useCaseConversational}
            onChange={setUseCaseConversational}
          />
          <TriState
            label="Voice agents"
            value={useCaseVoiceAgents}
            onChange={setUseCaseVoiceAgents}
          />
          <TriState
            label="Expressive"
            value={useCaseExpressive}
            onChange={setUseCaseExpressive}
          />
          <TriState
            label="Flat content"
            value={useCaseFlatContent}
            onChange={setUseCaseFlatContent}
          />
          <TriState
            label="Multilingual"
            value={useCaseMultilingual}
            onChange={setUseCaseMultilingual}
          />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-lg font-medium text-white">Content</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">Strengths (one per line)</label>
            <textarea
              value={strengthsStr}
              onChange={(e) => setStrengthsStr(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">Weaknesses (one per line)</label>
            <textarea
              value={weaknessesStr}
              onChange={(e) => setWeaknessesStr(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">Pricing description</label>
            <textarea
              value={pricingDescription}
              onChange={(e) => setPricingDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-lg font-medium text-white">SEO &amp; Featured</h2>
        <div className="space-y-4">
          <GlassInput
            label="Meta title"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
          />
          <GlassInput
            label="Meta description"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            <span className="text-sm text-white/80">Featured (show in Featured Models section)</span>
          </div>
        </div>
      </GlassCard>

      <div className="flex gap-3">
        <GlassButton type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
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
  );
}

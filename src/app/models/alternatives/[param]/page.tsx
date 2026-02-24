import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminClient } from "@/lib/supabase/admin";
import { getModelPageBySlug } from "@/lib/models/get-model-page";
import { GlassCard } from "@/components/ui/glass-card";
import type { ModelPageData } from "@/lib/models/get-model-page";

type Props = { params: Promise<{ param: string }> };

function extractSlug(param: string): string | null {
  if (!param.endsWith("-alternatives")) return null;
  return param.slice(0, -12); // "-alternatives".length === 12
}

export async function generateMetadata({ params }: Props) {
  const { param } = await params;
  const slug = extractSlug(param);
  if (!slug) return { title: "Alternatives | TTS Battles" };
  const page = await getModelPageBySlug(slug);
  if (!page) return { title: "Alternatives | TTS Battles" };
  return {
    title: `${page.definition_name} Alternatives | Top 10 TTS Models | TTS Battles`,
    description: `Discover the top 10 alternatives to ${page.definition_name}. Compare pricing, latency, and capabilities.`,
  };
}

export default async function AlternativesPage({ params }: Props) {
  const { param } = await params;
  const slug = extractSlug(param);
  if (!slug) notFound();

  const anchorPage = await getModelPageBySlug(slug);
  if (!anchorPage) notFound();

  const admin = getAdminClient();
  const { data: leaderboard } = await admin.rpc("get_leaderboard_global_model", {
    p_provider_id: undefined,
    p_min_matches: undefined,
  });

  const rows = (leaderboard ?? []) as {
    provider_id: string;
    definition_name: string;
    rating: number;
  }[];

  const { data: allModelPages } = await admin
    .from("model_pages")
    .select("*, providers(name, slug, logo_url)");

  const modelPagesByKey = new Map<string, Record<string, unknown>>();
  for (const mp of allModelPages ?? []) {
    const key = `${mp.provider_id}:${mp.definition_name}`;
    modelPagesByKey.set(key, mp);
  }

  const anchorKey = `${anchorPage.provider_id}:${anchorPage.definition_name}`;
  const alternatives: ModelPageData[] = [];
  for (const row of rows) {
    const key = `${row.provider_id}:${row.definition_name}`;
    if (key === anchorKey) continue;
    const mp = modelPagesByKey.get(key);
    if (!mp) continue;
    const p = mp.providers as { name: string; slug: string; logo_url: string | null } | null;
    alternatives.push({
      ...mp,
      provider_name: p?.name,
      provider_slug: p?.slug,
      provider_logo_url: p?.logo_url,
      strengths: Array.isArray(mp.strengths) ? mp.strengths : [],
      weaknesses: Array.isArray(mp.weaknesses) ? mp.weaknesses : [],
    } as ModelPageData);
    if (alternatives.length >= 10) break;
  }

  const AltCard = ({ model, rank }: { model: ModelPageData; rank: number }) => (
    <GlassCard>
      <div className="flex gap-4">
        {model.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={model.logo_url}
            alt=""
            width={64}
            height={64}
            className="shrink-0 rounded-lg object-contain"
          />
        ) : (
          <div className="h-16 w-16 shrink-0 rounded-lg bg-white/10" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white/60">#{rank}</p>
          <Link href={`/models/${model.slug}`} className="font-medium text-white hover:underline">
            {model.definition_name}
          </Link>
          <p className="text-sm text-white/60">{model.provider_name}</p>
          <p className="mt-1 text-sm text-white/80">{model.one_liner}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/60">
            {model.latency_ms != null && <span>Latency: {model.latency_ms} ms</span>}
            {model.price_input_per_million_chars != null && (
              <span>${model.price_input_per_million_chars}/1M chars</span>
            )}
          </div>
          <Link
            href={`/models/${model.slug}`}
            className="mt-2 inline-block text-sm text-accent-blue hover:underline"
          >
            View full details →
          </Link>
        </div>
      </div>
    </GlassCard>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Top {alternatives.length} alternatives to {anchorPage.definition_name}
        </h1>
        <p className="mt-2 text-white/60">{anchorPage.one_liner}</p>
      </div>

      {alternatives.length === 0 ? (
        <p className="text-white/60">No alternatives with model pages yet.</p>
      ) : (
        <div className="space-y-4">
          {alternatives.map((m, i) => (
            <AltCard key={m.id} model={m} rank={i + 1} />
          ))}
        </div>
      )}

      <div className="flex gap-4 text-sm">
        <Link href={`/models/${anchorPage.slug}`} className="text-accent-blue hover:underline">
          ← Back to {anchorPage.definition_name}
        </Link>
        <Link href="/models" className="text-accent-blue hover:underline">
          All models
        </Link>
      </div>
    </div>
  );
}

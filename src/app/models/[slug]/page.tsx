import { notFound } from "next/navigation";
import Link from "next/link";
import { getModelPageBySlug } from "@/lib/models/get-model-page";
import { getLeaderboardRank } from "@/lib/models/get-leaderboard-rank";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const page = await getModelPageBySlug(slug);
  if (!page) return { title: "Model not found" };
  const title = (page.meta_title as string) || `${page.definition_name} | TTS Battles`;
  const description =
    (page.meta_description as string) || page.one_liner;
  return { title, description };
}

export default async function ModelPage({ params }: Props) {
  const { slug } = await params;
  const page = await getModelPageBySlug(slug);
  if (!page) notFound();

  const rankResult = await getLeaderboardRank(
    page.provider_id,
    page.definition_name,
    page.use_elo_rank,
    page.rank_override
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      {/* Hero */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          {page.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.logo_url}
              alt=""
              width={120}
              height={120}
              className="shrink-0 rounded-xl object-contain"
            />
          ) : (
            <div className="h-[120px] w-[120px] shrink-0 rounded-xl bg-white/10" />
          )}
          <div>
            <h1 className="text-2xl font-semibold text-white">{page.definition_name}</h1>
            <p className="text-white/60">{page.provider_name ?? "—"}</p>
            <p className="mt-1 hidden text-white/80 sm:block">{page.one_liner}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/models/compare">
            <GlassButton variant="secondary">Compare</GlassButton>
          </Link>
          <Link href={`/models/alternatives/${slug}-alternatives`}>
            <GlassButton variant="secondary">Alternatives</GlassButton>
          </Link>
          <Link href="/custom-test">
            <GlassButton>Try in Playground</GlassButton>
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <GlassCard>
        <div className="flex flex-wrap gap-6 lg:flex-row lg:justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase text-white/40">Leaderboard</span>
            <span className="font-medium text-white">{rankResult.display}</span>
          </div>
          {page.latency_ms != null && (
            <div className="flex flex-col">
              <span className="text-xs uppercase text-white/40">Latency</span>
              <span className="font-medium text-white">{page.latency_ms} ms</span>
            </div>
          )}
          {(page.price_input_per_million_chars != null || page.price_output_per_million_chars != null) && (
            <div className="flex flex-col">
              <span className="text-xs uppercase text-white/40">Price (per 1M chars)</span>
              <span className="font-medium text-white">
                {page.price_input_per_million_chars != null && page.price_output_per_million_chars != null
                  ? `$${page.price_input_per_million_chars} • $${page.price_output_per_million_chars} In/Out`
                  : page.price_input_per_million_chars != null
                    ? `$${page.price_input_per_million_chars}`
                    : `$${page.price_output_per_million_chars}`}
              </span>
            </div>
          )}
          {page.data_residency && (
            <div className="flex flex-col">
              <span className="text-xs uppercase text-white/40">Data residency</span>
              <span className="font-medium text-white">{page.data_residency}</span>
            </div>
          )}
          {page.on_prem != null && (
            <div className="flex flex-col">
              <span className="text-xs uppercase text-white/40">On-prem</span>
              <span className="font-medium text-white">{page.on_prem ? "Yes" : "No"}</span>
            </div>
          )}
          {(page.launched_at_text || page.launched_at) && (
            <div className="flex flex-col">
              <span className="text-xs uppercase text-white/40">Launched</span>
              <span className="font-medium text-white">
                {page.launched_at_text ?? (page.launched_at as string)?.slice(0, 7)}
              </span>
            </div>
          )}
          {page.multilingual != null && (
            <div className="flex flex-col">
              <span className="text-xs uppercase text-white/40">Multilingual</span>
              <span className="font-medium text-white">{page.multilingual ? "Yes" : "No"}</span>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Overview */}
      {page.overview_md && (
        <GlassCard>
          <h2 className="mb-4 text-lg font-medium text-white">Overview</h2>
          <div className="prose prose-invert max-w-none text-white/80">
            <p className="whitespace-pre-wrap">{page.overview_md}</p>
          </div>
        </GlassCard>
      )}

      {/* Endpoints */}
      <GlassCard>
        <h2 className="mb-4 text-lg font-medium text-white">Endpoints</h2>
        <div className="flex flex-wrap gap-4">
          <span className="text-sm text-white/80">
            Streaming: {page.endpoint_streaming ? "Yes" : "No"}
          </span>
          <span className="text-sm text-white/80">
            WebSocket: {page.endpoint_websocket ? "Yes" : "No"}
          </span>
          <span className="text-sm text-white/80">
            Non-streaming: {page.endpoint_non_streaming ? "Yes" : "No"}
          </span>
        </div>
      </GlassCard>

      {/* Strengths / Weaknesses */}
      {(page.strengths.length > 0 || page.weaknesses.length > 0) && (
        <div className="grid gap-6 sm:grid-cols-2">
          {page.strengths.length > 0 && (
            <GlassCard>
              <h2 className="mb-4 text-lg font-medium text-white">Strengths</h2>
              <ul className="list-inside list-disc space-y-1 text-sm text-white/80">
                {page.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </GlassCard>
          )}
          {page.weaknesses.length > 0 && (
            <GlassCard>
              <h2 className="mb-4 text-lg font-medium text-white">Limitations</h2>
              <ul className="list-inside list-disc space-y-1 text-sm text-white/80">
                {page.weaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </GlassCard>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-8 text-sm">
        <Link href="/models" className="text-accent-blue hover:underline">
          All models
        </Link>
        <Link href="/models/compare" className="text-accent-blue hover:underline">
          Compare
        </Link>
        <Link href="/leaderboard" className="text-accent-blue hover:underline">
          Leaderboard
        </Link>
      </div>
    </div>
  );
}

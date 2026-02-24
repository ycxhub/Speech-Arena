import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminClient } from "@/lib/supabase/admin";
import { getModelPageBySlug } from "@/lib/models/get-model-page";
import { GlassCard } from "@/components/ui/glass-card";
import type { ModelPageData } from "@/lib/models/get-model-page";

type Props = { params: Promise<{ slug: string }> };

function parseCompareSlug(slug: string): { slugA: string; slugB: string } | null {
  const lastVs = slug.lastIndexOf("-vs-");
  if (lastVs < 0) return null;
  const slugA = slug.slice(0, lastVs);
  const slugB = slug.slice(lastVs + 4);
  if (!slugA || !slugB) return null;
  return { slugA, slugB };
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const admin = getAdminClient();
  const { data: cp } = await admin.from("compare_pages").select("meta_title").eq("slug", slug).single();
  if (cp?.meta_title) return { title: cp.meta_title };

  const parsed = parseCompareSlug(slug);
  if (!parsed) return { title: "Compare | TTS Battles" };
  const [pageA, pageB] = await Promise.all([
    getModelPageBySlug(parsed.slugA),
    getModelPageBySlug(parsed.slugB),
  ]);
  if (!pageA || !pageB) return { title: "Compare | TTS Battles" };
  return {
    title: `${pageA.definition_name} vs ${pageB.definition_name} | TTS Battles`,
    description: `Compare ${pageA.definition_name} and ${pageB.definition_name}: pricing, latency, and capabilities.`,
  };
}

async function getCompareModels(slug: string): Promise<{ pageA: ModelPageData; pageB: ModelPageData } | null> {
  const admin = getAdminClient();

  const { data: cp } = await admin
    .from("compare_pages")
    .select("model_page_a_id, model_page_b_id")
    .eq("slug", slug)
    .single();

  if (cp) {
    const { data: a } = await admin
      .from("model_pages")
      .select("*, providers(name, slug, logo_url)")
      .eq("id", cp.model_page_a_id)
      .single();
    const { data: b } = await admin
      .from("model_pages")
      .select("*, providers(name, slug, logo_url)")
      .eq("id", cp.model_page_b_id)
      .single();
    if (!a || !b) return null;
    const toPage = (row: Record<string, unknown>) => {
      const p = row.providers as { name: string; slug: string; logo_url: string | null } | null;
      return {
        ...row,
        provider_name: p?.name,
        provider_slug: p?.slug,
        provider_logo_url: p?.logo_url,
        strengths: Array.isArray(row.strengths) ? row.strengths : [],
        weaknesses: Array.isArray(row.weaknesses) ? row.weaknesses : [],
      } as ModelPageData;
    };
    return { pageA: toPage(a), pageB: toPage(b) };
  }

  const parsed = parseCompareSlug(slug);
  if (!parsed) return null;
  const [pageA, pageB] = await Promise.all([
    getModelPageBySlug(parsed.slugA),
    getModelPageBySlug(parsed.slugB),
  ]);
  if (!pageA || !pageB) return null;
  return { pageA, pageB };
}

function ModelCompareCard({ page }: { page: ModelPageData }) {
  return (
    <GlassCard>
      <Link href={`/models/${page.slug}`} className="block">
        <div className="flex gap-4">
          {page.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.logo_url}
              alt=""
              width={64}
              height={64}
              className="shrink-0 rounded-lg object-contain"
            />
          ) : (
            <div className="h-16 w-16 shrink-0 rounded-lg bg-white/10" />
          )}
          <div>
            <h3 className="font-medium text-white">{page.definition_name}</h3>
            <p className="text-sm text-white/60">{page.provider_name}</p>
            <p className="mt-1 text-sm text-white/80">{page.one_liner}</p>
          </div>
        </div>
      </Link>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/80">
        {page.latency_ms != null && <span>Latency: {page.latency_ms} ms</span>}
        {page.price_input_per_million_chars != null && (
          <span>Price: ${page.price_input_per_million_chars}/1M chars</span>
        )}
        {page.data_residency && <span>Residency: {page.data_residency}</span>}
      </div>
    </GlassCard>
  );
}

export default async function ComparePage({ params }: Props) {
  const { slug } = await params;
  const models = await getCompareModels(slug);
  if (!models) notFound();

  const { pageA, pageB } = models;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <h1 className="text-2xl font-bold text-white">
        {pageA.definition_name} vs {pageB.definition_name}
      </h1>

      <div className="grid gap-6 sm:grid-cols-2">
        <ModelCompareCard page={pageA} />
        <ModelCompareCard page={pageB} />
      </div>

      <div className="flex gap-4 text-sm">
        <Link href="/models/compare" className="text-accent-blue hover:underline">
          Compare different models
        </Link>
        <Link href="/models" className="text-accent-blue hover:underline">
          All models
        </Link>
      </div>
    </div>
  );
}

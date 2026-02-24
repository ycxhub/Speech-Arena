import { listAllModelPages } from "@/lib/models/get-model-page";
import Link from "next/link";

export const revalidate = 300;

export const metadata = {
  title: "TTS Models | Compare Text-to-Speech | TTS Battles",
  description:
    "Explore and compare TTS models. Find the best text-to-speech engines for voice agents, multilingual content, and expressive audio.",
};

export default async function ModelsPage() {
  const modelPages = await listAllModelPages();

  const featured = modelPages.filter((m) => m.is_featured);
  const voiceAgents = modelPages.filter((m) => m.use_case_voice_agents === true);
  const multilingual = modelPages.filter((m) => m.use_case_multilingual === true);
  const expressive = modelPages.filter((m) => m.use_case_expressive === true);

  const ModelCard = ({
    model,
    compact = false,
  }: {
    model: (typeof modelPages)[0];
    compact?: boolean;
  }) => (
    <Link
      href={`/models/${model.slug}`}
      className="block rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
    >
      <div className="flex items-start gap-4">
        {model.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={model.logo_url}
            alt=""
            width={compact ? 48 : 64}
            height={compact ? 48 : 64}
            className="shrink-0 rounded-lg object-contain"
          />
        ) : (
          <div
            className="shrink-0 rounded-lg bg-white/10"
            style={{ width: compact ? 48 : 64, height: compact ? 48 : 64 }}
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-white">{model.definition_name}</h3>
          <p className="text-sm text-white/60">{model.provider_name ?? "—"}</p>
          {!compact && (
            <p className="mt-1 line-clamp-2 text-sm text-white/80">{model.one_liner}</p>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-6 py-10">
      <div>
        <h1 className="text-3xl font-bold text-white">TTS Models</h1>
        <p className="mt-2 text-white/60">
          Explore and compare text-to-speech models. Find the best engine for your use case.
        </p>
      </div>

      {featured.length > 0 && (
        <section id="featured" className="scroll-mt-24">
          <h2 className="mb-4 text-xl font-semibold text-white">Featured Models</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 4).map((m) => (
              <ModelCard key={m.id} model={m} />
            ))}
          </div>
        </section>
      )}

      {voiceAgents.length > 0 && (
        <section id="voice-agents" className="scroll-mt-24">
          <h2 className="mb-4 text-xl font-semibold text-white">Models for Voice Agents</h2>
          <p className="mb-4 text-sm text-white/60">
            TTS models suited for voice agents and conversational AI.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {voiceAgents.map((m) => (
              <ModelCard key={m.id} model={m} />
            ))}
          </div>
        </section>
      )}

      {multilingual.length > 0 && (
        <section id="multilingual" className="scroll-mt-24">
          <h2 className="mb-4 text-xl font-semibold text-white">
            Models for creating Multilingual content
          </h2>
          <p className="mb-4 text-sm text-white/60">
            TTS models with strong multilingual support.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {multilingual.map((m) => (
              <ModelCard key={m.id} model={m} />
            ))}
          </div>
        </section>
      )}

      {expressive.length > 0 && (
        <section id="expressive" className="scroll-mt-24">
          <h2 className="mb-4 text-xl font-semibold text-white">Models that are very expressive</h2>
          <p className="mb-4 text-sm text-white/60">
            TTS models optimized for expressive, emotive content.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {expressive.map((m) => (
              <ModelCard key={m.id} model={m} />
            ))}
          </div>
        </section>
      )}

      <section id="all" className="scroll-mt-24">
        <h2 className="mb-4 text-xl font-semibold text-white">All Models</h2>
        <p className="mb-4 text-sm text-white/60">
          Diverse models for a variety of tasks.
        </p>
        {modelPages.length === 0 ? (
          <p className="text-white/60">No model pages yet. Check back soon.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modelPages.map((m) => (
              <ModelCard key={m.id} model={m} />
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-4 text-sm">
        <a href="#featured" className="text-accent-blue hover:underline">
          Featured
        </a>
        <a href="#voice-agents" className="text-accent-blue hover:underline">
          Voice Agents
        </a>
        <a href="#multilingual" className="text-accent-blue hover:underline">
          Multilingual
        </a>
        <a href="#expressive" className="text-accent-blue hover:underline">
          Expressive
        </a>
        <a href="#all" className="text-accent-blue hover:underline">
          All Models
        </a>
      </div>
    </div>
  );
}

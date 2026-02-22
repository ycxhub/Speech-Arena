import Link from "next/link";

export const metadata = {
  title: "Methodology | Speech Arena",
  description:
    "How Speech Arena ranks text-to-speech models through blind listening tests, ELO ratings, and crowd-sourced votes.",
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-12">
      <div>
        <Link
          href="/"
          className="text-sm text-accent-blue hover:text-accent-blue/80"
        >
          ← Back to home
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-white">Methodology</h1>

      <div className="space-y-8 text-white/80">
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Blind listening tests
          </h2>
          <p className="leading-relaxed">
            Provider and model names are hidden until after you vote. This
            prevents bias from brand recognition or prior experience. You judge
            purely on how the voice sounds.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Randomized A/B order
          </h2>
          <p className="leading-relaxed">
            The order of the two clips (A vs B) is randomized for each round.
            This reduces position bias—the tendency to prefer the first or
            second option regardless of quality.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Controlled comparison
          </h2>
          <p className="leading-relaxed">
            Both clips use the same sentence. This keeps the comparison fair:
            you&apos;re evaluating how different models render the same text,
            not different content.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            ELO rating system
          </h2>
          <p className="leading-relaxed">
            Rankings update using an ELO system, similar to chess. When you vote
            for one model over another, their ratings adjust based on the
            expected outcome. Stronger models gain less from beating weaker
            ones; upsets move the needle more.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Auditability
          </h2>
          <p className="leading-relaxed">
            Votes are logged for auditability. We can trace how ratings evolved
            and verify the integrity of the leaderboard over time.
          </p>
        </section>
      </div>

      <div className="flex flex-col items-center gap-4 pt-8 sm:flex-row sm:gap-6">
        <Link
          href="/blind-test"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-accent-blue px-6 py-3 text-base font-medium text-accent-blue-cta-text transition-colors hover:bg-accent-blue/90"
        >
          Start Blind Test
        </Link>
        <Link
          href="/leaderboard"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent-blue px-6 py-3 text-base font-medium text-accent-blue transition-colors hover:bg-accent-blue/10"
        >
          View Leaderboard
        </Link>
      </div>
    </div>
  );
}

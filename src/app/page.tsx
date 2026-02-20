import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const blindTestHref = user ? "/blind-test" : "/auth/sign-in";

  return (
    <>
      {/* 1st Fold */}
      <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center px-4 py-12">
        <div className="flex max-w-2xl flex-col items-center gap-8 text-center">
          <Image
            src="/speech-arena-logo.png"
            alt="Speech Arena"
            width={240}
            height={84}
            className="h-16 w-auto object-contain"
            priority
          />

          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Best text-to-speech models, ranked by blind listening tests.
            </h1>
            <p className="text-lg text-white/70 sm:text-xl">
              Ranked through crowd-sourced blind tests. Listen to two samples,
              pick the better voice, and help build a public leaderboard you can
              trust. Explore the leaderboard, or run your own comparisons.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href={blindTestHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-accent-blue px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-accent-blue/90 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
            >
              Start Blind Test
            </Link>
            <div className="flex flex-col items-center gap-1">
              <Link
                href="/leaderboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent-blue px-6 py-3 text-lg font-medium text-accent-blue transition-colors hover:bg-accent-blue/10 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
              >
                View leaderboard
              </Link>
              <span className="text-sm text-white/50">No sign-in required</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2nd Fold: Methodology */}
      <section
        id="methodology"
        className="flex w-full flex-col items-center gap-8 border-t border-white/10 px-4 py-16"
      >
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Methodology, in brief
        </h2>
        <ul className="flex max-w-2xl flex-col gap-4 text-left text-white/80">
          <li className="flex gap-3">
            <span className="text-accent-blue">•</span>
            Provider and model names are hidden until after you vote
          </li>
          <li className="flex gap-3">
            <span className="text-accent-blue">•</span>
            A/B order is randomized to reduce position bias
          </li>
          <li className="flex gap-3">
            <span className="text-accent-blue">•</span>
            Both clips use the same sentence (controlled comparison)
          </li>
          <li className="flex gap-3">
            <span className="text-accent-blue">•</span>
            Rankings update using an ELO system
          </li>
          <li className="flex gap-3">
            <span className="text-accent-blue">•</span>
            Votes are logged for auditability
          </li>
        </ul>
        <Link
          href="/methodology"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent-blue px-6 py-3 text-base font-medium text-accent-blue transition-colors hover:bg-accent-blue/10 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
        >
          See methodology
        </Link>
      </section>

      {/* Footer */}
      <div className="flex w-full items-center justify-center border-t border-white/10 py-8">
        <Image
          src="/speech-arena-footer-logo.png"
          alt="speecharena.org"
          width={200}
          height={48}
          className="h-10 w-auto object-contain opacity-100"
        />
      </div>
    </>
  );
}

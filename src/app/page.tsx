import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const getStartedHref = user ? "/blind-test" : "/auth/sign-in";

  return (
    <>
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
              Speech Arena
            </h1>
            <p className="text-lg text-white/70 sm:text-xl">
              Rank speech models through crowd-sourced blind tests. Listen to two
              samples, pick the better voice, and help build the definitive
              leaderboard for text-to-speech.
            </p>
          </div>

          <Link
            href={getStartedHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-accent-blue px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-accent-blue/90 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlassTabs } from "@/components/ui/glass-tabs";

const NAV_TABS = [
  { id: "blind-test", label: "Blind Test", href: "/blind-test" },
  { id: "custom-test", label: "Playground", href: "/custom-test" },
  { id: "my-results", label: "My Results", href: "/my-results" },
  { id: "leaderboard", label: "Leaderboard", href: "/leaderboard" },
] as const;

export interface NavBarProps {
  isAdmin?: boolean;
  user?: { email: string } | null;
}

function getActiveTab(pathname: string): string {
  if (pathname.startsWith("/blind-test")) return "blind-test";
  if (pathname.startsWith("/custom-test")) return "custom-test";
  if (pathname.startsWith("/my-results")) return "my-results";
  if (pathname.startsWith("/leaderboard")) return "leaderboard";
  if (pathname.startsWith("/admin")) return "admin";
  return "blind-test";
}

export function NavBar({ isAdmin = false, user = null }: NavBarProps) {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  const tabs = [
    ...NAV_TABS,
    ...(isAdmin ? [{ id: "admin" as const, label: "Admin", href: "/admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
          aria-label="Speech Arena - Home"
        >
          <Image
            src="/speech-arena-logo.png"
            alt="Speech Arena"
            width={140}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>

        <GlassTabs tabs={tabs} activeTab={activeTab} />

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-white/60">{user.email}</span>
              {/* Use <a> (not <Link>) for sign-out so the browser does a full
                  navigation to the route handler, ensuring cookies are properly
                  cleared on the redirect response. */}
              <a
                href="/auth/sign-out"
                className="text-sm font-medium text-white/60 hover:text-white"
              >
                Sign out
              </a>
            </>
          ) : (
            <Link
              href="/auth/sign-in"
              className="text-sm font-medium text-accent-blue hover:text-accent-blue/80"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

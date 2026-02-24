"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LnlSidebar } from "./lnl-sidebar";

export interface LnlLayoutProps {
  isAdmin: boolean;
  children: React.ReactNode;
}

const WORKSPACE_ROUTE = /^\/listen-and-log\/tasks\/[^/]+\/items\/\d+$/;

export function LnlLayout({ isAdmin, children }: LnlLayoutProps) {
  const pathname = usePathname();
  const isWorkspaceRoute = pathname?.match(WORKSPACE_ROUTE);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isWorkspaceRoute) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-neutral-950">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-neutral-800 bg-neutral-950 px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
            aria-label="Open menu"
          >
            <svg
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <Link
            href="/listen-and-log"
            className="text-sm font-medium text-neutral-300 transition-colors hover:text-neutral-100"
          >
            Listen & Log
          </Link>
        </header>
        <main className="flex flex-1 flex-col overflow-auto">{children}</main>
        <LnlSidebar
          isAdmin={isAdmin}
          variant="overlay"
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950">
      <LnlSidebar isAdmin={isAdmin} />
      <main className="flex flex-1 flex-col overflow-auto">{children}</main>
    </div>
  );
}

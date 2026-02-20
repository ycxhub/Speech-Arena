"use client";

import { LnlSidebar } from "./lnl-sidebar";

export interface LnlLayoutProps {
  isAdmin: boolean;
  children: React.ReactNode;
}

export function LnlLayout({ isAdmin, children }: LnlLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950">
      <LnlSidebar isAdmin={isAdmin} />
      <main className="flex flex-1 flex-col overflow-auto">{children}</main>
    </div>
  );
}

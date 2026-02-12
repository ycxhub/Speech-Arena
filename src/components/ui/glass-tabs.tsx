"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface GlassTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
}

export interface GlassTabsProps {
  tabs: GlassTabItem[];
  activeTab: string;
  onTabChange?: (id: string) => void;
  className?: string;
}

export function GlassTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: GlassTabsProps) {
  return (
    <nav
      className={cn("flex items-center gap-1", className)}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const baseStyles =
          "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white";
        const activeStyles =
          "text-accent-blue underline decoration-accent-blue decoration-2 underline-offset-4";

        const content = (
          <>
            {tab.icon}
            {tab.label}
          </>
        );

        if (tab.href) {
          return (
            <Link
              key={tab.id}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              className={cn(baseStyles, isActive && activeStyles)}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange?.(tab.id)}
            className={cn(baseStyles, isActive && activeStyles)}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}

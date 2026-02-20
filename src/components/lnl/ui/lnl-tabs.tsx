"use client";

import { cn } from "@/lib/utils";

export interface LnlTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface LnlTabsProps {
  tabs: LnlTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function LnlTabs({
  tabs,
  activeTab,
  onChange,
  className,
}: LnlTabsProps) {
  return (
    <div
      className={cn(
        "flex gap-1 border-b border-neutral-800",
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === tab.id
              ? "text-neutral-100"
              : "text-neutral-500 hover:text-neutral-300"
          )}
        >
          {tab.icon}
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-500" />
          )}
        </button>
      ))}
    </div>
  );
}

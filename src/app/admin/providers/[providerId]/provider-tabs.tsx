"use client";

import { usePathname } from "next/navigation";
import { GlassTabs } from "@/components/ui/glass-tabs";

interface ProviderTabsProps {
  providerId: string;
}

export function ProviderTabs({ providerId }: ProviderTabsProps) {
  const pathname = usePathname();
  const isModels = pathname.endsWith("/models");
  const activeTab = isModels ? "models" : "keys";

  const tabs = [
    { id: "models", label: "Models", href: `/admin/providers/${providerId}/models` },
    { id: "keys", label: "API Keys", href: `/admin/providers/${providerId}/keys` },
  ];

  return (
    <GlassTabs
      tabs={tabs}
      activeTab={activeTab}
      className="border-b border-white/10 pb-2"
    />
  );
}

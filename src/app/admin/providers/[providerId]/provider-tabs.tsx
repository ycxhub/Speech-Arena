"use client";

import { usePathname } from "next/navigation";
import { GlassTabs } from "@/components/ui/glass-tabs";

interface ProviderTabsProps {
  providerId: string;
}

export function ProviderTabs({ providerId }: ProviderTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { id: "languages", label: "Languages", href: `/admin/providers/${providerId}/languages` },
    { id: "voices", label: "Voices", href: `/admin/providers/${providerId}/voices` },
    { id: "models", label: "Models", href: `/admin/providers/${providerId}/models` },
    { id: "keys", label: "Keys", href: `/admin/providers/${providerId}/keys` },
    { id: "test", label: "Test API", href: `/admin/providers/${providerId}/test` },
  ];

  const activeTab =
    pathname.endsWith("/languages")
      ? "languages"
      : pathname.endsWith("/voices")
        ? "voices"
        : pathname.endsWith("/models")
          ? "models"
          : pathname.endsWith("/keys")
            ? "keys"
            : pathname.endsWith("/test")
              ? "test"
              : "models";

  return (
    <GlassTabs
      tabs={tabs}
      activeTab={activeTab}
      className="border-b border-white/10 pb-2"
    />
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  providers: { id: string; name: string; is_active: boolean; is_ready: boolean }[];
}

const TOP_LEVEL_ITEMS = [
  { href: "/admin", label: "Admin Dashboard" },
  { href: "/admin/model-pages", label: "Model Pages" },
  { href: "/admin/user-management", label: "User Management" },
  { href: "/admin/languages", label: "Languages" },
  { href: "/admin/sentences", label: "Sentences" },
  { href: "/admin/logs", label: "Test Logs" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/audit-log", label: "Audit Logs" },
  { href: "/admin/api-playground", label: "API Playground" },
] as const;

export function AdminSidebar({ providers }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const isProviderActive = (providerId: string) =>
    pathname.includes(`/admin/providers/${providerId}`);

  return (
    <nav
      className="flex flex-col gap-1"
      aria-label="Admin navigation"
    >
      {TOP_LEVEL_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(item.href)
              ? "bg-white/10 text-accent-blue"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          )}
        >
          {item.label}
        </Link>
      ))}

      <div className="mt-2">
        <Link
          href="/admin/providers"
          className={cn(
            "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/admin/providers"
              ? "bg-white/10 text-accent-blue"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          )}
        >
          Providers
        </Link>
        {providers.length > 0 && (
          <ul className="mt-1 space-y-0.5 border-l border-white/10 pl-4 ml-2">
            {providers.map((provider) => (
              <li key={provider.id}>
                <Link
                  href={`/admin/providers/${provider.id}/models`}
                  className={cn(
                    "flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors",
                    isProviderActive(provider.id)
                      ? "text-accent-blue"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: !provider.is_active
                        ? "rgb(249 115 22)"
                        : !provider.is_ready
                          ? "rgb(234 179 8)"
                          : "rgb(34 197 94)",
                    }}
                    aria-hidden
                  />
                  <span className="truncate">{provider.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  );
}

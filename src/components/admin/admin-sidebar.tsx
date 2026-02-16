"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  providers: { id: string; name: string }[];
}

const TOP_LEVEL_ITEMS = [
  { href: "/admin", label: "Admin Dashboard" },
  { href: "/admin/user-management", label: "User Management" },
  { href: "/admin/languages", label: "Languages" },
  { href: "/admin/sentences", label: "Sentences" },
  { href: "/admin/logs", label: "Test Logs" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/audit-log", label: "Audit Logs" },
] as const;

export function AdminSidebar({ providers }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const isProviderChildActive = (providerId: string) =>
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
                <span className="block px-2 py-1 text-xs font-medium text-white/40 truncate">
                  {provider.name}
                </span>
                <ul className="space-y-0.5">
                  {[
                    { href: "languages", label: "Languages" },
                    { href: "voices", label: "Voices" },
                    { href: "models", label: "Models" },
                    { href: "keys", label: "Keys" },
                    { href: "test", label: "Test API" },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={`/admin/providers/${provider.id}/${href}`}
                        className={cn(
                          "block rounded px-2 py-1.5 text-sm transition-colors",
                          pathname === `/admin/providers/${provider.id}/${href}`
                            ? "text-accent-blue"
                            : "text-white/60 hover:text-white"
                        )}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  );
}

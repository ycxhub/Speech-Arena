"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const mainLinks: SidebarLink[] = [
  {
    label: "My Tasks",
    href: "/listen-and-log",
    icon: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
];

const adminLinks: SidebarLink[] = [
  {
    label: "Task Management",
    href: "/listen-and-log/admin/tasks",
    icon: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
      </svg>
    ),
  },
  {
    label: "Users & Invitations",
    href: "/listen-and-log/admin/users",
    icon: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    label: "Reports",
    href: "/listen-and-log/admin/reports",
    icon: (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
];

export interface LnlSidebarProps {
  isAdmin: boolean;
  className?: string;
}

export function LnlSidebar({ isAdmin, className }: LnlSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/listen-and-log") return pathname === "/listen-and-log";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex h-full w-56 flex-col border-r border-neutral-800 bg-neutral-950",
        className
      )}
    >
      <div className="flex items-center gap-2 px-4 py-5">
        <svg
          className="size-5 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {/* Headphones: headband + earcups */}
          <path d="M4.5 6.375a4.5 4.5 0 119 0v2.25m-9 0a4.5 4.5 0 109 0v2.25m-9 0h9a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-7.5a2.25 2.25 0 012.25-2.25m9 0h-9" />
          {/* Log: waveform bars in center */}
          <path d="M9.5 13v3M10.5 12v5M11.5 11v7M12.5 12v5M13.5 13v3" />
        </svg>
        <span className="text-sm font-semibold text-neutral-100">
          Listen & Log
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {mainLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(link.href)
                ? "bg-neutral-800 text-neutral-100"
                : "text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200"
            )}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="mx-3 my-3 border-t border-neutral-800" />
            <span className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
              Admin
            </span>
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-neutral-800 text-neutral-100"
                    : "text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200"
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-neutral-800 p-2">
        <Link
          href="/blind-test"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-800/60 hover:text-neutral-300"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Back to Speech Arena
        </Link>
      </div>
    </aside>
  );
}

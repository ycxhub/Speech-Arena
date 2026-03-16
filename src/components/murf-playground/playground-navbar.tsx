"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PlaygroundPageLink } from "@/app/pg/[slug]/actions";

interface Props {
  pages: PlaygroundPageLink[];
}

export function PlaygroundNavbar({ pages }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const currentSlug = pathname.replace(/^\/pg\//, "");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <nav className="murf-navbar">
      <div className="murf-navbar-inner">
        <Link href="/pg" className="murf-navbar-logo">
          <Image
            src="/murf-logo.png"
            alt="Murf AI"
            width={120}
            height={32}
            priority
          />
        </Link>

        {pages.length > 0 && (
          <div className="murf-navbar-menu" ref={menuRef}>
            <button
              type="button"
              className="murf-navbar-trigger"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="true"
            >
              Comparisons
              <svg
                className={`murf-navbar-chevron ${open ? "murf-navbar-chevron-open" : ""}`}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M4 6L8 10L12 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {open && (
              <div className="murf-navbar-dropdown" role="menu">
                {pages.map((page) => {
                  const displayTitle = page.title.replace(/^Compare\s+/i, "");
                  return (
                    <Link
                      key={page.slug}
                      href={`/pg/${page.slug}`}
                      role="menuitem"
                      className={`murf-navbar-dropdown-item ${
                        page.slug === currentSlug
                          ? "murf-navbar-dropdown-item-active"
                          : ""
                      }`}
                    >
                      {displayTitle}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

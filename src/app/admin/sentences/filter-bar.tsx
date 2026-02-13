"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassSelect } from "@/components/ui/glass-select";
import { GlassInput } from "@/components/ui/glass-input";

type LanguageOption = { value: string; label: string };

export function FilterBar({
  languages,
}: {
  languages: LanguageOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [language, setLanguage] = useState(
    searchParams.get("language") ?? ""
  );
  const [status, setStatus] = useState(
    searchParams.get("status") ?? "all"
  );
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const updateUrl = useCallback(
    (updates: { page?: number; language?: string; status?: string; q?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      const page = updates.page ?? parseInt(params.get("page") ?? "1", 10);
      const lang = updates.language ?? params.get("language") ?? "";
      const stat = updates.status ?? params.get("status") ?? "all";
      const query = updates.q ?? params.get("q") ?? "";

      params.set("page", String(Math.max(1, page)));
      if (lang) params.set("language", lang);
      else params.delete("language");
      if (stat !== "all") params.set("status", stat);
      else params.delete("status");
      if (query) params.set("q", query);
      else params.delete("q");

      router.push(`/admin/sentences?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      updateUrl({ q, page: 1 });
    }, 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setLanguage(v);
    updateUrl({ language: v, page: 1 });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setStatus(v);
    updateUrl({ status: v, page: 1 });
  };

  return (
    <GlassCard className="mb-4">
      <div className="flex flex-wrap items-center gap-4">
        <GlassSelect
          label="Language"
          options={[{ value: "", label: "All languages" }, ...languages]}
          value={language}
          onChange={handleLanguageChange}
          className="w-40"
        />
        <GlassSelect
          label="Status"
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
          value={status}
          onChange={handleStatusChange}
          className="w-32"
        />
        <GlassInput
          label="Search"
          placeholder="Search in sentence text..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[200px]"
        />
      </div>
    </GlassCard>
  );
}

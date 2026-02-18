"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassSelect } from "@/components/ui/glass-select";

interface FilterBarProps {
  languages: { id: string; code: string; name: string }[];
  filters: { gender: string; language: string; tag: string; status: string; q: string };
}

export function FilterBar({ languages, filters }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(filters.q);
  const [debouncedQ, setDebouncedQ] = useState(filters.q);

  useEffect(() => {
    setQ(filters.q);
  }, [filters.q]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQ) params.set("q", debouncedQ);
    else params.delete("q");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  }, [debouncedQ]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const hasActiveFilters =
    !!filters.gender ||
    !!filters.language ||
    !!filters.tag ||
    !!filters.status ||
    !!filters.q;

  const clearFilters = () => {
    setQ("");
    router.push("?");
  };

  const genderOptions = [
    { value: "", label: "All genders" },
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "neutral", label: "Neutral" },
  ];

  const languageOptions = [
    { value: "", label: "All languages" },
    ...languages.map((l) => ({ value: l.code, label: l.code })),
  ];

  const statusOptions = [
    { value: "", label: "All statuses" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  return (
    <GlassCard className="mb-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[180px]">
          <GlassInput
            label="Search"
            placeholder="Name or Model ID"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="min-w-[120px]">
          <GlassSelect
            label="Gender"
            options={genderOptions}
            value={filters.gender}
            onChange={(e) => updateFilter("gender", e.target.value)}
          />
        </div>
        <div className="min-w-[140px]">
          <GlassSelect
            label="Language"
            options={languageOptions}
            value={filters.language}
            onChange={(e) => updateFilter("language", e.target.value)}
          />
        </div>
        <div className="min-w-[120px]">
          <GlassSelect
            label="Status"
            options={statusOptions}
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
          />
        </div>
        <div className="min-w-[140px]">
          <GlassInput
            label="Tag"
            placeholder="e.g. neural"
            value={filters.tag}
            onChange={(e) => updateFilter("tag", e.target.value)}
          />
        </div>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </GlassCard>
  );
}

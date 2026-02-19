"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassTable } from "@/components/ui/glass-table";
import { GlassButton } from "@/components/ui/glass-button";
import { FilterBar } from "./filter-bar";
import { AddSentenceModal } from "./add-sentence-modal";
import { EditSentenceModal } from "./edit-sentence-modal";
import { SentenceToggle } from "./sentence-toggle";
import { CsvUploadModal } from "./csv-upload-modal";
import type { SentenceRow } from "./page";

type LanguageOption = { value: string; label: string };
type ActiveLanguage = { id: string; code: string; name: string };

export function SentencesPageClient({
  tableData,
  languages,
  activeLanguages,
  currentPage,
  totalPages,
  totalCount,
}: {
  tableData: SentenceRow[];
  languages: LanguageOption[];
  activeLanguages: ActiveLanguage[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [editingSentence, setEditingSentence] = useState<SentenceRow | null>(null);

  const truncate = (s: string, len: number) =>
    s.length <= len ? s : s.slice(0, len) + "...";

  const columns = [
    {
      key: "text",
      header: "Sentence",
      render: (row: SentenceRow) => (
        <span title={row.text}>{truncate(row.text, 80)}</span>
      ),
    },
    {
      key: "language_code",
      header: "Language",
      render: (row: SentenceRow) => (
        <span>{row.language_name} ({row.language_code})</span>
      ),
    },
    {
      key: "sentence_label",
      header: "Sentence Label",
      render: (row: SentenceRow) => (
        <span>{row.sentence_label ?? "—"}</span>
      ),
    },
    { key: "version", header: "Version" },
    {
      key: "is_active",
      header: "Status",
      render: (row: SentenceRow) => (
        <SentenceToggle sentenceId={row.id} isActive={row.is_active} />
      ),
    },
    { key: "created_at", header: "Created" },
    { key: "updated_at", header: "Updated" },
  ];

  const openEdit = (row: SentenceRow) => {
    setEditingSentence(row);
    setEditModalOpen(true);
  };

  const searchParams = useSearchParams();
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `/admin/sentences?${params.toString()}`;
  };

  return (
    <>
      <FilterBar languages={languages} />

      <GlassCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-white/60">
            Manage sentences for the sentence bank. Deactivated sentences are excluded from matchmaking.
          </p>
          <div className="flex gap-2">
            <GlassButton variant="secondary" onClick={() => setCsvModalOpen(true)}>
              Upload CSV
            </GlassButton>
            <GlassButton onClick={() => setAddModalOpen(true)}>
              Add sentence
            </GlassButton>
          </div>
        </div>

        <p className="mb-2 text-xs text-white/50">
          CSV format: language_code,text,sentence_label (header required). Example: en,The quick brown fox jumps over the lazy dog.,Social Media
        </p>

        <GlassTable<SentenceRow>
          columns={columns}
          data={tableData}
          loading={false}
          onRowClick={openEdit}
        />

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-sm text-white/60">
            Page {currentPage} of {totalPages || 1} ({totalCount} total)
          </span>
          <div className="flex gap-2">
            <Link
              href={currentPage <= 1 ? "#" : buildPageUrl(currentPage - 1)}
              aria-disabled={currentPage <= 1}
            >
              <GlassButton
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1}
                onClick={(e) => currentPage <= 1 && e.preventDefault()}
              >
                Previous
              </GlassButton>
            </Link>
            <Link
              href={
                currentPage >= totalPages ? "#" : buildPageUrl(currentPage + 1)
              }
              aria-disabled={currentPage >= totalPages}
            >
              <GlassButton
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={(e) =>
                  currentPage >= totalPages && e.preventDefault()
                }
              >
                Next
              </GlassButton>
            </Link>
          </div>
        </div>
      </GlassCard>

      <AddSentenceModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        languages={activeLanguages}
        onSuccess={() => setAddModalOpen(false)}
      />

      <EditSentenceModal
        open={editModalOpen}
        onClose={() => {
          setEditingSentence(null);
          setEditModalOpen(false);
        }}
        sentence={editingSentence}
        onSuccess={() => {
          setEditingSentence(null);
          setEditModalOpen(false);
        }}
      />

      <CsvUploadModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        languages={activeLanguages}
        onSuccess={() => setCsvModalOpen(false)}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassTable } from "@/components/ui/glass-table";
import { GlassButton } from "@/components/ui/glass-button";
import { AddLanguageModal } from "./add-language-modal";
import { LanguageToggle } from "./language-toggle";
import type { LanguageRow } from "./page";

export function LanguagesPageClient({
  tableData,
}: {
  tableData: LanguageRow[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<LanguageRow | null>(null);

  const columns = [
    { key: "code", header: "Code", sortable: true },
    { key: "name", header: "Name", sortable: true },
    {
      key: "is_active",
      header: "Status",
      render: (row: LanguageRow) => (
        <LanguageToggle languageId={row.id} isActive={row.is_active} />
      ),
    },
    { key: "sentence_count", header: "Sentences" },
    { key: "created_at", header: "Created" },
  ];

  const openAdd = () => {
    setEditingLanguage(null);
    setModalOpen(true);
  };

  const openEdit = (row: LanguageRow) => {
    setEditingLanguage(row);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingLanguage(null);
  };

  return (
    <>
      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-white/60">
            Manage languages for the sentence bank. Deactivated languages are hidden from users.
          </p>
          <GlassButton onClick={openAdd}>Add language</GlassButton>
        </div>
        <GlassTable<LanguageRow>
          columns={columns}
          data={tableData}
          loading={false}
          onRowClick={openEdit}
        />
      </GlassCard>

      <AddLanguageModal
        open={modalOpen}
        onClose={handleModalClose}
        language={editingLanguage}
        existingCodes={tableData.map((r) => r.code)}
        onSuccess={handleModalClose}
      />
    </>
  );
}

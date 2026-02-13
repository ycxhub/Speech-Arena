"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassTable } from "@/components/ui/glass-table";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassBadge } from "@/components/ui/glass-badge";
import { FilterBar } from "./filter-bar";
import { AddModelModal } from "./add-model-modal";
import { ModelToggle } from "./model-toggle";
import { getTagColor, type ModelRow } from "./model-types";

interface ModelsPageClientProps {
  providerId: string;
  tableData: ModelRow[];
  languages: { id: string; code: string; name: string }[];
  filters: { gender: string; language: string; tag: string; status: string; q: string };
}

export function ModelsPageClient({
  providerId,
  tableData,
  languages,
  filters,
}: ModelsPageClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelRow | null>(null);

  const columns = [
    { key: "name", header: "Name", sortable: true },
    { key: "model_id", header: "Model ID", sortable: true },
    {
      key: "voice_id",
      header: "Voice ID",
      render: (row: ModelRow) => (
        <span className="text-white/60">{row.voice_id || "—"}</span>
      ),
    },
    { key: "gender", header: "Gender" },
    {
      key: "languages",
      header: "Languages",
      render: (row: ModelRow) => (
        <div className="flex flex-wrap gap-1">
          {row.languages.map((code) => (
            <GlassBadge key={code} color="blue">
              {code}
            </GlassBadge>
          ))}
        </div>
      ),
    },
    {
      key: "tags",
      header: "Tags",
      render: (row: ModelRow) => (
        <div className="flex flex-wrap gap-1">
          {row.tags.map((tag) => (
            <GlassBadge key={tag} color={getTagColor(tag)}>
              {tag}
            </GlassBadge>
          ))}
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (row: ModelRow) => (
        <ModelToggle modelId={row.id} providerId={providerId} isActive={row.is_active} />
      ),
    },
    { key: "created_at", header: "Created" },
    {
      key: "actions",
      header: "",
      render: (row: ModelRow) => (
        <GlassButton
          variant="ghost"
          size="sm"
          onClick={(e) => handleEditClick(e, row)}
        >
          Edit
        </GlassButton>
      ),
    },
  ];

  const openAdd = () => {
    setEditingModel(null);
    setModalOpen(true);
  };

  const openEdit = (row: ModelRow) => {
    setEditingModel(row);
    setModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, row: ModelRow) => {
    e.stopPropagation();
    openEdit(row);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingModel(null);
  };

  const modelForModal = editingModel
    ? {
        id: editingModel.id,
        name: editingModel.name,
        model_id: editingModel.model_id,
        voice_id: editingModel.voice_id ?? "",
        gender: editingModel.gender,
        languages: languages
          .filter((l) => editingModel.languages.includes(l.code))
          .map((l) => l.id),
        tags: editingModel.tags,
      }
    : null;

  return (
    <>
      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <GlassButton variant="ghost" size="sm" onClick={() => router.back()}>
            ← Back to providers
          </GlassButton>
          <GlassButton onClick={openAdd}>Add model</GlassButton>
        </div>
        <FilterBar languages={languages} filters={filters} />
        <GlassTable<ModelRow>
          columns={columns}
          data={tableData}
          loading={false}
          onRowClick={(row) => openEdit(row)}
        />
      </GlassCard>

      <AddModelModal
        open={modalOpen}
        onClose={handleModalClose}
        providerId={providerId}
        model={modelForModal}
        languages={languages}
        onSuccess={handleModalClose}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassTable } from "@/components/ui/glass-table";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassBadge } from "@/components/ui/glass-badge";
import { FilterBar } from "./filter-bar";
import { AddModelModal } from "./add-model-modal";
import { AddModelDefinitionModal } from "./add-model-definition-modal";
import { ModelToggle } from "./model-toggle";
import { getTagColor, type ModelRow } from "./model-types";
import { deleteModelDefinition, deleteModel } from "./actions";
import { toast } from "sonner";

type ProviderVoice = {
  id: string;
  voice_id: string;
  gender: string;
  display_name: string | null;
};

type ModelDefinitionRow = {
  id: string;
  name: string;
  model_id: string;
  endpoint: string | null;
  created_at: string;
};

interface ModelsPageClientProps {
  providerId: string;
  tableData: ModelRow[];
  modelDefinitions: ModelDefinitionRow[];
  languages: { id: string; code: string; name: string }[];
  providerVoices: ProviderVoice[];
  filters: { gender: string; language: string; tag: string; status: string; q: string };
}

export function ModelsPageClient({
  providerId,
  tableData,
  modelDefinitions,
  languages,
  providerVoices,
  filters,
}: ModelsPageClientProps) {
  const router = useRouter();
  const [definitionModalOpen, setDefinitionModalOpen] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState<ModelDefinitionRow | null>(null);
  const [duplicateDefinitionSource, setDuplicateDefinitionSource] = useState<ModelDefinitionRow | null>(null);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelRow | null>(null);
  const [duplicateSource, setDuplicateSource] = useState<ModelRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const definitionColumns = [
    { key: "name", header: "Name", sortable: true },
    { key: "model_id", header: "Model ID", sortable: true },
    {
      key: "endpoint",
      header: "Endpoint",
      render: (row: ModelDefinitionRow) => (
        <span className="max-w-[200px] truncate block text-white/60" title={row.endpoint ?? ""}>
          {row.endpoint || "—"}
        </span>
      ),
    },
    { key: "created_at", header: "Created" },
    {
      key: "actions",
      header: "",
      render: (row: ModelDefinitionRow) => (
        <div className="flex items-center gap-1">
          <GlassButton variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditDefinition(row); }}>
            Edit
          </GlassButton>
          <GlassButton variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDuplicateDefinition(row); }}>
            Duplicate
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleDeleteDefinition(row.id); }}
            disabled={deletingId === row.id}
          >
            Delete
          </GlassButton>
        </div>
      ),
    },
  ];

  const modelColumns = [
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
        <div className="flex items-center gap-1">
          <GlassButton variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditModel(row); }}>
            Edit
          </GlassButton>
          <GlassButton variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDuplicateModel(row); }}>
            Duplicate
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleDeleteModel(row.id); }}
            disabled={deletingId === row.id}
          >
            Delete
          </GlassButton>
        </div>
      ),
    },
  ];

  const openAddDefinition = () => {
    setEditingDefinition(null);
    setDuplicateDefinitionSource(null);
    setDefinitionModalOpen(true);
  };

  const openEditDefinition = (row: ModelDefinitionRow) => {
    setEditingDefinition(row);
    setDuplicateDefinitionSource(null);
    setDefinitionModalOpen(true);
  };

  const openDuplicateDefinition = (row: ModelDefinitionRow) => {
    setEditingDefinition(null);
    setDuplicateDefinitionSource({ ...row, id: "" });
    setDefinitionModalOpen(true);
  };

  const handleDeleteDefinition = async (id: string) => {
    if (!confirm("Delete this model definition? Voices using it will need to be updated.")) return;
    setDeletingId(id);
    try {
      const result = await deleteModelDefinition(id, providerId);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Model definition deleted");
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const openAddModel = () => {
    setEditingModel(null);
    setDuplicateSource(null);
    setModelModalOpen(true);
  };

  const openEditModel = (row: ModelRow) => {
    setEditingModel(row);
    setDuplicateSource(null);
    setModelModalOpen(true);
  };

  const openDuplicateModel = (row: ModelRow) => {
    setEditingModel(null);
    setDuplicateSource(row);
    setModelModalOpen(true);
  };

  const handleDeleteModel = async (id: string) => {
    if (!confirm("Delete this model? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const result = await deleteModel(id, providerId);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Model deleted");
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleDefinitionModalClose = () => {
    setDefinitionModalOpen(false);
    setEditingDefinition(null);
    setDuplicateDefinitionSource(null);
    router.refresh();
  };

  const handleModelModalClose = () => {
    setModelModalOpen(false);
    setEditingModel(null);
    setDuplicateSource(null);
    router.refresh();
  };

  const definitionForModal = editingDefinition
    ? { id: editingDefinition.id, name: editingDefinition.name, model_id: editingDefinition.model_id, endpoint: editingDefinition.endpoint }
    : duplicateDefinitionSource
      ? { id: "", name: duplicateDefinitionSource.name, model_id: duplicateDefinitionSource.model_id, endpoint: duplicateDefinitionSource.endpoint }
      : null;

  const modelForModal = editingModel
    ? {
        id: editingModel.id,
        name: editingModel.name,
        model_id: editingModel.model_id,
        voice_id: editingModel.voice_id ?? "",
        gender: editingModel.gender,
        languages: languages.filter((l) => editingModel.languages.includes(l.code)).map((l) => l.id),
        tags: editingModel.tags,
      }
    : duplicateSource
      ? {
          name: duplicateSource.name,
          model_id: duplicateSource.model_id,
          voice_id: null as string | null,
          excludeVoiceId: duplicateSource.voice_id ?? undefined,
          gender: duplicateSource.gender,
          languages: languages.filter((l) => duplicateSource.languages.includes(l.code)).map((l) => l.id),
          tags: duplicateSource.tags,
        }
      : null;

  return (
    <>
      <GlassCard>
        <h2 className="mb-2 text-lg font-medium text-white">Step 1: Model Definitions</h2>
        <p className="mb-4 text-sm text-white/60">
          Define TTS engines (name, model ID, optional endpoint). Voices will reference these in Step 3.
        </p>
        <div className="mb-4 flex items-center justify-end">
          <GlassButton onClick={openAddDefinition}>Add model definition</GlassButton>
        </div>
        {modelDefinitions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-8 text-center">
            <p className="mb-2 text-white">No model definitions yet</p>
            <p className="mb-4 text-sm text-white/60">Add model definitions before adding voices.</p>
            <GlassButton onClick={openAddDefinition}>Add model definition</GlassButton>
          </div>
        ) : (
          <GlassTable<ModelDefinitionRow>
            columns={definitionColumns}
            data={modelDefinitions}
            loading={false}
            onRowClick={(row) => openEditDefinition(row)}
          />
        )}
      </GlassCard>

      <GlassCard className="mt-6">
        <h2 className="mb-2 text-lg font-medium text-white">Generated (Model, Voice, Language) Pairs</h2>
        <p className="mb-4 text-sm text-white/60">
          Created by running Autogenerate from the Voices tab. You can also add or edit manually.
        </p>
        <div className="mb-4 flex items-center justify-between">
          <Link href={`/admin/providers/${providerId}/autogenerate`}>
            <GlassButton variant="secondary" size="sm">Run Autogenerate</GlassButton>
          </Link>
          <GlassButton onClick={openAddModel} disabled={providerVoices.length === 0}>
            Add manually
          </GlassButton>
        </div>
        <FilterBar languages={languages} filters={filters} />
        {tableData.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-8 text-center">
            <p className="mb-2 text-white">No generated models yet</p>
            <p className="mb-4 text-sm text-white/60">
              Add model definitions, languages, and voices, then run Autogenerate.
            </p>
            <Link href={`/admin/providers/${providerId}/autogenerate`}>
              <GlassButton variant="secondary">Go to Autogenerate</GlassButton>
            </Link>
          </div>
        ) : (
          <GlassTable<ModelRow>
            columns={modelColumns}
            data={tableData}
            loading={false}
            onRowClick={(row) => openEditModel(row)}
          />
        )}
      </GlassCard>

      <AddModelDefinitionModal
        open={definitionModalOpen}
        onClose={handleDefinitionModalClose}
        providerId={providerId}
        definition={definitionForModal}
        onSuccess={handleDefinitionModalClose}
      />

      <AddModelModal
        open={modelModalOpen}
        onClose={handleModelModalClose}
        providerId={providerId}
        model={modelForModal}
        languages={languages}
        providerVoices={providerVoices}
        onSuccess={handleModelModalClose}
      />
    </>
  );
}

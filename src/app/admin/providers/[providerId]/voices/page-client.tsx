"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassTable } from "@/components/ui/glass-table";
import { GlassButton } from "@/components/ui/glass-button";
import { AddVoiceModal } from "./add-voice-modal";
import { ImportCsvModal } from "./import-csv-modal";
import { deleteVoice } from "./actions";
import { toast } from "sonner";

type VoiceRow = {
  id: string;
  voice_id: string;
  gender: string;
  display_name: string | null;
  language_id?: string;
  language_code: string;
  model_id: string | null;
  model_id_display: string;
  created_at: string;
};

interface VoicesPageClientProps {
  providerId: string;
  providerName: string;
  tableData: VoiceRow[];
  languages: { id: string; code: string }[];
  modelDefinitions: { id: string; model_id: string; name: string }[];
}

export function VoicesPageClient({
  providerId,
  providerName: _providerName,
  tableData,
  languages,
  modelDefinitions,
}: VoicesPageClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [editingVoice, setEditingVoice] = useState<VoiceRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (voiceId: string) => {
    if (!confirm("Delete this voice? Models using it will need to be updated.")) return;
    setDeletingId(voiceId);
    try {
      const result = await deleteVoice(voiceId, providerId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Voice deleted");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    { key: "voice_id", header: "Voice ID" },
    { key: "model_id_display", header: "Model" },
    { key: "gender", header: "Gender" },
    { key: "language_code", header: "Language" },
    {
      key: "display_name",
      header: "Display Name",
      render: (row: VoiceRow) => (
        <span className="text-white/60">{row.display_name || "—"}</span>
      ),
    },
    { key: "created_at", header: "Created" },
    {
      key: "actions",
      header: "",
      render: (row: VoiceRow) => (
        <div className="flex gap-2">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditingVoice(row);
              setModalOpen(true);
            }}
          >
            Edit
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditingVoice({ ...row, id: "" });
              setModalOpen(true);
            }}
          >
            Duplicate
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            disabled={deletingId === row.id}
          >
            Delete
          </GlassButton>
        </div>
      ),
    },
  ];

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingVoice(null);
  };

  const voiceForModal = editingVoice ?? null;

  return (
    <>
      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-white/60">
            Add voice IDs with model, language, and gender. Run Autogenerate to create (model, voice, language) pairs.
          </p>
          <div className="flex gap-2">
            <GlassButton variant="secondary" onClick={() => setCsvModalOpen(true)} disabled={modelDefinitions.length === 0}>
              Import CSV
            </GlassButton>
            <GlassButton onClick={() => { setEditingVoice(null); setModalOpen(true); }} disabled={modelDefinitions.length === 0}>
              Add voice
            </GlassButton>
          </div>
        </div>
        {tableData.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
            <p className="mb-2 text-lg font-medium text-white">No voices yet</p>
            <p className="mb-6 text-sm text-white/60">
              Add voices before adding models. Each voice requires a Voice ID and gender.
            </p>
            <GlassButton onClick={() => setModalOpen(true)}>Add voice</GlassButton>
          </div>
        ) : (
          <GlassTable<VoiceRow>
            columns={columns}
            data={tableData}
            loading={false}
          />
        )}
      </GlassCard>

      <AddVoiceModal
        open={modalOpen}
        onClose={handleModalClose}
        providerId={providerId}
        voice={voiceForModal}
        languages={languages}
        modelDefinitions={modelDefinitions}
        onSuccess={handleModalClose}
      />

      <ImportCsvModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        providerId={providerId}
        onSuccess={() => { setCsvModalOpen(false); router.refresh(); }}
      />
    </>
  );
}

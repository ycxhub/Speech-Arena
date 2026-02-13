"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassTable } from "@/components/ui/glass-table";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassSelect } from "@/components/ui/glass-select";
import { AddKeyModal } from "./add-key-modal";
import { updateKeyStatus } from "./actions";
import { toast } from "sonner";
import type { KeyRow } from "./page";

interface KeysPageClientProps {
  providerId: string;
  tableData: KeyRow[];
}

export function KeysPageClient({
  providerId,
  tableData,
}: KeysPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (
    keyId: string,
    newStatus: "active" | "deprecated" | "revoked"
  ) => {
    setUpdatingId(keyId);
    try {
      const result = await updateKeyStatus(keyId, providerId, newStatus);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Key status updated to ${newStatus}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const columns = [
    { key: "key_name", header: "Key Name" },
    { key: "masked_preview", header: "Preview" },
    {
      key: "status",
      header: "Status",
      render: (row: KeyRow) => (
        <GlassSelect
          options={[
            { value: "active", label: "Active" },
            { value: "deprecated", label: "Deprecated" },
            { value: "revoked", label: "Revoked" },
          ]}
          value={row.status}
          onChange={(e) =>
            handleStatusChange(
              row.id,
              e.target.value as "active" | "deprecated" | "revoked"
            )
          }
          disabled={updatingId === row.id}
        />
      ),
    },
    { key: "created_at", header: "Created" },
    { key: "updated_at", header: "Last Updated" },
  ];

  return (
    <>
      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-white/60">
            Manage API keys for this provider. Keys are encrypted at rest. Use key rotation: add new key → deprecate old → revoke old after verification.
          </p>
          <GlassButton onClick={() => setModalOpen(true)}>Add key</GlassButton>
        </div>
        {tableData.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
            <p className="mb-2 text-lg font-medium text-white">
              No API keys yet
            </p>
            <p className="mb-6 text-sm text-white/60">
              Add your first API key to enable TTS generation for this provider.
            </p>
            <GlassButton onClick={() => setModalOpen(true)}>
              Add API key
            </GlassButton>
          </div>
        ) : (
          <GlassTable<KeyRow>
            columns={columns}
            data={tableData}
            loading={false}
          />
        )}
      </GlassCard>

      <AddKeyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        providerId={providerId}
        onSuccess={() => setModalOpen(false)}
      />
    </>
  );
}

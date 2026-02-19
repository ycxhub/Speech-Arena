"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { AddProviderModal } from "./add-provider-modal";
import type { ProviderRow } from "./page";

function StatusDot({ isActive, isReady }: { isActive: boolean; isReady: boolean }) {
  const color =
    !isActive
      ? "rgb(249 115 22)" // orange = inactive
      : !isReady
        ? "rgb(234 179 8)" // yellow = not ready for blind tests
        : "rgb(34 197 94)"; // green = active and ready
  const title = !isActive ? "Inactive" : !isReady ? "Not ready for blind tests" : "Active";
  return (
    <span
      className="h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
      title={title}
      aria-hidden
    />
  );
}

export function ProvidersPageClient({
  tableData,
}: {
  tableData: ProviderRow[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderRow | null>(null);

  const openAdd = () => {
    setEditingProvider(null);
    setModalOpen(true);
  };

  const openEdit = (e: React.MouseEvent, row: ProviderRow) => {
    e.stopPropagation();
    setEditingProvider(row);
    setModalOpen(true);
  };

  const handleProviderClick = (row: ProviderRow) => {
    router.push(`/admin/providers/${row.id}/models`);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingProvider(null);
  };

  return (
    <>
      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-white/60">
            Manage TTS providers. Click a provider to manage its models, voices, and keys.
          </p>
          <GlassButton onClick={openAdd}>Add provider</GlassButton>
        </div>
        <ul className="space-y-1">
          {tableData.map((row) => (
            <li key={row.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleProviderClick(row)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleProviderClick(row);
                  }
                }}
                className="group flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-white/5"
              >
                <StatusDot isActive={row.is_active} isReady={row.is_ready} />
                <span className="flex-1 font-medium text-white">{row.name}</span>
                <button
                  type="button"
                  onClick={(e) => openEdit(e, row)}
                  className="rounded px-2 py-1 text-sm text-white/40 opacity-0 transition-opacity hover:bg-white/5 hover:text-white group-hover:opacity-100"
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      </GlassCard>

      <AddProviderModal
        open={modalOpen}
        onClose={handleModalClose}
        provider={editingProvider}
        onSuccess={handleModalClose}
      />
    </>
  );
}

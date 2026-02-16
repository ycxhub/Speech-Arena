"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassTable } from "@/components/ui/glass-table";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassBadge } from "@/components/ui/glass-badge";
import { AddProviderModal } from "./add-provider-modal";
import { ProviderToggle } from "./provider-toggle";
import type { ProviderRow } from "./page";

export function ProvidersPageClient({
  tableData,
}: {
  tableData: ProviderRow[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderRow | null>(null);

  const columns = [
    { key: "name", header: "Name", sortable: true },
    { key: "slug", header: "Slug", sortable: true },
    {
      key: "readiness",
      header: "Readiness",
      render: (row: ProviderRow) => (
        <GlassBadge color={row.is_ready ? "green" : "orange"}>
          {row.is_ready ? "Ready" : "Setup incomplete"}
        </GlassBadge>
      ),
    },
    {
      key: "next_step",
      header: "Next step",
      render: (row: ProviderRow) =>
        row.next_step && row.next_step_href ? (
          <Link
            href={row.next_step_href}
            className="text-sm text-accent-blue hover:text-accent-blue/80 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.next_step}
          </Link>
        ) : (
          <span className="text-sm text-white/40">—</span>
        ),
    },
    {
      key: "base_url",
      header: "Base URL",
      render: (row: ProviderRow) => (
        <span className="truncate max-w-[200px] block" title={row.base_url ?? ""}>
          {row.base_url || "—"}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (row: ProviderRow) => (
        <ProviderToggle providerId={row.id} isActive={row.is_active} />
      ),
    },
    {
      key: "model_count",
      header: "Models",
      render: (row: ProviderRow) => (
        <span>
          {row.model_count_active}/{row.model_count_total}
        </span>
      ),
    },
    { key: "created_at", header: "Created" },
    {
      key: "actions",
      header: "",
      render: (row: ProviderRow) => (
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
    setEditingProvider(null);
    setModalOpen(true);
  };

  const openEdit = (row: ProviderRow) => {
    setEditingProvider(row);
    setModalOpen(true);
  };

  const handleRowClick = (row: ProviderRow) => {
    router.push(`/admin/providers/${row.id}/models`);
  };

  const handleEditClick = (e: React.MouseEvent, row: ProviderRow) => {
    e.stopPropagation();
    openEdit(row);
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
            Manage TTS providers. Deactivating a provider removes all its models from matchmaking.
          </p>
          <GlassButton onClick={openAdd}>Add provider</GlassButton>
        </div>
        <GlassTable<ProviderRow>
          columns={columns}
          data={tableData}
          loading={false}
          onRowClick={handleRowClick}
        />
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

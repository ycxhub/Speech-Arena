"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassTable } from "@/components/ui/glass-table";
import type { ModelPageRow } from "./actions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ModelPagesPageClient({
  tableData,
}: {
  tableData: ModelPageRow[];
}) {
  const router = useRouter();

  const columns = [
    {
      key: "definition_name",
      header: "Model",
      render: (row: ModelPageRow) => (
        <span className="font-medium text-white">{row.definition_name}</span>
      ),
    },
    {
      key: "provider_name",
      header: "Provider",
      render: (row: ModelPageRow) => (
        <span className="text-white/80">{row.provider_name ?? "—"}</span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      render: (row: ModelPageRow) => (
        <code className="text-sm text-white/60">{row.slug}</code>
      ),
    },
    {
      key: "rank_override",
      header: "Rank override",
      render: (row: ModelPageRow) => (
        <span className="text-white/80">{row.rank_override ?? "—"}</span>
      ),
    },
    {
      key: "is_featured",
      header: "Featured",
      render: (row: ModelPageRow) => (
        <span className={row.is_featured ? "text-accent-blue" : "text-white/40"}>
          {row.is_featured ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "updated_at",
      header: "Updated",
      render: (row: ModelPageRow) => (
        <span className="text-white/60">{formatDate(row.updated_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row: ModelPageRow) => (
        <div className="flex gap-2">
          <Link
            href={`/admin/model-pages/${row.id}`}
            className="text-sm text-accent-blue hover:underline"
          >
            Edit
          </Link>
          <Link
            href={`/models/${row.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/60 hover:text-white"
          >
            View
          </Link>
        </div>
      ),
    },
  ];

  return (
    <GlassTable
      columns={columns}
      data={tableData}
      onRowClick={(row) => router.push(`/admin/model-pages/${row.id}`)}
    />
  );
}

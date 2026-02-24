"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassTable } from "@/components/ui/glass-table";
import type { ComparePageRow } from "./actions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ComparePagesPageClient({
  tableData,
}: {
  tableData: ComparePageRow[];
}) {
  const router = useRouter();

  const columns = [
    {
      key: "slug",
      header: "Slug",
      render: (row: ComparePageRow) => (
        <code className="text-sm text-white/80">{row.slug}</code>
      ),
    },
    {
      key: "model_a",
      header: "Model A",
      render: (row: ComparePageRow) => (
        <span className="text-white/80">
          {row.model_a_name ?? "—"} ({row.model_a_slug ?? "—"})
        </span>
      ),
    },
    {
      key: "model_b",
      header: "Model B",
      render: (row: ComparePageRow) => (
        <span className="text-white/80">
          {row.model_b_name ?? "—"} ({row.model_b_slug ?? "—"})
        </span>
      ),
    },
    {
      key: "updated_at",
      header: "Updated",
      render: (row: ComparePageRow) => (
        <span className="text-white/60">{formatDate(row.updated_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row: ComparePageRow) => (
        <div className="flex gap-2">
          <Link
            href={`/admin/model-pages/compare/${row.id}`}
            className="text-sm text-accent-blue hover:underline"
          >
            Edit
          </Link>
          <Link
            href={`/models/compare/${row.slug}`}
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
      onRowClick={(row) => router.push(`/admin/model-pages/compare/${row.id}`)}
    />
  );
}

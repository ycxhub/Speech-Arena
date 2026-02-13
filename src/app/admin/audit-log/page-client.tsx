"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassTable } from "@/components/ui/glass-table";
import { GlassButton } from "@/components/ui/glass-button";

type Row = {
  id: string;
  createdAt: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
};

export function AuditLogClient({
  rows,
  total,
  page,
  pageSize,
}: {
  rows: Row[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/admin/audit-log?${params.toString()}`);
  };

  return (
    <GlassCard>
      <GlassTable<Row>
        columns={[
          {
            key: "createdAt",
            header: "Timestamp",
            render: (r) =>
              new Date(r.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }),
          },
          { key: "adminEmail", header: "Admin" },
          { key: "action", header: "Action" },
          { key: "entityType", header: "Entity Type" },
          { key: "entityId", header: "Entity ID" },
          {
            key: "details",
            header: "Details",
            render: (r) => (
              <span className="block max-w-xs truncate" title={r.details}>
                {r.details}
              </span>
            ),
          },
        ]}
        data={rows}
      />
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-white/60">
          Page {page} of {Math.max(1, Math.ceil(total / pageSize))} ({total} total)
        </span>
        <div className="flex gap-2">
          <GlassButton
            size="sm"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </GlassButton>
          <GlassButton
            size="sm"
            variant="secondary"
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
}

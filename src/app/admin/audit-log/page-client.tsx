"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassTable } from "@/components/ui/glass-table";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassSelect } from "@/components/ui/glass-select";

type Row = {
  id: string;
  createdAt: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
};

function formatDetails(details: string): string {
  if (!details?.trim()) return "—";
  try {
    const obj = JSON.parse(details) as Record<string, unknown>;
    const parts = Object.entries(obj).map(([k, v]) => {
      const val =
        typeof v === "object" && v !== null ? JSON.stringify(v) : String(v);
      return `${k}: ${val}`;
    });
    const joined = parts.join(", ");
    return joined.length > 80 ? joined.slice(0, 80) + "…" : joined;
  } catch {
    return details.length > 80 ? details.slice(0, 80) + "…" : details;
  }
}

export function AuditLogClient({
  rows,
  total,
  page,
  pageSize,
  actions,
  entityTypes,
}: {
  rows: Row[];
  total: number;
  page: number;
  pageSize: number;
  actions: string[];
  entityTypes: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const adminQuery = searchParams.get("admin") ?? "";
  const actionFilter = searchParams.get("action") ?? "";
  const entityTypeFilter = searchParams.get("entity_type") ?? "";
  const fromDate = searchParams.get("from") ?? "";
  const toDate = searchParams.get("to") ?? "";

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    params.set("page", "1");
    router.push(`/admin/audit-log?${params.toString()}`);
  };

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/admin/audit-log?${params.toString()}`);
  };

  const filterBar = (
    <GlassCard className="mb-4">
      <div className="flex flex-nowrap items-end gap-3 overflow-x-auto pb-2">
        <GlassInput
          label="Admin"
          placeholder="Email search..."
          value={adminQuery}
          onChange={(e) => updateUrl({ admin: e.target.value })}
          className="w-40 shrink-0"
        />
        <GlassSelect
          label="Action"
          options={[
            { value: "", label: "All" },
            ...actions.map((a) => ({ value: a, label: a })),
          ]}
          value={actionFilter}
          onChange={(e) => updateUrl({ action: e.target.value })}
          className="w-40 shrink-0"
        />
        <GlassSelect
          label="Entity Type"
          options={[
            { value: "", label: "All" },
            ...entityTypes.map((t) => ({ value: t, label: t })),
          ]}
          value={entityTypeFilter}
          onChange={(e) => updateUrl({ entity_type: e.target.value })}
          className="w-40 shrink-0"
        />
        <GlassInput
          label="From"
          type="date"
          value={fromDate}
          onChange={(e) => updateUrl({ from: e.target.value })}
          className="w-32 shrink-0"
        />
        <GlassInput
          label="To"
          type="date"
          value={toDate}
          onChange={(e) => updateUrl({ to: e.target.value })}
          className="w-32 shrink-0"
        />
        <GlassButton size="sm" variant="secondary" onClick={() => router.push("/admin/audit-log")}>
          Clear
        </GlassButton>
      </div>
    </GlassCard>
  );

  return (
    <div>
      {filterBar}
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
            render: (r) => {
              const formatted = formatDetails(r.details);
              return (
                <span className="block max-w-xs truncate" title={r.details}>
                  {formatted}
                </span>
              );
            },
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
    </div>
  );
}

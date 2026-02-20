"use client";

import { useRouter } from "next/navigation";
import { LnlTable, type LnlTableColumn } from "@/components/lnl/ui/lnl-table";
import { LnlBadge, type LnlBadgeVariant } from "@/components/lnl/ui/lnl-badge";

interface TaskRow {
  id: string;
  name: string;
  tool_type: string;
  status: string;
  item_count: number;
  user_count: number;
  created_at: string;
  [key: string]: unknown;
}

const statusVariant: Record<string, LnlBadgeVariant> = {
  draft: "default",
  active: "success",
  paused: "warning",
  completed: "info",
  archived: "default",
};

const toolLabel: Record<string, string> = {
  text_annotation: "Text Annotation",
  audio_evaluation: "Audio Evaluation",
  ipa_validation: "IPA Validation",
};

const columns: LnlTableColumn<TaskRow>[] = [
  { key: "name", header: "Name" },
  {
    key: "tool_type",
    header: "Type",
    render: (row) => (
      <span className="text-neutral-400">
        {toolLabel[row.tool_type] ?? row.tool_type}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <LnlBadge variant={statusVariant[row.status] ?? "default"}>
        {row.status}
      </LnlBadge>
    ),
  },
  {
    key: "item_count",
    header: "Items",
    render: (row) => (
      <span className="text-neutral-400">{row.item_count}</span>
    ),
  },
  {
    key: "user_count",
    header: "Users",
    render: (row) => (
      <span className="text-neutral-400">{row.user_count}</span>
    ),
  },
  {
    key: "created_at",
    header: "Created",
    render: (row) => (
      <span className="text-neutral-400">
        {new Date(row.created_at).toLocaleDateString()}
      </span>
    ),
  },
];

export function TasksTable({ tasks }: { tasks: TaskRow[] }) {
  const router = useRouter();

  return (
    <LnlTable
      columns={columns}
      data={tasks}
      emptyMessage="No tasks yet. Create your first task."
      onRowClick={(row) =>
        router.push(`/listen-and-log/admin/tasks/${row.id}`)
      }
    />
  );
}

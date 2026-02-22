"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LnlTable, type LnlTableColumn } from "@/components/lnl/ui/lnl-table";
import { LnlBadge, type LnlBadgeVariant } from "@/components/lnl/ui/lnl-badge";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { deleteTask, duplicateTask } from "@/app/listen-and-log/admin/tasks/actions";

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

function getColumns(isSuperAdmin: boolean): LnlTableColumn<TaskRow>[] {
  return [
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
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <TaskRowActions
          taskId={row.id}
          itemCount={row.item_count}
          isSuperAdmin={isSuperAdmin}
        />
      ),
      className: "w-40",
    },
  ];
}

function TaskRowActions({
  taskId,
  itemCount,
  isSuperAdmin,
}: {
  taskId: string;
  itemCount: number;
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleDuplicate(e: React.MouseEvent) {
    e.stopPropagation();
    setLoading("duplicate");
    const result = await duplicateTask(taskId);
    setLoading(null);
    if (result.error) alert(result.error);
    else if (result.taskId) router.push(`/listen-and-log/admin/tasks/${result.taskId}`);
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this task and all its data? This cannot be undone.")) return;
    setLoading("delete");
    const result = await deleteTask(taskId);
    setLoading(null);
    if (result.error) alert(result.error);
    else router.push("/listen-and-log/admin/tasks");
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {itemCount > 0 && (
        <Link href={`/listen-and-log/tasks/${taskId}/items/1`}>
          <LnlButton variant="ghost" size="sm">
            View
          </LnlButton>
        </Link>
      )}
      {isSuperAdmin && (
        <>
          <LnlButton
            variant="ghost"
            size="sm"
            loading={loading === "duplicate"}
            onClick={handleDuplicate}
          >
            Duplicate
          </LnlButton>
          <LnlButton
            variant="ghost"
            size="sm"
            loading={loading === "delete"}
            onClick={handleDelete}
          >
            Delete
          </LnlButton>
        </>
      )}
    </div>
  );
}

export function TasksTable({ tasks, isSuperAdmin = false }: { tasks: TaskRow[]; isSuperAdmin?: boolean }) {
  const router = useRouter();

  return (
    <LnlTable
      columns={getColumns(isSuperAdmin)}
      data={tasks}
      emptyMessage="No tasks yet. Create your first task."
      onRowClick={(row) =>
        router.push(`/listen-and-log/admin/tasks/${row.id}`)
      }
    />
  );
}

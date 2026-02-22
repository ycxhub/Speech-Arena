"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { updateTaskStatus, deleteTask, duplicateTask } from "@/app/listen-and-log/admin/tasks/actions";

interface Props {
  taskId: string;
  currentStatus: string;
  isSuperAdmin?: boolean;
  hasItems?: boolean;
}

const transitions: Record<string, Array<{ label: string; status: string; variant: "primary" | "secondary" | "danger" }>> = {
  draft: [
    { label: "Publish", status: "active", variant: "primary" },
    { label: "Delete", status: "__delete__", variant: "danger" },
  ],
  active: [
    { label: "Pause", status: "paused", variant: "secondary" },
    { label: "Complete", status: "completed", variant: "primary" },
  ],
  paused: [
    { label: "Resume", status: "active", variant: "primary" },
    { label: "Archive", status: "archived", variant: "secondary" },
  ],
  completed: [
    { label: "Archive", status: "archived", variant: "secondary" },
  ],
  archived: [],
};

export function TaskStatusControls({
  taskId,
  currentStatus,
  isSuperAdmin = false,
  hasItems = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const actions = transitions[currentStatus] ?? [];
  const showDelete = isSuperAdmin || currentStatus === "draft";

  async function handleAction(status: string) {
    setLoading(status);
    if (status === "__delete__") {
      if (!confirm("Delete this task and all its data? This cannot be undone.")) {
        setLoading(null);
        return;
      }
      const result = await deleteTask(taskId);
      if (result.error) {
        alert(result.error);
      } else {
        router.push("/listen-and-log/admin/tasks");
      }
    } else if (status === "__duplicate__") {
      const result = await duplicateTask(taskId);
      if (result.error) {
        alert(result.error);
      } else if (result.taskId) {
        router.push(`/listen-and-log/admin/tasks/${result.taskId}`);
        router.refresh();
      }
    } else {
      await updateTaskStatus(taskId, status);
      router.refresh();
    }
    setLoading(null);
  }

  const statusButtons = showDelete
    ? actions
    : actions.filter((a) => a.status !== "__delete__");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasItems && (
        <Link href={`/listen-and-log/tasks/${taskId}/items/1`}>
          <LnlButton variant="secondary" size="sm">
            View
          </LnlButton>
        </Link>
      )}
      {isSuperAdmin && (
        <LnlButton
          variant="secondary"
          size="sm"
          loading={loading === "__duplicate__"}
          onClick={() => handleAction("__duplicate__")}
        >
          Duplicate
        </LnlButton>
      )}
      {showDelete && (
        <LnlButton
          variant="danger"
          size="sm"
          loading={loading === "__delete__"}
          onClick={() => handleAction("__delete__")}
        >
          Delete
        </LnlButton>
      )}
      {statusButtons.map((action) => (
        <LnlButton
          key={action.status}
          variant={action.variant}
          size="sm"
          loading={loading === action.status}
          onClick={() => handleAction(action.status)}
        >
          {action.label}
        </LnlButton>
      ))}
    </div>
  );
}

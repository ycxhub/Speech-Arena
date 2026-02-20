"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { updateTaskStatus, deleteTask } from "@/app/listen-and-log/admin/tasks/actions";

interface Props {
  taskId: string;
  currentStatus: string;
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

export function TaskStatusControls({ taskId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const actions = transitions[currentStatus] ?? [];

  async function handleAction(status: string) {
    setLoading(status);
    if (status === "__delete__") {
      if (!confirm("Delete this task and all its data? This cannot be undone.")) {
        setLoading(null);
        return;
      }
      await deleteTask(taskId);
      router.push("/listen-and-log/admin/tasks");
    } else {
      await updateTaskStatus(taskId, status);
      router.refresh();
    }
    setLoading(null);
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex gap-2">
      {actions.map((action) => (
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

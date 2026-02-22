"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { CsvUploadForm } from "@/components/lnl/admin/csv-upload-form";
import {
  TaskUserAssignment,
  type TaskAssignment,
} from "@/components/lnl/admin/task-user-assignment";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { assignUsersToTask } from "../actions";

interface Props {
  taskId: string;
  status: string;
  availableUsers: Array<{ user_id: string; email: string; role: string }>;
  initialAssignments: TaskAssignment[];
}

export function TaskDetailClient({
  taskId,
  status,
  availableUsers,
  initialAssignments,
}: Props) {
  const isDraft = status === "draft";
  const router = useRouter();
  const [assignments, setAssignments] = useState<TaskAssignment[]>(
    initialAssignments
  );
  const [saving, setSaving] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  async function handleSaveAssignments() {
    setSaving(true);
    setAssignError(null);
    const result = await assignUsersToTask(
      taskId,
      assignments.map((a) => ({ userId: a.userId, role: a.role }))
    );
    setSaving(false);
    if (result.error) {
      setAssignError(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <>
      <LnlCard>
        <h2 className="text-sm font-semibold text-neutral-100">
          Dataset Upload
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          {isDraft
            ? "Upload a CSV with item_id, text, audio_filename columns, plus audio files. Drag & drop or select files, then validate and upload."
            : "Task configuration is locked after publishing."}
        </p>
        <div className="mt-4">
          <CsvUploadForm
            taskId={taskId}
            onUploadComplete={() => router.refresh()}
            disabled={!isDraft}
          />
        </div>
      </LnlCard>

      <LnlCard>
        <h2 className="text-sm font-semibold text-neutral-100">
          Assign Users
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          {isDraft
            ? "Search by email to add annotators or auditors. Save to apply changes."
            : "Task configuration is locked after publishing."}
        </p>
        <div className="mt-4">
          <TaskUserAssignment
            availableUsers={availableUsers}
            value={assignments}
            onChange={setAssignments}
            disabled={!isDraft}
          />
          {isDraft && (
            <div className="mt-4 flex items-center gap-3">
              <LnlButton
                size="sm"
                onClick={handleSaveAssignments}
                loading={saving}
              >
                Save Assignments
              </LnlButton>
              {assignError && (
                <p className="text-sm text-red-400">{assignError}</p>
              )}
            </div>
          )}
        </div>
      </LnlCard>
    </>
  );
}

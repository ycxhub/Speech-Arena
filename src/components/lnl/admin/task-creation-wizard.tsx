"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { LnlModal } from "@/components/lnl/ui/lnl-modal";
import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { LnlInput } from "@/components/lnl/ui/lnl-input";
import { LnlSelect } from "@/components/lnl/ui/lnl-select";
import { LnlProgress } from "@/components/lnl/ui/lnl-progress";
import { LnlBadge } from "@/components/lnl/ui/lnl-badge";
import { LabelConfigEditor, type LabelConfig } from "./label-config-editor";
import {
  TaskOptionsForm,
  type TaskOptions,
  DEFAULT_TASK_OPTIONS,
} from "./task-options-form";
import {
  TaskUserAssignment,
  type TaskAssignment,
} from "./task-user-assignment";
import { createTask, assignUsersToTask } from "@/app/listen-and-log/admin/tasks/actions";

const STEPS = [
  "Basics",
  "Labels",
  "Options",
  "Assign Users",
  "Review",
];

interface Props {
  availableUsers: Array<{ user_id: string; email: string; role: string }>;
}

export function TaskCreationWizard({ availableUsers }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [toolType, setToolType] = useState("text_annotation");
  const [labels, setLabels] = useState<LabelConfig[]>([]);
  const [taskOptions, setTaskOptions] = useState<TaskOptions>(DEFAULT_TASK_OPTIONS);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);

  function canAdvance(): boolean {
    switch (step) {
      case 0:
        return name.trim().length > 0;
      case 1:
        return labels.length > 0 && labels.every((l) => l.name.trim().length > 0);
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  }

  async function handlePublish(asDraft: boolean) {
    setLoading(true);
    setError(null);

    const result = await createTask({
      name,
      description,
      tool_type: toolType,
      label_config: { labels },
      task_options: taskOptions as unknown as Record<string, unknown>,
      status: asDraft ? "draft" : "active",
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (assignments.length > 0 && result.taskId) {
      const assignResult = await assignUsersToTask(
        result.taskId,
        assignments.map((a) => ({ userId: a.userId, role: a.role }))
      );
      if (assignResult.error) {
        setError(assignResult.error);
        setLoading(false);
        return;
      }
    }

    router.push(`/listen-and-log/admin/tasks`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <LnlProgress
        value={step + 1}
        max={STEPS.length}
        label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
        showPercentage
        className="mb-6"
      />

      <LnlCard>
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-neutral-100">
              Task Basics
            </h2>
            <LnlInput
              label="Task Name"
              placeholder="e.g. Model QA - English v2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <LnlInput
              label="Description"
              placeholder="Describe the purpose of this task"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <LnlSelect
              label="Tool Type"
              options={[
                { value: "text_annotation", label: "Text Annotation with Single Audio" },
                { value: "audio_evaluation", label: "Audio Evaluation" },
                { value: "ipa_validation", label: "IPA Validation & Correction" },
              ]}
              value={toolType}
              onChange={(e) => setToolType(e.target.value)}
            />
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-neutral-100">
              Label Configuration
            </h2>
            <LabelConfigEditor value={labels} onChange={setLabels} />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-neutral-100">
              Task Options
            </h2>
            <TaskOptionsForm value={taskOptions} onChange={setTaskOptions} />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-neutral-100">
              Assign Users
            </h2>
            <TaskUserAssignment
              availableUsers={availableUsers}
              value={assignments}
              onChange={setAssignments}
            />
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-neutral-100">
              Review & Publish
            </h2>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Name</span>
                <span className="text-neutral-100">{name}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Tool Type</span>
                <span className="text-neutral-100">{toolType.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Labels</span>
                <div className="flex gap-1">
                  {labels.map((l, i) => (
                    <LnlBadge key={i} color={l.color}>
                      {l.name}
                    </LnlBadge>
                  ))}
                </div>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Boolean Questions</span>
                <span className="text-neutral-100">
                  {taskOptions.boolean_questions.length}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Scoring Fields</span>
                <span className="text-neutral-100">
                  {taskOptions.scoring_fields.length}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Assigned Users</span>
                <span className="text-neutral-100">
                  {assignments.length}
                </span>
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                After publishing, upload CSV (item_id, text, audio_filename) and matching audio files
                from the task management page.
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <LnlButton
            variant="ghost"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
          >
            Back
          </LnlButton>

          <div className="flex gap-3">
            {step === STEPS.length - 1 ? (
              <>
                <LnlButton
                  variant="secondary"
                  onClick={() => handlePublish(true)}
                  loading={loading}
                >
                  Save as Draft
                </LnlButton>
                <LnlButton
                  onClick={() => setShowPublishConfirm(true)}
                  loading={loading}
                >
                  Publish Task
                </LnlButton>
              </>
            ) : (
              <LnlButton
                onClick={() => setStep(step + 1)}
                disabled={!canAdvance()}
              >
                Next
              </LnlButton>
            )}
          </div>
        </div>
      </LnlCard>

      <LnlModal
        isOpen={showPublishConfirm}
        onClose={() => setShowPublishConfirm(false)}
        title="Confirm publish"
        footer={
          <>
            <LnlButton variant="secondary" onClick={() => setShowPublishConfirm(false)}>
              Cancel
            </LnlButton>
            <LnlButton
              onClick={async () => {
                setShowPublishConfirm(false);
                await handlePublish(false);
              }}
              loading={loading}
            >
              Publish
            </LnlButton>
          </>
        }
      >
        <p className="text-sm text-neutral-300">
          Task settings (labels, questions, scoring) cannot be edited after
          publishing. Double-check before proceeding.
        </p>
      </LnlModal>
    </div>
  );
}

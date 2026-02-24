"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { LnlInput } from "@/components/lnl/ui/lnl-input";
import { LnlSelect } from "@/components/lnl/ui/lnl-select";
import { LnlProgress } from "@/components/lnl/ui/lnl-progress";
import { LnlBadge } from "@/components/lnl/ui/lnl-badge";
import { parseTextUpload, type ParsedTextItem } from "@/lib/lnl/text-upload-parser";
import {
  createTask,
  createTaskItemsFromPlainText,
  assignUsersToTask,
  getModelsForLanguageForLnL,
  getLanguagesForLnL,
} from "@/app/listen-and-log/admin/tasks/actions";
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

const STEPS = [
  "Text Upload",
  "Model & Language",
  "Task Basics",
  "Labels & Options",
  "Assign Users",
  "Review & Create",
];

const DEFAULT_LABELS: LabelConfig[] = [
  { name: "Good", color: "#22c55e", description: "Acceptable quality", shortcut_key: "1" },
  { name: "Issue", color: "#ef4444", description: "Needs review", shortcut_key: "2" },
];

interface Props {
  availableUsers: Array<{ user_id: string; email: string; role: string }>;
}

export function CreateOnTheFlyWizard({ availableUsers }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<{
    valid: boolean;
    items: ParsedTextItem[];
    errors: string[];
  } | null>(null);

  const [languages, setLanguages] = useState<Array<{ id: string; code: string; name?: string }>>([]);
  const [models, setModels] = useState<Array<{ id: string; label: string }>>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);

  const [languageId, setLanguageId] = useState("");
  const [modelId, setModelId] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [labels, setLabels] = useState<LabelConfig[]>(DEFAULT_LABELS);
  const [taskOptions, setTaskOptions] = useState<TaskOptions>(DEFAULT_TASK_OPTIONS);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);

  useEffect(() => {
    getLanguagesForLnL().then((res) => {
      setLoadingLanguages(false);
      if (res.data) setLanguages(res.data);
    });
  }, []);

  useEffect(() => {
    if (!languageId) {
      setModels([]);
      setModelId("");
      return;
    }
    setLoadingModels(true);
    getModelsForLanguageForLnL(languageId).then((res) => {
      setLoadingModels(false);
      if (res.data) {
        setModels(res.data);
        setModelId((prev) => {
          const stillValid = res.data!.some((m) => m.id === prev);
          return stillValid ? prev : res.data![0]?.id ?? "";
        });
      } else {
        setModels([]);
        setModelId("");
      }
    });
  }, [languageId]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setFile(f);
      f.text().then((content) => {
        const result = parseTextUpload(content, f.name);
        setParseResult(result);
      });
    },
    []
  );

  function canAdvance(): boolean {
    switch (step) {
      case 0:
        return !!parseResult?.valid && (parseResult?.items.length ?? 0) > 0;
      case 1:
        return !!modelId && !!languageId;
      case 2:
        return name.trim().length > 0;
      case 3:
        return labels.length > 0 && labels.every((l) => l.name.trim().length > 0);
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  }

  async function handleCreate() {
    if (!parseResult?.valid || parseResult.items.length === 0 || !modelId || !languageId) return;

    setLoading(true);
    setError(null);

    const baseTaskOptions = {
      ...taskOptions,
      tts_generation: { model_id: modelId, language_id: languageId },
    };

    const createResult = await createTask({
      name: name.trim(),
      description: description.trim(),
      tool_type: "text_annotation",
      label_config: { labels },
      task_options: baseTaskOptions as unknown as Record<string, unknown>,
      status: "draft",
    });

    if (createResult.error) {
      setError(createResult.error);
      setLoading(false);
      return;
    }

    const taskId = createResult.taskId!;
    const itemsResult = await createTaskItemsFromPlainText({
      taskId,
      items: parseResult.items,
    });

    if (itemsResult.error) {
      setError(itemsResult.error);
      setLoading(false);
      return;
    }

    if (assignments.length > 0) {
      const assignResult = await assignUsersToTask(
        taskId,
        assignments.map((a) => ({ userId: a.userId, role: a.role }))
      );
      if (assignResult.error) {
        setError(assignResult.error);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.push(`/listen-and-log/admin/tasks/${taskId}`);
    router.refresh();
  }

  return (
    <LnlCard className="border-dashed" padding="lg">
      <LnlProgress
        value={step + 1}
        max={STEPS.length}
        label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
        showPercentage
        className="mb-6"
      />

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-neutral-100">Text Upload</h2>
          <p className="text-sm text-neutral-500">
            Upload a .txt or .csv file. .txt: one line per item. .csv: requires a &quot;text&quot;
            column. Max 1000 items, 5000 chars per line.
          </p>
          <div>
            <input
              type="file"
              accept=".txt,.csv,.text"
              onChange={handleFileChange}
              className="block w-full text-sm text-neutral-400 file:mr-4 file:rounded-md file:border-0 file:bg-neutral-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-200 hover:file:bg-neutral-600"
            />
            {file && (
              <p className="mt-2 text-sm text-neutral-400">
                {file.name} — {parseResult?.valid ? `${parseResult.items.length} items parsed` : "Invalid"}
              </p>
            )}
            {parseResult && !parseResult.valid && parseResult.errors.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-red-400">
                {parseResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-neutral-100">Model & Language</h2>
          <p className="text-sm text-neutral-500">
            Select the TTS model and language. Only models that support the language are shown.
          </p>
          <LnlSelect
            label="Language"
            options={languages.map((l) => ({
              value: l.id,
              label: l.name ? `${l.name} (${l.code})` : l.code,
            }))}
            value={languageId}
            onChange={(e) => setLanguageId(e.target.value)}
          />
          {loadingLanguages && <p className="text-sm text-neutral-500">Loading languages…</p>}
          <LnlSelect
            label="TTS Model"
            options={models.map((m) => ({ value: m.id, label: m.label }))}
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            disabled={!languageId || loadingModels}
          />
          {languageId && !loadingModels && models.length === 0 && (
            <p className="text-sm text-amber-500">
              No models support this language. Add models with API keys in Admin → Providers.
            </p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-neutral-100">Task Basics</h2>
          <LnlInput
            label="Task Name"
            placeholder="e.g. TTS QA - English v1"
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
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-neutral-100">Labels & Options</h2>
          <LabelConfigEditor value={labels} onChange={setLabels} />
          <TaskOptionsForm value={taskOptions} onChange={setTaskOptions} />
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-neutral-100">Assign Users</h2>
          <TaskUserAssignment
            availableUsers={availableUsers}
            value={assignments}
            onChange={setAssignments}
          />
        </div>
      )}

      {step === 5 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-neutral-100">Review & Create</h2>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between border-b border-neutral-800 pb-2">
              <span className="text-neutral-400">Items</span>
              <span className="text-neutral-100">{parseResult?.items.length ?? 0}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-800 pb-2">
              <span className="text-neutral-400">Model</span>
              <span className="text-neutral-100">
                {models.find((m) => m.id === modelId)?.label ?? modelId}
              </span>
            </div>
            <div className="flex justify-between border-b border-neutral-800 pb-2">
              <span className="text-neutral-400">Task Name</span>
              <span className="text-neutral-100">{name}</span>
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
              <span className="text-neutral-400">Assigned Users</span>
              <span className="text-neutral-100">{assignments.length}</span>
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              After creating, audio will be generated in the background. You can monitor progress on
              the task detail page.
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <LnlButton
          variant="ghost"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
        >
          Back
        </LnlButton>

        {step === STEPS.length - 1 ? (
          <LnlButton
            onClick={handleCreate}
            loading={loading}
            disabled={!canAdvance()}
          >
            Create Task
          </LnlButton>
        ) : (
          <LnlButton
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
          >
            Next
          </LnlButton>
        )}
      </div>
    </LnlCard>
  );
}

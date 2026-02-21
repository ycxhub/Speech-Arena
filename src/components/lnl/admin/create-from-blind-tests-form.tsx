"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { LnlInput } from "@/components/lnl/ui/lnl-input";
import { LnlSelect } from "@/components/lnl/ui/lnl-select";
import {
  createTaskFromBlindTests,
  getMurfFalconModels,
} from "@/app/listen-and-log/admin/tasks/actions";

export function CreateFromBlindTestsForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<Array<{ id: string; name: string; model_id: string }>>([]);
  const [outcome, setOutcome] = useState<"lost" | "won">("lost");
  const [taskName, setTaskName] = useState("Falcon's Lost Blind Tests");
  const [taskDescription, setTaskDescription] = useState("");

  useEffect(() => {
    getMurfFalconModels().then((res) => {
      setLoadingModels(false);
      if (res.data) setModels(res.data);
      if (res.error) setError(res.error);
    });
  }, []);

  useEffect(() => {
    setTaskName(
      outcome === "lost" ? "Falcon's Lost Blind Tests" : "Falcon's Won Blind Tests"
    );
  }, [outcome]);

  async function handleCreate() {
    if (models.length === 0) {
      setError("No Murf Falcon models found. Add Murf Falcon models in Admin first.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createTaskFromBlindTests({
      modelIds: models.map((m) => m.id),
      outcome,
      taskName: taskName.trim() || (outcome === "lost" ? "Falcon's Lost Blind Tests" : "Falcon's Won Blind Tests"),
      taskDescription: taskDescription.trim() || undefined,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.taskId) {
      router.push(`/listen-and-log/admin/tasks/${result.taskId}`);
      router.refresh();
    }
  }

  return (
    <LnlCard className="border-dashed" padding="lg">
      <h2 className="text-base font-semibold text-neutral-100">
        Create from Blind Tests
      </h2>
      <p className="mt-1 text-sm text-neutral-500">
        Create a task from Murf Falcon&apos;s blind test history. Items are
        deduplicated by sentence — each unique sentence appears once.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        {loadingModels ? (
          <p className="text-sm text-neutral-500">Loading Murf Falcon models…</p>
        ) : models.length === 0 ? (
          <p className="text-sm text-amber-500">
            No Murf AI FALCON models found. Add a provider named &quot;Murf AI&quot;
            with FALCON model(s) in Admin → Providers first.
          </p>
        ) : (
          <>
            <p className="text-sm text-neutral-400">
              Using {models.length} Murf Falcon model
              {models.length > 1 ? "s" : ""}:{" "}
              {models.map((m) => m.name).join(", ")}
            </p>

            <LnlSelect
              label="Outcome"
              options={[
                { value: "lost", label: "Falcon Lost" },
                { value: "won", label: "Falcon Won" },
              ]}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as "lost" | "won")}
            />

            <LnlInput
              label="Task Name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g. Falcon's Lost Blind Tests"
            />

            <LnlInput
              label="Description (optional)"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Describe the purpose of this task"
            />

            <LnlButton
              onClick={handleCreate}
              loading={loading}
              disabled={models.length === 0}
            >
              Create Task from Blind Tests
            </LnlButton>
          </>
        )}

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    </LnlCard>
  );
}

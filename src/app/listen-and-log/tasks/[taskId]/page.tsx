import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTaskConfig, getTaskProgress } from "./actions";
import { LnlHeader } from "@/components/lnl/layout/lnl-header";
import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import { LnlProgress } from "@/components/lnl/ui/lnl-progress";
import { LnlBadge } from "@/components/lnl/ui/lnl-badge";
import Link from "next/link";

export default async function TaskOverviewPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const task = await getTaskConfig(taskId);
  if (!task) redirect("/listen-and-log");

  const progress = await getTaskProgress(taskId, user.id);
  const startItem = progress.lastDisplayIndex ?? progress.lastItemIndex ?? 1;
  const isCompleted = progress.completed >= progress.total && progress.total > 0;

  const labelConfig = task.label_config as {
    labels?: Array<{ name: string; color: string }>;
  };
  const labels = labelConfig?.labels ?? [];

  return (
    <>
      <LnlHeader
        breadcrumbs={[
          { label: "Listen & Log", href: "/listen-and-log" },
          { label: task.name },
        ]}
      />
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
        <LnlCard>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-neutral-100">
              {task.name}
            </h1>
            <LnlBadge variant={task.status === "active" ? "success" : "default"}>
              {task.status}
            </LnlBadge>
          </div>

          {task.description && (
            <p className="mt-2 text-sm text-neutral-400">{task.description}</p>
          )}

          <div className="mt-4">
            <LnlProgress
              value={progress.completed}
              max={progress.total}
              label="Your progress"
              showPercentage
            />
            <p className="mt-1 text-xs text-neutral-500">
              {progress.completed} of {progress.total} items completed
            </p>
          </div>

          {labels.length > 0 && (
            <div className="mt-4">
              <p className="mb-1 text-xs text-neutral-500">Labels</p>
              <div className="flex flex-wrap gap-1">
                {labels.map((l, i) => (
                  <LnlBadge key={i} color={l.color}>
                    {l.name}
                  </LnlBadge>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            {progress.total === 0 ? (
              <p className="text-sm text-neutral-500">
                No items in this task yet. The admin needs to upload a dataset.
              </p>
            ) : isCompleted ? (
              <div className="flex items-center gap-3">
                <LnlBadge variant="success">Completed</LnlBadge>
                <Link href={`/listen-and-log/tasks/${taskId}/items/1`}>
                  <LnlButton variant="secondary" size="sm">
                    Review Annotations
                  </LnlButton>
                </Link>
              </div>
            ) : (
              <Link href={`/listen-and-log/tasks/${taskId}/items/${startItem}`}>
                <LnlButton>
                  {progress.completed > 0 ? "Continue Annotating" : "Start Annotating"}
                </LnlButton>
              </Link>
            )}
          </div>
        </LnlCard>
      </div>
    </>
  );
}

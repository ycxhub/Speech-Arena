import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { isLnlAdmin, isSuperAdmin } from "@/lib/lnl/roles";
import { redirect, notFound } from "next/navigation";
import { LnlHeader } from "@/components/lnl/layout/lnl-header";
import { LnlCard } from "@/components/lnl/ui/lnl-card";
import { LnlBadge } from "@/components/lnl/ui/lnl-badge";
import { TaskStatusControls } from "@/components/lnl/admin/task-status-controls";
import { TaskNameEditable } from "@/components/lnl/admin/task-name-editable";
import { getLnlUsers } from "../../users/actions";
import { TaskDetailClient } from "./task-detail-client";
import { DraftTaskSettingsEditor } from "./draft-task-settings-editor";

const statusVariant: Record<string, "default" | "success" | "warning" | "info"> = {
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

export default async function TaskDetailPage({
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

  const authorized = await isLnlAdmin(user.id);
  if (!authorized) redirect("/listen-and-log");

  const superAdmin = await isSuperAdmin(user.id);
  const adminClient = getAdminClient();
  const { data: task } = await adminClient
    .from("lnl_tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (!task) notFound();

  const { count: itemCount } = await adminClient
    .from("lnl_task_items")
    .select("*", { count: "exact", head: true })
    .eq("task_id", taskId);

  const { data: assignments } = await adminClient
    .from("lnl_task_assignments")
    .select("user_id, role")
    .eq("task_id", taskId);

  const labelConfig = task.label_config as { labels?: Array<{ name: string; color: string }> };
  const labels = labelConfig?.labels ?? [];
  const taskOptions = task.task_options as {
    boolean_questions?: string[];
    scoring_fields?: Array<{ name: string; min: number; max: number; description: string }>;
  } | null;
  const booleanQuestions = taskOptions?.boolean_questions ?? [];
  const scoringFields = taskOptions?.scoring_fields ?? [];

  const { data: users } = await getLnlUsers();
  const availableUsers = users ?? [];

  const assignmentUserIds = [...new Set((assignments ?? []).map((a) => a.user_id))];
  const profilesForAssigned =
    assignmentUserIds.length > 0
      ? await adminClient
          .from("profiles")
          .select("id, email")
          .in("id", assignmentUserIds)
      : { data: [] };
  const profileMap = new Map(
    (profilesForAssigned.data ?? []).map((p) => [p.id, p.email])
  );
  const initialAssignments = (assignments ?? []).map((a) => {
    const email = profileMap.get(a.user_id);
    return {
      userId: a.user_id,
      email: email ?? "Unknown",
      role: a.role,
    };
  });
  for (const a of initialAssignments) {
    if (a.email === "Unknown") {
      const { data } = await adminClient.auth.admin.getUserById(a.userId);
      a.email = data?.user?.email ?? "Unknown";
    }
  }

  return (
    <>
      <LnlHeader
        breadcrumbs={[
          { label: "Listen & Log", href: "/listen-and-log" },
          { label: "Tasks", href: "/listen-and-log/admin/tasks" },
          { label: task.name },
        ]}
      />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <TaskNameEditable
                taskId={taskId}
                name={task.name}
                isDraft={task.status === "draft"}
              />
              <LnlBadge variant={statusVariant[task.status] ?? "default"}>
                {task.status}
              </LnlBadge>
            </div>
            {task.description && (
              <p className="mt-1 text-sm text-neutral-400">
                {task.description}
              </p>
            )}
          </div>
          <TaskStatusControls
            taskId={taskId}
            currentStatus={task.status}
            isSuperAdmin={superAdmin}
            hasItems={(itemCount ?? 0) > 0}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <LnlCard>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Type
            </p>
            <p className="mt-1 text-lg font-semibold text-neutral-100">
              {toolLabel[task.tool_type] ?? task.tool_type}
            </p>
          </LnlCard>
          <LnlCard>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Items
            </p>
            <p className="mt-1 text-lg font-semibold text-neutral-100">
              {itemCount ?? 0}
            </p>
          </LnlCard>
          <LnlCard>
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Assigned Users
            </p>
            <p className="mt-1 text-lg font-semibold text-neutral-100">
              {assignments?.length ?? 0}
            </p>
          </LnlCard>
          {task.status !== "draft" && (
            <LnlCard>
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Labels
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {labels.length > 0 ? (
                  labels.map((l, i) => (
                    <LnlBadge key={i} color={l.color}>
                      {l.name}
                    </LnlBadge>
                  ))
                ) : (
                  <span className="text-sm text-neutral-500">None</span>
                )}
              </div>
            </LnlCard>
          )}
        </div>

        {task.status === "draft" ? (
          <DraftTaskSettingsEditor
            taskId={taskId}
            initialLabels={labels}
            initialBooleanQuestions={booleanQuestions}
            initialScoringFields={scoringFields}
            initialTaskOptions={(task.task_options as Record<string, unknown>) ?? {}}
          />
        ) : (
          (booleanQuestions.length > 0 || scoringFields.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              {booleanQuestions.length > 0 && (
                <LnlCard>
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Boolean Questions
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-300">
                    {booleanQuestions.map((q, i) => (
                      <li key={i}>{q || "(empty)"}</li>
                    ))}
                  </ul>
                </LnlCard>
              )}
              {scoringFields.length > 0 && (
                <LnlCard>
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Scoring Fields
                  </p>
                  <ul className="mt-2 space-y-2 text-sm text-neutral-300">
                    {scoringFields.map((f, i) => (
                      <li key={i}>
                        {f.name} ({f.min}–{f.max})
                        {f.description && (
                          <span className="ml-1 text-neutral-500">— {f.description}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </LnlCard>
              )}
            </div>
          )
        )}

        <TaskDetailClient
          taskId={taskId}
          status={task.status}
          availableUsers={availableUsers}
          initialAssignments={initialAssignments}
        />
      </div>
    </>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import {
  getTaskConfig,
  getTaskItem,
  getAnnotation,
  getTaskProgress,
  getTaskAssignmentRole,
  getAnnotatorsForTask,
  getAnnotationHistory,
} from "../../actions";
import { AnnotationWorkspace } from "@/components/lnl/workspace/annotation-workspace";

export default async function AnnotationItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ taskId: string; itemIndex: string }>;
  searchParams: Promise<{ annotator?: string }>;
}) {
  const { taskId, itemIndex: itemIndexStr } = await params;
  const { annotator: viewAnnotatorId } = await searchParams;
  const itemIndex = parseInt(itemIndexStr, 10);

  if (isNaN(itemIndex) || itemIndex < 1) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const [task, item, progress, assignmentRole, annotators] = await Promise.all([
    getTaskConfig(taskId),
    getTaskItem(taskId, itemIndex, user.id),
    getTaskProgress(taskId, user.id),
    getTaskAssignmentRole(taskId, user.id),
    getAnnotatorsForTask(taskId),
  ]);

  if (!task) redirect("/listen-and-log");
  if (!item) notFound();

  const isAuditor = assignmentRole === "auditor";
  const effectiveViewAnnotatorId =
    isAuditor && viewAnnotatorId
      ? viewAnnotatorId
      : isAuditor && annotators.length > 0
        ? annotators[0]!.userId
        : null;
  const targetUserId = effectiveViewAnnotatorId ?? user.id;

  const annotation = await getAnnotation(taskId, item.id, targetUserId);
  const history = annotation
    ? await getAnnotationHistory(annotation.id)
    : [];

  return (
    <AnnotationWorkspace
      taskConfig={task as {
        id: string;
        name: string;
        label_config: Record<string, unknown>;
        task_options: Record<string, unknown>;
      }}
      item={{
        id: item.id,
        item_index: item.item_index,
        audio_url: item.audio_url,
        text: item.text,
        ipa_text: item.ipa_text,
        normalized_text: item.normalized_text,
        metadata: item.metadata as Record<string, unknown> | undefined,
      }}
      displayIndex={itemIndex}
      existingAnnotation={annotation}
      totalItems={progress.total}
      completedItems={progress.completed}
      userId={user.id}
      isAuditor={isAuditor ?? false}
      annotators={annotators}
      viewAnnotatorId={effectiveViewAnnotatorId}
      annotationHistory={history}
    />
  );
}

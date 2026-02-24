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
  generateAndGetAudioUrl,
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

  let audioUrl = item.audio_url;
  let generationError: string | null = null;
  if (!audioUrl) {
    const genResult = await generateAndGetAudioUrl(taskId, item.id, user.id);
    if (genResult.error || !genResult.signedUrl) {
      generationError = genResult.error ?? "Failed to generate audio";
    } else {
      audioUrl = genResult.signedUrl;
    }
  }

  if (generationError || !audioUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <p className="text-lg font-medium text-neutral-100">Audio generation failed</p>
        <p className="text-sm text-neutral-400">{generationError}</p>
        <a
          href={`/listen-and-log/tasks/${taskId}/items/${itemIndex}`}
          className="rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-600"
        >
          Retry
        </a>
      </div>
    );
  }

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
        audio_url: audioUrl as string,
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

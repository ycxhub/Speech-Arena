"use client";

import { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceLayout } from "./workspace-layout";
import { AnnotationSidePanel } from "./annotation-side-panel";
import { AuditBar } from "./audit-bar";
import { AnnotationHistory } from "./annotation-history";
import { CompletionCelebration } from "./completion-celebration";
import { AnnotationStoreProvider, useAnnotationStore } from "@/lib/lnl/annotation-store";
import { useAutoSave } from "@/lib/lnl/auto-save";
import { LnlButton } from "@/components/lnl/ui/lnl-button";
import {
  saveAnnotation,
  saveAnnotationAsReviewer,
  reopenAnnotation,
} from "@/app/listen-and-log/tasks/[taskId]/actions";

interface LabelEntry {
  start_word_index: number;
  end_word_index: number;
  label_name: string;
  color: string;
  comment: string;
}

interface TaskConfig {
  id: string;
  name: string;
  label_config: Record<string, unknown>;
  task_options: Record<string, unknown>;
}

interface ItemData {
  id: string;
  item_index: number;
  audio_url: string;
  text: string;
  ipa_text?: string | null;
  normalized_text?: string | null;
  metadata?: Record<string, unknown>;
}

interface ExistingAnnotation {
  id?: string;
  labels: unknown;
  boolean_answers: unknown;
  scores: unknown;
  overall_comment: string | null;
  status: string;
  time_spent_ms: number | null;
}

interface AnnotatorOption {
  userId: string;
  email: string;
}

interface HistoryEntry {
  id: string;
  changedBy: string;
  changedByEmail: string;
  previousData: unknown;
  changeType: string;
  changeDescription: string | null;
  createdAt: string;
}

interface Props {
  taskConfig: TaskConfig;
  item: ItemData;
  displayIndex: number;
  existingAnnotation: ExistingAnnotation | null;
  totalItems: number;
  completedItems: number;
  userId: string;
  isAuditor?: boolean;
  annotators?: AnnotatorOption[];
  viewAnnotatorId?: string | null;
  annotationHistory?: HistoryEntry[];
}

function AnnotationWorkspaceInner(props: Props) {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const {
    taskConfig,
    item,
    totalItems,
    completedItems,
    isAuditor,
    annotators = [],
    viewAnnotatorId,
    annotationHistory = [],
  } = props;

  const labelConfig = taskConfig.label_config as {
    labels?: Array<{
      name: string;
      color: string;
      shortcut_key: string;
      description: string;
    }>;
  };
  const taskLabels = useMemo(
    () => labelConfig?.labels ?? [],
    [labelConfig?.labels]
  );
  const labelColors: Record<string, string> = {};
  for (const l of taskLabels) {
    labelColors[l.name] = l.color;
  }

  const store = useAnnotationStore();
  const isViewingAsAuditor = isAuditor && viewAnnotatorId && viewAnnotatorId !== props.userId;
  const canEdit = !isViewingAsAuditor || isEditMode;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (store.isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [store.isDirty]);

  const [showCelebration, setShowCelebration] = useState(false);
  const hasShownCelebration = useRef(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [item.id]);

  const handleSave = useCallback(
    async (payload: {
      labels: LabelEntry[];
      booleanAnswers: Record<string, boolean>;
      scores: Record<string, number>;
      overallComment: string;
      status: string;
    }) => {
      if (isViewingAsAuditor && viewAnnotatorId) {
        const timeSpentMs = Math.round(Date.now() - startTimeRef.current);
        const result = await saveAnnotationAsReviewer({
          taskId: taskConfig.id,
          itemId: item.id,
          annotatorUserId: viewAnnotatorId,
          labels: payload.labels,
          booleanAnswers: payload.booleanAnswers,
          scores: payload.scores,
          overallComment: payload.overallComment,
          status: payload.status,
          timeSpentMs,
        });
        if (!result.error) store.markSaved();
        return result;
      }
      const timeSpentMs = Math.round(Date.now() - startTimeRef.current);
      const result = await saveAnnotation({
        taskId: taskConfig.id,
        itemId: item.id,
        labels: payload.labels,
        booleanAnswers: payload.booleanAnswers,
        scores: payload.scores,
        overallComment: payload.overallComment,
        status: payload.status,
        timeSpentMs,
      });
      if (!result.error) {
        store.markSaved();
        if (
          !hasShownCelebration.current &&
          !isViewingAsAuditor &&
          props.displayIndex === totalItems &&
          (payload.status === "completed" || payload.status === "reviewed")
        ) {
          hasShownCelebration.current = true;
          setShowCelebration(true);
        }
      }
      return result;
    },
    [
      taskConfig.id,
      item.id,
      store,
      isViewingAsAuditor,
      viewAnnotatorId,
      props.displayIndex,
      totalItems,
    ]
  );

  const savePayload = store.getSavePayload();

  const { isSaving, lastSavedAt, error, flushNow } = useAutoSave(handleSave, savePayload, {
    enabled: canEdit && store.isDirty,
    delayMs: 1000,
  });

  const handleAnnotatorChange = useCallback(
    (userId: string | null) => {
      const base = `/listen-and-log/tasks/${taskConfig.id}/items/${props.displayIndex}`;
      router.push(userId ? `${base}?annotator=${userId}` : base);
    },
    [taskConfig.id, props.displayIndex, router]
  );

  const handleReopen = useCallback(
    async (annotationId: string) => {
      const result = await reopenAnnotation(annotationId);
      if (!result.error) router.refresh();
    },
    [router]
  );

  const handleWordClick = useCallback(
    (index: number) => {
      store.selectWords(new Set([index]));
    },
    [store]
  );

  const handleWordRangeSelect = useCallback(
    (start: number, end: number) => {
      const newSet = new Set<number>();
      for (let i = start; i <= end; i++) newSet.add(i);
      store.selectWords(newSet);
    },
    [store]
  );

  const handleWordContextMenu = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      store.removeLabelsOnWord(index);
    },
    [store]
  );

  const handleAssignLabel = useCallback(
    (labelName: string) => {
      const indices = Array.from(store.selectedWordIndices).sort((a, b) => a - b);
      if (indices.length === 0) return;
      const start = indices[0];
      const end = indices[indices.length - 1];

      store.addLabel({
        start_word_index: start,
        end_word_index: end,
        label_name: labelName,
        comment: "",
      });
      store.clearSelection();
    },
    [store]
  );

  useEffect(() => {
    const onClear = () => store.clearSelection();
    const onAssign = (e: Event) => {
      const detail = (e as CustomEvent<{ index: number }>).detail;
      const idx = detail?.index ?? 0;
      const label = taskLabels[idx];
      if (label && canEdit) handleAssignLabel(label.name);
    };

    window.addEventListener("lnl-shortcut-clearselection", onClear);
    window.addEventListener("lnl-shortcut-assignlabel", onAssign);

    return () => {
      window.removeEventListener("lnl-shortcut-clearselection", onClear);
      window.removeEventListener("lnl-shortcut-assignlabel", onAssign);
    };
  }, [store, taskLabels, canEdit, handleAssignLabel]);

  const handleRemoveLabel = useCallback(
    (index: number) => {
      store.removeLabel(index);
    },
    [store]
  );

  const handleUpdateLabelComment = useCallback(
    (index: number, comment: string) => {
      store.updateLabelComment(index, comment);
    },
    [store]
  );

  const handleFlag = useCallback(() => {
    store.setStatus("flagged");
  }, [store]);

  const handleSkip = useCallback(() => {
    const nextDisplayIndex = props.displayIndex + 1;
    if (nextDisplayIndex <= totalItems) {
      router.push(
        `/listen-and-log/tasks/${taskConfig.id}/items/${nextDisplayIndex}`
      );
    }
  }, [props.displayIndex, totalItems, taskConfig.id, router]);

  return (
    <>
      {isAuditor && annotators.length > 0 && (
        <AuditBar
          annotators={annotators}
          selectedAnnotatorId={viewAnnotatorId ?? null}
          onAnnotatorChange={handleAnnotatorChange}
          statusFilter="all"
          onStatusFilterChange={() => {}}
          sortBy="item"
          onSortChange={() => {}}
          onReopen={handleReopen}
          currentAnnotationId={props.existingAnnotation?.id ?? null}
          currentAnnotationStatus={store.status}
        />
      )}
      <WorkspaceLayout
        taskConfig={taskConfig as Parameters<typeof WorkspaceLayout>[0]["taskConfig"]}
        item={item}
        totalItems={totalItems}
        completedItems={completedItems}
        itemIndex={props.displayIndex}
        selectedWordIndices={store.selectedWordIndices}
        labels={store.labels}
        onWordClick={canEdit ? handleWordClick : undefined}
        onWordRangeSelect={canEdit ? handleWordRangeSelect : undefined}
        onWordContextMenu={canEdit ? handleWordContextMenu : undefined}
        onFlag={canEdit ? handleFlag : undefined}
        onSkip={handleSkip}
        annotationPanel={
          <div className="flex flex-col gap-4">
            {isViewingAsAuditor && !isEditMode && (
              <LnlButton
                variant="secondary"
                size="sm"
                onClick={() => setIsEditMode(true)}
              >
                Edit Annotation
              </LnlButton>
            )}
            <AnnotationSidePanel
              taskLabels={taskLabels}
              labels={store.labels}
              booleanAnswers={store.booleanAnswers}
              scores={store.scores}
              overallComment={store.overallComment}
              taskOptions={taskConfig.task_options}
              onAssignLabel={handleAssignLabel}
              onRemoveLabel={handleRemoveLabel}
              onUpdateLabelComment={handleUpdateLabelComment}
              onBooleanChange={store.updateBooleanAnswer}
              onScoreChange={store.updateScore}
              onOverallCommentChange={store.updateOverallComment}
              hasSelection={store.selectedWordIndices.size > 0}
              isSaving={isSaving}
              lastSavedAt={lastSavedAt}
              saveError={error}
              readOnly={!canEdit}
              onMarkComplete={() => {
                store.setStatus("completed");
                flushNow();
              }}
              showMarkComplete={canEdit && !isViewingAsAuditor}
              status={store.status}
            />
            {annotationHistory.length > 0 && (
              <AnnotationHistory history={annotationHistory} />
            )}
          </div>
        }
      />

      <CompletionCelebration
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        taskId={taskConfig.id}
        summary={{
          totalItems,
          totalTimeSpentMs: 0,
          labelsAssignedCount: store.labels.length,
          itemsFlaggedCount: store.status === "flagged" ? 1 : 0,
          averageTimePerItemMs: 0,
        }}
      />
    </>
  );
}

export function AnnotationWorkspace(props: Props) {
  const { taskConfig, item, existingAnnotation } = props;

  const labelConfig = taskConfig.label_config as {
    labels?: Array<{ name: string; color: string }>;
  };
  const taskLabels = labelConfig?.labels ?? [];
  const labelColors: Record<string, string> = {};
  for (const l of taskLabels) {
    labelColors[l.name] = l.color;
  }

  return (
    <AnnotationStoreProvider
      taskId={taskConfig.id}
      itemId={item.id}
      labelColors={labelColors}
      initialData={existingAnnotation ?? undefined}
    >
      <AnnotationWorkspaceInner {...props} />
    </AnnotationStoreProvider>
  );
}
